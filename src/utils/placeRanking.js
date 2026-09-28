// Generic location ranking. No place names live here: every decision comes from
// the geocoders' own data (name, place type, population/importance, position).

// How useful each kind of place is as a "weather location". Populated places
// first; administrative areas and natural features next; airports, roads and
// buildings only when nothing better exists.
const KIND_WEIGHT = {
  city: 1,
  town: 0.9,
  suburb: 0.8,
  village: 0.75,
  district: 0.7,
  island: 0.7,
  region: 0.55,
  country: 0.55,
  natural: 0.5,
  poi: 0.1,
};

const SETTLEMENT_KINDS = new Set(['city', 'town', 'suburb', 'village']);

// exact: same name; alias: the geocoder matched an alternate/former name
// (e.g. its index maps the query to an official name); partial: the name only
// starts with the query ("Bangalore Town" for "Bangalore").
const MATCH_WEIGHT = { exact: 1, alias: 0.95, partial: 0.55 };

const SAME_PLACE_KM = 15; // same name this close → one place listed twice
const SAME_SPOT_KM = 3; // anything this close → one place (spelling variants)
const ALTERNATIVE_RATIO = 0.6; // offered as "other matches" above this share of the top score
const AMBIGUOUS_RATIO = 0.94; // a close second, far away → ask the user
const AMBIGUOUS_MIN_KM = 50;
const MIN_POPULATION_SHARE = 0.5;
const MAX_OPTIONS = 5;

// Case-, accent- and punctuation-insensitive form used for all comparisons.
function fold(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// " KANYAKUMARI. " → name "KANYAKUMARI"; "Springfield, Illinois" → name +
// qualifier ["illinois"] used to prefer results in that region/country.
export function parseQuery(raw) {
  const text = String(raw ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[\s.,;:!?"'()[\]-]+|[\s.,;:!?"'()[\]-]+$/g, '');
  const [name = '', ...rest] = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return { text, name, qualifiers: rest.map(fold).filter(Boolean) };
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function matchType(candidate, queryName) {
  const name = fold(candidate.name);
  const query = fold(queryName);
  if (name === query) return 'exact';
  if (name.startsWith(query)) return candidate.source === 'nominatim' ? 'alias' : 'partial';
  return 'alias';
}

// 0–1: population on a log scale (≈1 for 100M) or the geocoder's importance.
function prominence(candidate) {
  const pop = candidate.population > 0 ? Math.min(1, Math.log10(candidate.population) / 8) : 0;
  return Math.max(pop, candidate.importance ?? 0);
}

function qualifierFactor(candidate, qualifiers) {
  if (qualifiers.length === 0) return 1;
  const fields = [candidate.region, candidate.area, candidate.country, candidate.countryCode].map(fold);
  const matches = qualifiers.every((q) => fields.some((f) => f && (f === q || f.includes(q))));
  return matches ? 1.5 : 0.4;
}

const rankOf = (c) => MATCH_WEIGHT[c.match] * 10 + KIND_WEIGHT[c.kind];

// Both geocoders often return the same place; keep one entry, combining their data.
function mergeDuplicates(candidates) {
  const merged = [];
  for (const c of candidates) {
    const twin = merged.find((m) => {
      const km = distanceKm(m, c);
      return km < SAME_SPOT_KM || (km < SAME_PLACE_KM && fold(m.name) === fold(c.name));
    });
    if (!twin) {
      merged.push({ ...c });
      continue;
    }
    const [best, other] = rankOf(c) > rankOf(twin) ? [c, twin] : [twin, c];
    Object.assign(twin, {
      ...other,
      ...best,
      population: Math.max(twin.population ?? 0, c.population ?? 0) || null,
      importance: Math.max(twin.importance ?? 0, c.importance ?? 0) || null,
      region: best.region || other.region,
      area: best.area || other.area,
      timezone: best.timezone || other.timezone,
    });
  }
  return merged;
}

/**
 * Ranks geocoder candidates for a query and decides what to show.
 * Returns { place, alternatives, ambiguous, renamedFrom } or null when empty.
 * `ambiguous` means two strong, distant matches: the UI asks the user to choose.
 */
export function rankPlaces(candidates, query) {
  const scored = mergeDuplicates(candidates.map((c) => ({ ...c, match: matchType(c, query.name) })))
    .map((c) => ({
      ...c,
      score:
        MATCH_WEIGHT[c.match] *
        (0.35 * KIND_WEIGHT[c.kind] + 0.65 * prominence(c)) *
        qualifierFactor(c, query.qualifiers),
    }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  const [top, ...rest] = scored;
  // Other matches must carry the searched name ("London, Ontario"). When the top
  // result came from an alternate name, OSM's curated alternates are allowed
  // too; GeoNames' looser alternate-name hits are not offered.
  const alternatives = rest
    .filter(
      (c) =>
        c.score >= top.score * ALTERNATIVE_RATIO &&
        (c.match === 'exact' || (top.match !== 'exact' && c.source === 'nominatim')),
    )
    .slice(0, MAX_OPTIONS - 1);
  // Log-scaled scores compress small towns together, so when both places have
  // a population, a close second must also be comparable in real size.
  const comparableSize = (c) =>
    !(c.population > 0 && top.population > 0) || c.population >= top.population * MIN_POPULATION_SHARE;
  const ambiguous = alternatives.some(
    (c) =>
      c.score >= top.score * AMBIGUOUS_RATIO &&
      comparableSize(c) &&
      SETTLEMENT_KINDS.has(c.kind) &&
      SETTLEMENT_KINDS.has(top.kind) &&
      distanceKm(c, top) > AMBIGUOUS_MIN_KM,
  );
  const renamed = !fold(top.name).includes(fold(query.name));

  return {
    place: toPlace(top),
    alternatives: alternatives.map(toPlace),
    ambiguous,
    renamedFrom: renamed ? query.name : null,
  };
}

const KIND_LABEL = {
  district: 'district',
  region: 'region',
  island: 'island',
  natural: 'landmark',
  poi: 'place',
  country: 'country',
};

// The shape the rest of the app uses for a location.
function toPlace(c) {
  return {
    id: c.id,
    name: c.name,
    area: c.area && fold(c.area) !== fold(c.name) ? c.area : '',
    region: c.region ?? '',
    country: c.country ?? '',
    countryCode: c.countryCode ?? '',
    timezone: c.timezone ?? '',
    kind: KIND_LABEL[c.kind] ?? '',
    latitude: c.latitude,
    longitude: c.longitude,
  };
}
