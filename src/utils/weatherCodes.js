// WMO weather interpretation codes as documented by Open-Meteo.
// `icon` keys are rendered by <WeatherIcon />.
const WEATHER_CODES = {
  0: { label: 'Clear', icon: 'clear' },
  1: { label: 'Mainly Clear', icon: 'mostly-clear' },
  2: { label: 'Partly Cloudy', icon: 'partly-cloudy' },
  3: { label: 'Overcast', icon: 'cloudy' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Rime Fog', icon: 'fog' },
  51: { label: 'Light Drizzle', icon: 'drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Heavy Drizzle', icon: 'drizzle' },
  56: { label: 'Freezing Drizzle', icon: 'sleet' },
  57: { label: 'Freezing Drizzle', icon: 'sleet' },
  61: { label: 'Light Rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy Rain', icon: 'heavy-rain' },
  66: { label: 'Freezing Rain', icon: 'sleet' },
  67: { label: 'Freezing Rain', icon: 'sleet' },
  71: { label: 'Light Snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy Snow', icon: 'snow' },
  77: { label: 'Snow Grains', icon: 'snow' },
  80: { label: 'Rain Showers', icon: 'showers' },
  81: { label: 'Rain Showers', icon: 'showers' },
  82: { label: 'Violent Showers', icon: 'heavy-rain' },
  85: { label: 'Snow Showers', icon: 'snow' },
  86: { label: 'Snow Showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunder' },
  96: { label: 'Thunderstorm, Hail', icon: 'thunder' },
  99: { label: 'Thunderstorm, Hail', icon: 'thunder' },
};

const UNKNOWN = { label: 'Unknown', icon: 'cloudy' };

export function getWeatherInfo(code) {
  return WEATHER_CODES[code] ?? UNKNOWN;
}
