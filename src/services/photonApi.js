import { buildUrl, httpGet, WeatherError, ERROR_MESSAGES } from './http.js';
import { osmId, osmKind } from './osmPlaces.js';

// Photon (by Komoot): a second, independently hosted OpenStreetMap geocoder,
// used when Nominatim fails or is slow to answer, so OSM alternate names
// ("Kanyakumari", "Bangalore") stay searchable.
// GET https://photon.komoot.io/api/?q=Kanyakumari&limit=10&lang=en → GeoJSON FeatureCollection
const PHOTON_URL = 'https://photon.komoot.io/api/';
const TIMEOUT_MS = 7000;

function toCandidate(feature, index) {
  const p = feature?.properties ?? {};
  const [longitude, latitude] = feature?.geometry?.coordinates ?? [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !p.name) return null;
  return {
    source: 'photon',
    id: osmId(p.osm_type, p.osm_id, `${latitude},${longitude}`),
    name: p.name,
    kind: osmKind(p.osm_key, p.osm_value, p.type),
    area: p.city || p.county || p.district || '',
    region: p.state || '',
    country: p.country || '',
    countryCode: String(p.countrycode ?? '').toUpperCase(),
    timezone: '',
    population: null,
    // Photon has no importance score but returns results best-first; use the
    // position as a modest prominence signal.
    importance: Math.max(0.1, 0.5 - index * 0.05),
    latitude,
    longitude,
  };
}

export async function searchPhoton(text, { signal } = {}) {
  const url = buildUrl(PHOTON_URL, { q: text, limit: 10, lang: 'en' });
  const data = await httpGet(url, { signal, timeoutMs: TIMEOUT_MS });
  if (!data || !Array.isArray(data.features)) throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  return data.features.map(toCandidate).filter(Boolean);
}
