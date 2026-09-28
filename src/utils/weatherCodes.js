// The single source of truth for weather conditions. Every part of the UI
// (hero, forecast, hourly strip, map markers, background atmosphere) asks here.
//
// icon       → key for the <WeatherIcon> SVG set
// emoji      → for compact secondary text only; the main icons are SVG
// atmosphere → background effect: clear | clouds | fog | drizzle | rain | heavy-rain | snow | storm

const CONDITIONS = {
  CLEAR_DAY: { label: 'Clear', icon: 'clear', emoji: '☀️', atmosphere: 'clear' },
  CLEAR_NIGHT: { label: 'Clear', icon: 'clear', emoji: '🌙', atmosphere: 'clear' },
  MAINLY_CLEAR_DAY: { label: 'Mainly Clear', icon: 'mostly-clear', emoji: '🌤️', atmosphere: 'clear' },
  MAINLY_CLEAR_NIGHT: { label: 'Mainly Clear', icon: 'mostly-clear', emoji: '🌙', atmosphere: 'clear' },
  PARTLY_CLOUDY_DAY: { label: 'Partly Cloudy', icon: 'partly-cloudy', emoji: '⛅', atmosphere: 'clouds' },
  PARTLY_CLOUDY_NIGHT: { label: 'Partly Cloudy', icon: 'partly-cloudy', emoji: '☁️', atmosphere: 'clouds' },
  CLOUDY: { label: 'Overcast', icon: 'cloudy', emoji: '☁️', atmosphere: 'clouds' },
  FOG: { label: 'Fog', icon: 'fog', emoji: '🌫️', atmosphere: 'fog' },
  RIME_FOG: { label: 'Rime Fog', icon: 'fog', emoji: '🌫️', atmosphere: 'fog' },
  LIGHT_DRIZZLE: { label: 'Light Drizzle', icon: 'drizzle', emoji: '🌦️', atmosphere: 'drizzle' },
  DRIZZLE: { label: 'Drizzle', icon: 'drizzle', emoji: '🌦️', atmosphere: 'drizzle' },
  HEAVY_DRIZZLE: { label: 'Heavy Drizzle', icon: 'drizzle', emoji: '🌧️', atmosphere: 'rain' },
  FREEZING_DRIZZLE: { label: 'Freezing Drizzle', icon: 'sleet', emoji: '🌧️', atmosphere: 'drizzle' },
  LIGHT_RAIN: { label: 'Light Rain', icon: 'rain', emoji: '🌦️', atmosphere: 'rain' },
  RAIN: { label: 'Rain', icon: 'rain', emoji: '🌧️', atmosphere: 'rain' },
  HEAVY_RAIN: { label: 'Heavy Rain', icon: 'heavy-rain', emoji: '🌧️', atmosphere: 'heavy-rain' },
  FREEZING_RAIN: { label: 'Freezing Rain', icon: 'sleet', emoji: '🌧️', atmosphere: 'rain' },
  LIGHT_SNOW: { label: 'Light Snow', icon: 'snow', emoji: '🌨️', atmosphere: 'snow' },
  SNOW: { label: 'Snow', icon: 'snow', emoji: '🌨️', atmosphere: 'snow' },
  HEAVY_SNOW: { label: 'Heavy Snow', icon: 'snow', emoji: '❄️', atmosphere: 'snow' },
  SNOW_GRAINS: { label: 'Snow Grains', icon: 'snow', emoji: '🌨️', atmosphere: 'snow' },
  RAIN_SHOWERS: { label: 'Rain Showers', icon: 'showers', emoji: '🌦️', atmosphere: 'rain' },
  VIOLENT_SHOWERS: { label: 'Violent Showers', icon: 'heavy-rain', emoji: '🌧️', atmosphere: 'heavy-rain' },
  SNOW_SHOWERS: { label: 'Snow Showers', icon: 'snow', emoji: '🌨️', atmosphere: 'snow' },
  THUNDERSTORM: { label: 'Thunderstorm', icon: 'thunder', emoji: '⛈️', atmosphere: 'storm' },
  THUNDERSTORM_HAIL: { label: 'Thunderstorm, Hail', icon: 'thunder', emoji: '⛈️', atmosphere: 'storm' },
  UNKNOWN: { label: 'Unknown', icon: 'cloudy', emoji: '☁️', atmosphere: 'clouds' },
};

// WMO weather interpretation codes (as documented by Open-Meteo) → condition key.
// Functions pick the day/night variant where the sky itself looks different.
const WMO = {
  0: (day) => (day ? 'CLEAR_DAY' : 'CLEAR_NIGHT'),
  1: (day) => (day ? 'MAINLY_CLEAR_DAY' : 'MAINLY_CLEAR_NIGHT'),
  2: (day) => (day ? 'PARTLY_CLOUDY_DAY' : 'PARTLY_CLOUDY_NIGHT'),
  3: 'CLOUDY',
  45: 'FOG',
  48: 'RIME_FOG',
  51: 'LIGHT_DRIZZLE',
  53: 'DRIZZLE',
  55: 'HEAVY_DRIZZLE',
  56: 'FREEZING_DRIZZLE',
  57: 'FREEZING_DRIZZLE',
  61: 'LIGHT_RAIN',
  63: 'RAIN',
  65: 'HEAVY_RAIN',
  66: 'FREEZING_RAIN',
  67: 'FREEZING_RAIN',
  71: 'LIGHT_SNOW',
  73: 'SNOW',
  75: 'HEAVY_SNOW',
  77: 'SNOW_GRAINS',
  80: 'RAIN_SHOWERS',
  81: 'RAIN_SHOWERS',
  82: 'VIOLENT_SHOWERS',
  85: 'SNOW_SHOWERS',
  86: 'SNOW_SHOWERS',
  95: 'THUNDERSTORM',
  96: 'THUNDERSTORM_HAIL',
  99: 'THUNDERSTORM_HAIL',
};

const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const STORM_CODES = new Set([95, 96, 99]);
export const isRainCode = (code) => RAIN_CODES.has(code);
export const isStormCode = (code) => STORM_CODES.has(code);

/**
 * getWeatherCondition(code, isDay) → { key, label, icon, emoji, atmosphere, isDay, ariaLabel }
 * `isDay` should come from the location's own sunrise/sunset (or the API's is_day).
 */
export function getWeatherCondition(code, isDay = true) {
  const entry = WMO[code];
  const key = typeof entry === 'function' ? entry(isDay) : (entry ?? 'UNKNOWN');
  const condition = CONDITIONS[key];
  return {
    key,
    ...condition,
    isDay,
    ariaLabel: `${condition.label}${key.endsWith('_NIGHT') ? ' (night)' : ''}`,
  };
}
