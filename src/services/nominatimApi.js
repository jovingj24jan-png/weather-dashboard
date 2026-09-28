import { buildUrl, httpGet, WeatherError, ERROR_MESSAGES } from './http.js';
import { osmId, osmKind } from './osmPlaces.js';

// OpenStreetMap Nominatim: indexes OSM alternate/former names that Open-Meteo's
// index misses (it knows "Kanniyākumāri" but not "Kanyakumari").
// GET https://nominatim.openstreetmap.org/search?q=Kanyakumari&format=jsonv2&addressdetails=1&limit=10&accept-language=en
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 6000;

// Nominatim's usage policy allows at most one request per second. Searches only
// run on submit, but rapid resubmits are spaced out here to stay within it.
const MIN_INTERVAL_MS = 1100;
let nextSlot = 0;

function waitForSlot(signal) {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS;
  if (wait === 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, wait);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function toCandidate(result) {
  const latitude = Number.parseFloat(result?.lat);
  const longitude = Number.parseFloat(result?.lon);
  const name = result?.name || String(result?.display_name ?? '').split(',')[0];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !name) return null;
  const a = result.address ?? {};
  return {
    source: 'nominatim',
    id: osmId(result.osm_type, result.osm_id, result.place_id),
    name,
    kind: osmKind(result.category, result.type, result.addresstype),
    area: a.city || a.town || a.county || a.state_district || '',
    region: a.state || a.region || a.province || '',
    country: a.country || '',
    countryCode: String(a.country_code ?? '').toUpperCase(),
    timezone: '',
    population: null,
    importance: Number.isFinite(Number(result.importance)) ? Number(result.importance) : null,
    latitude,
    longitude,
  };
}

export async function searchNominatim(text, { signal } = {}) {
  await waitForSlot(signal);
  const url = buildUrl(NOMINATIM_URL, {
    q: text,
    format: 'jsonv2',
    addressdetails: 1,
    limit: 10,
    'accept-language': 'en',
  });
  const data = await httpGet(url, { signal, timeoutMs: TIMEOUT_MS });
  if (!Array.isArray(data)) throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  return data.map(toCandidate).filter(Boolean);
}
