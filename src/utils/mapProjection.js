export const TILE_SIZE = 256;

// Web-Mercator: latitude/longitude → world pixel coordinates at a zoom level.
export function project(lat, lon, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

// Inverse of project(): world pixel coordinates → latitude/longitude.
export function unproject(x, y, zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / scale))) * 180) / Math.PI;
  return { latitude: lat, longitude: ((((lon + 180) % 360) + 360) % 360) - 180 };
}
