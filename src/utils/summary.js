import { formatHour } from './format.js';
import { getWeatherCondition, isRainCode, isStormCode } from './weatherCodes.js';

// A short, rule-based outlook built only from the forecast data (no AI, no
// guessing): at most two statements, most important first, worded as
// likelihoods ("likely", "possible") because forecasts are probabilities.

const HOURS_AHEAD = 12;

export function buildSummary(forecast, time) {
  if (!forecast || !time || time.hourIndex < 0) return [];
  const hours = forecast.hourly.slice(time.hourIndex, time.hourIndex + HOURS_AHEAD);
  if (hours.length === 0) return [];
  const fahrenheit = forecast.units.temperature.includes('F');
  const at = (h) => formatHour(h.time);
  const statements = [];

  const storm = hours.find((h) => isStormCode(h.weatherCode) && (h.precipitationProbability ?? 0) >= 30);
  if (storm) statements.push({ emoji: '⛈️', text: `Thunderstorms are possible around ${at(storm)}.` });

  const nowCode = forecast.current.weatherCode;
  const likelyRain = hours.find((h) => (h.precipitationProbability ?? 0) >= 60);
  const possibleRain = hours.find((h) => (h.precipitationProbability ?? 0) >= 30);
  if (!storm && isRainCode(nowCode) && (forecast.current.precipitation ?? 0) > 0) {
    statements.push({ emoji: '🌧️', text: 'Rain is falling at the moment.' });
  } else if (!storm && likelyRain) {
    statements.push({ emoji: '🌧️', text: `Rain is likely around ${at(likelyRain)}.` });
  } else if (!storm && possibleRain) {
    statements.push({ emoji: '🌦️', text: `A chance of showers around ${at(possibleRain)}.` });
  }

  const gusty = hours.reduce((best, h) => ((h.windGusts ?? 0) > (best?.windGusts ?? 0) ? h : best), null);
  if (gusty && gusty.windGusts >= 50) {
    statements.push({
      emoji: '🌬️',
      text: `Strong gusts up to ${Math.round(gusty.windGusts)} ${forecast.units.wind} around ${at(gusty)}.`,
    });
  }

  const feels = hours.map((h) => h.apparentTemperature).filter((v) => v !== null);
  if (feels.length) {
    const hot = Math.max(...feels);
    const cold = Math.min(...feels);
    if (hot >= (fahrenheit ? 104 : 40)) statements.push({ emoji: '🥵', text: `Very hot: feels like up to ${Math.round(hot)}°.` });
    else if (cold <= (fahrenheit ? 32 : 0)) statements.push({ emoji: '🥶', text: `Freezing: feels as low as ${Math.round(cold)}°.` });
  }

  const uv = time.today?.uvIndexMax;
  if (time.isDay && uv !== null && uv !== undefined && uv >= 8) {
    statements.push({ emoji: '☀️', text: `Very high UV today (index up to ${Math.round(uv)}).` });
  }

  if (statements.length === 0) {
    const dry = hours.every((h) => (h.precipitationProbability ?? 0) < 20);
    const condition = getWeatherCondition(nowCode, time.isDay);
    const clear = ['clear'].includes(condition.atmosphere);
    if (dry && clear) {
      statements.push(
        time.isDay
          ? { emoji: '☀️', text: 'Clear and dry for the next few hours.' }
          : { emoji: '🌙', text: 'Clear skies tonight.' },
      );
    } else if (dry) {
      statements.push({ emoji: '☁️', text: 'Dry, with some cloud over the next 12 hours.' });
    } else {
      statements.push({ emoji: '🌤️', text: 'Mostly settled; a low chance of showers.' });
    }
  }
  return statements.slice(0, 2);
}
