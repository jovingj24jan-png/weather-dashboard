// Shared by the two OpenStreetMap geocoders (Nominatim and Photon): both return
// OSM features, so they classify places the same way and share stable ids.

const PLACE_KINDS = {
  city: 'city',
  town: 'town',
  village: 'village',
  hamlet: 'village',
  isolated_dwelling: 'village',
  farm: 'village',
  suburb: 'suburb',
  neighbourhood: 'suburb',
  quarter: 'suburb',
  borough: 'suburb',
  city_block: 'suburb',
  locality: 'suburb',
  island: 'island',
  islet: 'island',
  archipelago: 'island',
  municipality: 'district',
  county: 'district',
  district: 'district',
  state_district: 'district',
  region: 'region',
  province: 'region',
  state: 'region',
  country: 'country',
};

// category/key: 'place', 'boundary', 'natural', 'amenity', ...; type/value: 'town', 'administrative', ...
export function osmKind(category, type, fallbackType) {
  if (category === 'place' || category === 'boundary') {
    return PLACE_KINDS[type] ?? PLACE_KINDS[fallbackType] ?? 'district';
  }
  if (category === 'natural') return 'natural';
  return 'poi';
}

// "node"/"N" → "N", so the same OSM object gets the same id from either service.
export function osmId(osmType, id, fallbackId) {
  const kind = String(osmType ?? 'X')
    .charAt(0)
    .toUpperCase();
  return `osm-${kind}${id ?? fallbackId}`;
}
