import { Icon, WeatherIcon } from './Icons.jsx';
import { getWeatherInfo } from '../utils/weatherCodes.js';
import { useCityClock } from '../hooks/useCityClock.js';
import {
  formatCityDate,
  formatCityTime,
  formatPercent,
  formatPrecip,
  formatShortDate,
  formatTemp,
  formatVisibility,
  formatWind,
  placeLabel,
} from '../utils/format.js';

export default function CurrentWeather({
  location,
  forecast,
  isFavorite,
  onToggleFavorite,
  favoritesFull,
  onChangeCity,
}) {
  const { current, units, utcOffsetSeconds } = forecast;
  const info = getWeatherInfo(current.weatherCode);
  const now = useCityClock(utcOffsetSeconds);
  const canAdd = isFavorite || !favoritesFull;

  const stats = [
    { icon: 'wind', label: 'Wind', value: formatWind(current.windSpeed, units.wind) },
    { icon: 'droplet', label: 'Humidity', value: formatPercent(current.humidity) },
    { icon: 'eye', label: 'Visibility', value: formatVisibility(current.visibility) },
  ];

  return (
    <section className="card current" aria-labelledby="current-title">
      <div className="current-top">
        <div className="current-place">
          <p className="current-date">
            <time aria-label={`${formatCityDate(now)}, ${formatCityTime(now)} local time`}>
              Today, {formatShortDate(now)} · {formatCityTime(now)}
            </time>
          </p>
          <h1 id="current-title" className="current-city">
            <button type="button" className="city-switch" aria-haspopup="dialog" onClick={onChangeCity}>
              <Icon name="pin" size={16} strokeWidth={2.2} />
              <span>{location.name}</span>
              <Icon name="chevronDown" size={16} strokeWidth={2.2} />
              <span className="sr-only">, change city</span>
            </button>
          </h1>
          <p className="current-region">{placeLabel(location) || 'Current location'}</p>
        </div>
        <button
          type="button"
          className={`fav-toggle ${isFavorite ? 'is-on' : ''}`}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${location.name} from saved cities` : `Save ${location.name}`}
          title={canAdd ? undefined : 'Saved cities are full'}
          disabled={!canAdd}
          onClick={onToggleFavorite}
        >
          <Icon name="star" size={18} filled={isFavorite} />
        </button>
      </div>

      <div className="current-hero">
        <p className="current-cond">{info.label}</p>
        <p className="current-temp" aria-label={`${Math.round(current.temperature)} ${units.temperature}`}>
          {formatTemp(current.temperature)}
          <span className="current-unit">{units.temperature.replace('°', '')}</span>
        </p>
        <WeatherIcon icon={info.icon} isDay={current.isDay} size={132} className="current-icon" />
        <p className="current-feels">
          Feels like {formatTemp(current.apparentTemperature)} · Precip{' '}
          {formatPrecip(current.precipitation, units.precipitation)}
        </p>
      </div>

      <dl className="current-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <Icon name={s.icon} size={20} />
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
