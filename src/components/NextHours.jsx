import { WeatherIcon } from './Icons.jsx';
import { getWeatherCondition } from '../utils/weatherCodes.js';
import { formatHour, formatTemp } from '../utils/format.js';

const HOURS = 24;

// The next 24 hours from the current LOCAL hour of the selected place
// (earlier hours of today are not shown). The first item is "Now".
export default function NextHours({ forecast, time }) {
  if (time.hourIndex < 0) return null;
  const hours = forecast.hourly.slice(time.hourIndex, time.hourIndex + HOURS);

  return (
    <div className="next-hours" role="group" aria-labelledby="next-hours-title">
      <h3 id="next-hours-title" className="next-hours-title">
        Next hours
      </h3>
      <ol className="next-hours-list">
        {hours.map((h, i) => {
          const condition = getWeatherCondition(h.weatherCode, h.isDay ?? true);
          const label = i === 0 ? 'Now' : formatHour(h.time);
          const rain = h.precipitationProbability;
          return (
            <li
              key={h.time}
              className={`hour ${i === 0 ? 'is-now' : ''}`}
              style={{ '--i': Math.min(i, 12) }}
              aria-label={`${label}: ${Math.round(h.temperature)} degrees, ${condition.ariaLabel}${
                rain !== null ? `, ${Math.round(rain)}% chance of rain` : ''
              }`}
            >
              <span className="hour-time">{label}</span>
              <WeatherIcon icon={condition.icon} isDay={h.isDay ?? true} size={32} />
              <span className="hour-temp">{formatTemp(h.temperature)}</span>
              <span className={`hour-rain ${rain >= 30 ? 'is-notable' : ''}`}>
                {rain !== null ? `💧 ${Math.round(rain)}%` : '—'}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
