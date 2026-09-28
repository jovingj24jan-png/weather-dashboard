// Change these to adjust what the dashboard shows on first launch.
export const DEFAULT_CITY = 'Chennai';

// Seed list for the saved-cities row on a first visit only (coordinates, not weather).
// Their weather is always fetched live from Open-Meteo.
export const DEFAULT_FAVORITES = [
  { id: '5128581', name: 'New York', region: 'New York', country: 'United States', countryCode: 'US', latitude: 40.71427, longitude: -74.00597 },
  { id: '2643743', name: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', latitude: 51.50853, longitude: -0.12574 },
];

export const MAX_FAVORITES = 6;
export const MAX_HISTORY = 8;

export const STORAGE_KEYS = {
  favorites: 'weather.favorites',
  history: 'weather.history',
  lastLocation: 'weather.lastLocation',
  unit: 'weather.unit',
  theme: 'weather.theme',
};
