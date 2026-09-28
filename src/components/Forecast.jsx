import { useState } from 'react';
import { Icon, WeatherIcon } from './Icons.jsx';
import { getWeatherInfo } from '../utils/weatherCodes.js';
import { formatMonthDay, formatTemp, formatWeekday } from '../utils/format.js';

const dayName = (date, i) => (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatWeekday(date));

export default function Forecast({ daily, windUnit, selectedIndex, onSelect }) {
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
          const info = getWeatherInfo(day.weatherCode);
          const name = dayName(day.date, i);
          const selected = i === selectedIndex;
          const rain = day.precipitationProbability != null ? `${Math.round(day.precipitationProbability)}%` : '—';
          return (
            <li key={day.date}>
              <button
                type="button"
                className={`forecast-row ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                aria-label={`${name}: ${info.label}, high ${Math.round(day.max)}, low ${Math.round(day.min)}, ${rain} chance of rain`}
                onClick={() => onSelect(i)}
              >
                <span className="fr-day">
                  <span className="fr-name">{name}</span>
                  <small className="fr-date">{formatMonthDay(day.date)}</small>
                </span>
                <WeatherIcon icon={info.icon} size={30} />
                <span className="fr-cond">
                  <span className="fr-label">{info.label}</span>
                  <small className="fr-meta">
                    <span>
                      <Icon name="umbrella" size={12} />
                      {rain}
                    </span>
                    <span className="fr-wind">
                      <Icon name="wind" size={12} />
                      {day.windMax != null ? `${Math.round(day.windMax)} ${windUnit}` : '—'}
                    </span>
                  </small>
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
