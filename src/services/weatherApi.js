import { buildUrl, httpGet, WeatherError, ERROR_MESSAGES } from './http.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'visibility',
  'is_day',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'uv_index',
];
const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'precipitation_sum',
  'relative_humidity_2m_mean',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
  'uv_index_max',
];
const HOURLY_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'is_day',
  'wind_speed_10m',
  'wind_gusts_10m',
];

const unitParams = (unit) => (unit === 'fahrenheit' ? { temperature_unit: 'fahrenheit' } : {});

const isNumberArray = (arr, length, { allowNull = true } = {}) =>
  Array.isArray(arr) && arr.length === length && arr.every((v) => (allowNull && v === null) || typeof v === 'number');

const FORECAST_DAYS = 7;

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
// Open-Meteo local times look like "2026-09-28" (daily) or "2026-09-28T14:00".
const isDateString = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);
const isDateArray = (arr) => Array.isArray(arr) && arr.every(isDateString);

// Everything the dashboard reads without a fallback is checked here, so a
// partial or unexpected response becomes a 'malformed' error instead of a crash.
function assertForecastShape(data) {
  const { current, daily, hourly } = data ?? {};
  const ok =
    isFiniteNumber(data?.latitude) &&
    isFiniteNumber(data?.longitude) &&
    isFiniteNumber(data?.utc_offset_seconds) &&
    current &&
    isDateString(current.time) &&
    isFiniteNumber(current.temperature_2m) &&
    isFiniteNumber(current.weather_code) &&
    daily &&
    isDateArray(daily.time) &&
    daily.time.length >= FORECAST_DAYS &&
    isNumberArray(daily.temperature_2m_max, daily.time.length, { allowNull: false }) &&
    isNumberArray(daily.temperature_2m_min, daily.time.length, { allowNull: false }) &&
    isNumberArray(daily.weather_code, daily.time.length, { allowNull: false }) &&
    hourly &&
    isDateArray(hourly.time) &&
    isNumberArray(hourly.temperature_2m, hourly.time.length);
  if (!ok) throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
}

// Step 2 of the search flow: one GET for current, hourly and 7-day daily data.
// GET https://api.open-meteo.com/v1/forecast?latitude=13.08&longitude=80.27&current=...&daily=...&forecast_days=7&timezone=auto
export async function getWeather({ latitude, longitude }, { unit = 'celsius', signal } = {}) {
  const url = buildUrl(FORECAST_URL, {
    latitude,
    longitude,
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    hourly: HOURLY_FIELDS,
    forecast_days: FORECAST_DAYS,
    timezone: 'auto',
    wind_speed_unit: 'kmh',
    ...unitParams(unit),
  });

  const data = await httpGet(url, { signal });
  assertForecastShape(data);

  const { current, daily, hourly } = data;
  const unitLabel = (value, fallback) => (typeof value === 'string' && value ? value : fallback);
  const dateOrNull = (value) => (isDateString(value) ? value : null);
  const num = (value) => (isFiniteNumber(value) ? value : null);
  const flag = (value) => (value === 0 || value === 1 ? value === 1 : null);
  return {
    // The location's own clock: IANA zone name (e.g. "Europe/London") + offset fallback.
    zone: {
      timeZone: typeof data.timezone === 'string' ? data.timezone : '',
      utcOffsetSeconds: data.utc_offset_seconds,
    },
    units: {
      temperature: unitLabel(data.current_units?.temperature_2m, unit === 'fahrenheit' ? '°F' : '°C'),
      wind: unitLabel(data.current_units?.wind_speed_10m, 'km/h'),
      precipitation: unitLabel(data.current_units?.precipitation, 'mm'),
    },
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windDirection: num(current.wind_direction_10m),
      windGusts: num(current.wind_gusts_10m),
      pressure: num(current.pressure_msl),
      uvIndex: num(current.uv_index),
      visibility: current.visibility,
      isDay: current.is_day !== 0,
    },
    daily: daily.time.slice(0, FORECAST_DAYS).map((date, i) => ({
      date,
      weatherCode: daily.weather_code[i],
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      precipitationProbability: daily.precipitation_probability_max?.[i] ?? null,
      precipitationSum: daily.precipitation_sum?.[i] ?? null,
      humidityMean: daily.relative_humidity_2m_mean?.[i] ?? null,
      windMax: daily.wind_speed_10m_max?.[i] ?? null,
      sunrise: dateOrNull(daily.sunrise?.[i]),
      sunset: dateOrNull(daily.sunset?.[i]),
      uvIndexMax: num(daily.uv_index_max?.[i]),
    })),
    hourly: hourly.time.map((time, i) => ({
      time,
      temperature: hourly.temperature_2m[i],
      apparentTemperature: num(hourly.apparent_temperature?.[i]),
      humidity: num(hourly.relative_humidity_2m?.[i]),
      precipitation: num(hourly.precipitation?.[i]),
      precipitationProbability: num(hourly.precipitation_probability?.[i]),
      weatherCode: num(hourly.weather_code?.[i]),
      isDay: flag(hourly.is_day?.[i]),
      windSpeed: num(hourly.wind_speed_10m?.[i]),
      windGusts: num(hourly.wind_gusts_10m?.[i]),
    })),
  };
}

// One GET for all saved cities: Open-Meteo accepts comma-separated coordinates
// and returns an array of results in the same order.
export async function getCurrentWeatherForMany(locations, { unit = 'celsius', signal } = {}) {
  if (locations.length === 0) return [];
  const url = buildUrl(FORECAST_URL, {
    latitude: locations.map((l) => l.latitude),
    longitude: locations.map((l) => l.longitude),
    current: ['temperature_2m', 'weather_code', 'is_day'],
    timezone: 'auto',
    ...unitParams(unit),
  });

  const data = await httpGet(url, { signal });
  const list = Array.isArray(data) ? data : [data];
  if (list.length !== locations.length || list.some((d) => !isFiniteNumber(d?.current?.temperature_2m))) {
    throw new WeatherError('malformed', ERROR_MESSAGES.malformed);
  }
  return list.map((d) => ({
    temperature: d.current.temperature_2m,
    weatherCode: d.current.weather_code,
    isDay: d.current.is_day !== 0,
  }));
}
