import { Icon, WeatherIcon } from './Icons.jsx';
import { getWeatherInfo } from '../utils/weatherCodes.js';
import { formatTemp } from '../utils/format.js';

export default function FavoriteCities({
  favorites,
  conditions,
  status,
  activeId,
  pendingId,
  currentLocation,
  isCurrentSaved,
  isFull,
  onSelect,
  onRemove,
  onAddCurrent,
  onFocusSearch,
}) {
  const canAddCurrent = currentLocation && !isCurrentSaved && !isFull;

  return (
    <section id="section-favorites" className="favorites" aria-labelledby="favorites-title">
      <h2 id="favorites-title" className="sr-only">
        Saved cities
      </h2>
      {status === 'error' && (
        <p className="fav-status" role="status">
          <Icon name="alert" size={14} /> Couldn't refresh saved cities
        </p>
      )}
      <ul className="fav-list">
        {favorites.map((fav) => {
          const cond = conditions[fav.id];
          const info = cond ? getWeatherInfo(cond.weatherCode) : null;
          const pending = !cond && status === 'loading';
          const active = activeId === fav.id;
          const opening = pendingId === fav.id;
          return (
            <li key={fav.id} className={`card fav-card ${active ? 'is-active' : ''} ${opening ? 'is-opening' : ''}`}>
              <button
                type="button"
                className="fav-main"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(fav)}
                aria-label={`Show weather for ${fav.name}${cond ? `, currently ${Math.round(cond.temperature)} degrees, ${info.label}` : ''}`}
              >
                <span className="fav-icon">
                  {opening ? (
                    <span className="spinner" aria-hidden="true" />
                  ) : info ? (
                    <WeatherIcon icon={info.icon} isDay={cond.isDay} size={52} />
                  ) : (
                    <span className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
                  )}
                </span>
                <span className="fav-text">
                  <span className="fav-name">{fav.name}</span>
                  <span className="fav-sub">
                    {info?.label ?? (pending ? 'Loading…' : fav.country || 'Unavailable')}
                  </span>
                </span>
                {pending ? (
                  <span className="skeleton" style={{ width: 56, height: 34 }} />
                ) : (
                  <span className="fav-temp">{cond ? formatTemp(cond.temperature) : '—'}</span>
                )}
              </button>
              <button
                type="button"
                className="fav-remove"
                aria-label={`Remove ${fav.name} from saved cities`}
                onClick={() => onRemove(fav.id)}
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          );
        })}
        {!isFull && (
          <li className="fav-add-item">
            <button type="button" className="fav-add" onClick={canAddCurrent ? onAddCurrent : onFocusSearch}>
              <span className="fav-add-icon" aria-hidden="true">
                <Icon name="plus" size={20} />
              </span>
              <span className="fav-add-text">
                {canAddCurrent ? (
                  <>
                    Add <strong>{currentLocation.name}</strong> to your saved cities.
                  </>
                ) : (
                  'Add the cities you are interested in.'
                )}
              </span>
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
