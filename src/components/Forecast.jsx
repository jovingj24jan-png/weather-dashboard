import { useState } from 'react';
import { Icon, WeatherIcon } from './Icons.jsx';
import { getWeatherCondition } from '../utils/weatherCodes.js';
import { formatMonthDay, formatTemp, formatWeekday } from '../utils/format.js';

const nextDate = (isoDate) => new Date(Date.parse(`${isoDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);

// "Today"/"Tomorrow" by comparing dates with the location's own current date,
// so labels stay right after local midnight.
const dayName = (date, todayDate) =>
  date === todayDate ? 'Today' : date === nextDate(todayDate) ? 'Tomorrow' : formatWeekday(date);

export default function Forecast({ daily, todayDate, windUnit, selectedIndex, onSelect }) {
  const [detailed, setDetailed] = useState(false);

  return (
    <section
      id="section-forecast"
      className={`card forecast ${detailed ? 'is-detailed' : ''}`}
      aria-labelledby="forecast-title"
    >
      <div className="card-head">
        <h2 id="forecast-title">Next 7 Days</h2>
        <button
          type="button"
          className="link-btn"
          aria-expanded={detailed}
          aria-controls="forecast-list"
          onClick={() => setDetailed((v) => !v)}
        >
          {detailed ? 'Show less' : 'See all'}
        </button>
      </div>
      <ol id="forecast-list" className="forecast-list">
        {daily.map((day, i) => {
          const info = getWeatherCondition(day.weatherCode, true);
          const name = dayName(day.date, todayDate);
          const selected = i === selectedIndex;
          const rain = day.precipitationProbability != null ? `${Math.round(day.precipitationProbability)}%` : '—';
          return (
            <li key={day.date}>
              <button
                type="button"
                className={`forecast-row ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                aria-label={`${name}, ${formatMonthDay(day.date)}: ${info.label}, high ${Math.round(day.max)}, low ${Math.round(day.min)}, ${rain} chance of rain`}
                onClick={() => onSelect(i)}
              >
                <span className="fr-day">
                  <span className="fr-name">
                    <span className="fr-name-long">{name}</span>
                    <span className="fr-name-short" aria-hidden="true">
                      {day.date === todayDate ? 'Today' : formatWeekday(day.date, true)}
                    </span>
                  </span>
                  <small className="fr-date">{formatMonthDay(day.date)}</small>
                </span>
                <WeatherIcon icon={info.icon} size={30} />
                <span className="fr-cond">
                  <span className="fr-label">{info.label}</span>
                  <small className="fr-meta">
                    <span className="fr-wind">
                      <Icon name="wind" size={12} />
                      {day.windMax != null ? `${Math.round(day.windMax)} ${windUnit}` : '—'}
                    </span>
                  </small>
                </span>
                <span className="fr-rain" title="Chance of rain">
                  <Icon name="umbrella" size={13} />
                  {rain}
                </span>
                <span className="fr-temps">
                  {formatTemp(day.max)}
                  <span className="fr-sep" aria-hidden="true">
                    /
                  </span>
                  <span className="fr-min">{formatTemp(day.min)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
