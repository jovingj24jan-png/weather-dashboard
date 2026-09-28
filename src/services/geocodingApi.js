import { buildUrl, httpGet, WeatherError, ERROR_MESSAGES } from './http.js';
import { searchNominatim } from './nominatimApi.js';
import { searchPhoton } from './photonApi.js';
import { parseQuery, rankPlaces } from '../utils/placeRanking.js';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
// A hung request must not hold up results the OpenStreetMap side already has.
const TIMEOUT_MS = 8000;

// GeoNames feature codes (Open-Meteo's source) → the generic kinds used for ranking.
function kindOf(code = '') {
  if (/^PPL(C|A\d?|G)$/.test(code)) return 'city';
  if (code === 'PPL') return 'town';
  if (code === 'PPLX') return 'suburb';
  if (code.startsWith('PPL')) return 'village';
  if (code.startsWith('ADM')) return 'district';
  if (code.startsWith('PCL')) return 'country';
  if (code.startsWith('ISL')) return 'island';
  if (/^(CAPE|MT|MTS|PK|HLL|HLLS|BCH|BAY|LK|VAL|PLAT|PEN|DSRT|RDGE)$/.test(code)) return 'natural';
  return 'poi';
}

function toCandidate(r) {
  if (!r || !r.name || !Number.isFinite(r.latitude) || !Number.isFinite(r.longitude)) return null;
  return {
    source: 'open-meteo',
    id: String(r.id ?? `${r.latitude},${r.longitude}`),
    name: r.name,
    kind: kindOf(r.feature_code),
    area: r.admin2 ?? '',
    region: r.admin1 ?? '',
    country: r.country ?? '',
    countryCode: r.country_code ?? '',
    timezone: r.timezone ?? '',
    population: Number.isFinite(r.population) ? r.population : null,
    importance: null,
    latitude: r.latitude,
    longitude: r.longitude,
  };
}

// GET https://geocoding-api.open-meteo.com/v1/search?name=Chennai&count=20&language=en&format=json
// → { results: [{ id, name, feature_code, admin1, admin2, country, latitude, longitude, population, ... }] }
// Open-Meteo matches on the name only, so any ", qualifier" is left to ranking.
async function searchOpenMeteo(name, { signal }) {
  const url = buildUrl(GEOCODING_URL, { name, count: 20, language: 'en', format: 'json' });
  const data = await httpGet(url, { signal, timeoutMs: TIMEOUT_MS });
  if (!data || typeof data !== 'object') throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  // Open-Meteo omits `results` entirely when nothing matches.
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  const candidates = data.results.map(toCandidate).filter(Boolean);
  if (data.results.length > 0 && candidates.length === 0) throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  return candidates;
}

// If Nominatim hasn't answered by then, ask Photon as well and use whichever
// answers first (a "hedged" request) instead of waiting out the full time limit.
const HEDGE_AFTER_MS = 2500;

// The OpenStreetMap side: Nominatim first; Photon if Nominatim fails or is slow.
// Rejects only when both OSM services failed.
function searchOpenStreetMap(text, { signal }) {
  return new Promise((resolve, reject) => {
    const local = new AbortController();
    const cancelLocal = () => local.abort();
    signal?.addEventListener('abort', cancelLocal, { once: true });
    let done = false;
    let pending = 0;
    let photonStarted = false;
    let lastError;

    const finish = (settle, value) => {
      if (done) return;
      done = true;
      clearTimeout(hedgeTimer);
      signal?.removeEventListener('abort', cancelLocal);
      local.abort(); // cancel the request that lost the race
      settle(value);
    };
    const attempt = (search) => {
      pending += 1;
      search(text, { signal: local.signal }).then(
        (places) => finish(resolve, places),
        (err) => {
          pending -= 1;
          lastError = err;
          if (!photonStarted) startPhoton();
          else if (pending === 0) finish(reject, lastError);
        },
      );
    };
    const startPhoton = () => {
      if (photonStarted || done || signal?.aborted) return;
      photonStarted = true;
      attempt(searchPhoton);
    };
    const hedgeTimer = setTimeout(startPhoton, HEDGE_AFTER_MS);
    attempt(searchNominatim);
  });
}

// When nothing usable came back: only call it "not found" if every source
// actually answered; otherwise say the search couldn't be completed.
function noResultError(failures, sourceCount) {
  if (failures.length === 0) return new WeatherError('not-found', ERROR_MESSAGES['not-found']);
  if (failures.length === sourceCount && failures.every((f) => f?.kind === 'network')) {
    return new WeatherError('network', ERROR_MESSAGES.network);
  }
  return new WeatherError(
    'api',
    failures.length === sourceCount ? ERROR_MESSAGES.searchUnavailable : ERROR_MESSAGES.searchIncomplete,
  );
}

// Step 1 of the search flow: place name → ranked locations → coordinates.
//
//   Open-Meteo geocoding ─┐
//                         ├─ (parallel GETs) → merge → dedupe → rank → place
//   Nominatim ─(fails?)→ Photon ─┘
//
// Any source may fail without failing the search, as long as another answers.
export async function getCoordinates(rawQuery, { signal } = {}) {
  const query = parseQuery(rawQuery);
  if (!query.name) throw new WeatherError('empty', ERROR_MESSAGES.empty);

  const settled = await Promise.allSettled([
    searchOpenMeteo(query.name, { signal }),
    searchOpenStreetMap(query.text, { signal }),
  ]);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const candidates = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []));
  const failures = settled.filter((s) => s.status === 'rejected').map((s) => s.reason);
  const ranked = rankPlaces(candidates, query);
  if (!ranked) throw noResultError(failures, settled.length);
  return ranked;
}
