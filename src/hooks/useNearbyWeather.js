import { useEffect, useState } from 'react';
import { getCurrentWeatherForMany } from '../services/weatherApi.js';
import { project, unproject } from '../utils/mapProjection.js';

export const NEARBY_ZOOM = 7;

// Screen offsets (px at NEARBY_ZOOM) around the city where we sample live
// weather for the map markers — spread so they read like the reference map.
const OFFSETS = [
  [-150, -85],
  [130, -100],
  [-115, 80],
  [150, 70],
  [15, 125],
];

export function useNearbyWeather(location, unit) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    if (!location) return undefined;
    const center = project(location.latitude, location.longitude, NEARBY_ZOOM);
    const samples = OFFSETS.map(([dx, dy]) => unproject(center.x + dx, center.y + dy, NEARBY_ZOOM)).filter(
      (p) => Math.abs(p.latitude) < 80,
    );

    const controller = new AbortController();
    setPoints([]);
    // One GET with all sample coordinates; markers are decorative extras, so a
    // failure just leaves the map without them instead of showing an error.
    getCurrentWeatherForMany(samples, { unit, signal: controller.signal })
      .then((results) => setPoints(samples.map((s, i) => ({ ...s, ...results[i] }))))
      .catch((err) => {
        if (err.name !== 'AbortError' && import.meta.env.DEV) console.warn('[weather] nearby markers unavailable:', err.kind ?? err.name);
      });
    return () => controller.abort();
  }, [location, unit]);

  return points;
}
