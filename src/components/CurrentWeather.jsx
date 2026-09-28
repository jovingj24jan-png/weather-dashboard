import { Icon, WeatherIcon } from './Icons.jsx';
import LocalClock, { LocalDate } from './LocalClock.jsx';
import UpdatedAgo from './UpdatedAgo.jsx';
import { getWeatherCondition } from '../utils/weatherCodes.js';
import { formatPercent, formatTemp, formatWind, placeLabel } from '../utils/format.js';
import { buildSummary } from '../utils/summary.js';

export default function CurrentWeather({
  location,
  forecast,
  time,
  isFavorite,
  onToggleFavorite,
  favoritesFull,
  onChangeCity,
  onRefresh,
  refreshing,
}) {
  const { current, units, zone } = forecast;
  const condition = getWeatherCondition(current.weatherCode, time.isDay);
  const today = time.today;
  const summary = buildSummary(forecast, time);
  const canAdd = isFavorite || !favoritesFull;
  const unit = units.temperature.replace('°', '');

  const stats = [
    { icon: 'wind', label: 'Wind', value: formatWind(current.windSpeed, units.wind) },
    { icon: 'droplet', label: 'Humidity', value: formatPercent(current.humidity) },
    { icon: 'umbrella', label: 'Rain today', value: formatPercent(today.precipitationProbability) },
  ];

  return (
    <section className={`card current period-${time.period}`} aria-labelledby="current-title">
      <div className="current-top">
        <div className="current-place">
          <h1 id="current-title" className="current-city">
            <button type="button" className="city-switch" aria-haspopup="dialog" onClick={onChangeCity}>
              <Icon name="pin" size={16} strokeWidth={2.2} />
              <span>{location.name}</span>
              <Icon name="chevronDown" size={16} strokeWidth={2.2} />
              <span className="sr-only">, change city</span>
            </button>
          </h1>
          <p className="current-region">{placeLabel(location) || 'Current location'}</p>
          <p className="current-date">
            <LocalDate zone={zone} />
          </p>
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

      <p className="current-clock">
        <span className="eyebrow">Local time</span>
        <LocalClock zone={zone} />
      </p>

      <div className="current-hero" key={`${location.id}-${forecast.fetchedAt}`}>
        <p className="eyebrow">Current</p>
        <p className="current-temp" aria-label={`${Math.round(current.temperature)} ${units.temperature}`}>
          {formatTemp(current.temperature)}
          <span className="current-unit">{unit}</span>
        </p>
        <WeatherIcon
          icon={condition.icon}
          isDay={time.isDay}
          size={128}
          label={condition.ariaLabel}
          className="current-icon"
        />
        <p className="current-cond">{condition.label}</p>
        <p className="current-feels">
          <span>Feels like {formatTemp(current.apparentTemperature)}</span>
          <span aria-label={`High ${Math.round(today.max)}, low ${Math.round(today.min)}`}>
            H {formatTemp(today.max)} <span aria-hidden="true">·</span> L {formatTemp(today.min)}
          </span>
        </p>
      </div>

      {summary.length > 0 && (
        <ul className="current-summary" aria-label="Outlook">
          {summary.map((s) => (
            <li key={s.text}>
              <span aria-hidden="true">{s.emoji}</span> {s.text}
            </li>
          ))}
        </ul>
      )}

      <dl className="current-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <Icon name={s.icon} size={20} />
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="current-foot">
        <UpdatedAgo timestamp={forecast.fetchedAt} zone={zone} fromCache={forecast.fromCache} />
        <button
          type="button"
          className={`refresh-btn ${refreshing ? 'is-refreshing' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label={refreshing ? 'Refreshing weather' : 'Refresh weather'}
        >
          <Icon name="refresh" size={16} />
        </button>
      </div>
    </section>
  );
}
