import { buildUrl, httpGet, WeatherError, ERROR_MESSAGES } from './http.js';

// Open-Meteo Air Quality API (same provider, no key; modelled data, hourly).
// GET https://air-quality-api.open-meteo.com/v1/air-quality?latitude=..&longitude=..&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone&timezone=auto
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const TIMEOUT_MS = 10000;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export async function getAirQuality({ latitude, longitude }, { signal } = {}) {
  const url = buildUrl(AIR_QUALITY_URL, {
    latitude,
    longitude,
    current: ['us_aqi', 'pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone'],
    timezone: 'auto',
  });
  const data = await httpGet(url, { signal, timeoutMs: TIMEOUT_MS });
  const c = data?.current;
  if (!c || typeof c !== 'object') throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  const result = {
    time: typeof c.time === 'string' ? c.time : null,
    usAqi: num(c.us_aqi),
    pm25: num(c.pm2_5),
    pm10: num(c.pm10),
    no2: num(c.nitrogen_dioxide),
    o3: num(c.ozone),
  };
  // Nothing usable (e.g. a region the model doesn't cover) → treat as unavailable.
  if (Object.entries(result).every(([k, v]) => k === 'time' || v === null)) {
    throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  }
  return result;
}

// US EPA AQI categories. Labels always accompany the colour (never colour alone).
const AQI_LEVELS = [
  { max: 50, label: 'Good', tone: 'good', advice: 'Air quality is satisfactory.' },
  { max: 100, label: 'Moderate', tone: 'moderate', advice: 'Acceptable; unusually sensitive people may be affected.' },
  { max: 150, label: 'Unhealthy for sensitive groups', tone: 'sensitive', advice: 'Sensitive groups should limit long outdoor exertion.' },
  { max: 200, label: 'Unhealthy', tone: 'unhealthy', advice: 'Everyone may begin to feel effects; limit outdoor exertion.' },
  { max: 300, label: 'Very unhealthy', tone: 'very-unhealthy', advice: 'Health alert: avoid prolonged outdoor exertion.' },
  { max: Infinity, label: 'Hazardous', tone: 'hazardous', advice: 'Health warning: avoid outdoor activity.' },
];

export function getAqiLevel(aqi) {
  if (aqi === null || aqi === undefined) return null;
  return AQI_LEVELS.find((level) => aqi <= level.max);
}
