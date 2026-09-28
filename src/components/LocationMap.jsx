import { useEffect, useState } from 'react';
import { Icon, WeatherIcon } from './Icons.jsx';
import { getWeatherInfo } from '../utils/weatherCodes.js';
import { formatClock, formatTemp, placeLabel } from '../utils/format.js';
import { project, TILE_SIZE } from '../utils/mapProjection.js';
import { NEARBY_ZOOM } from '../hooks/useNearbyWeather.js';

const MIN_ZOOM = 3;
const MAX_ZOOM = 13;
const RADIUS = 3; // tiles drawn around the centre tile in each direction

const NARROW_QUERY = '(max-width: 767px)';

// Phones get one zoom level further out, which halves the marker offsets so
// the nearby readings stay inside the smaller map.
function useBaseZoom() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow ? NEARBY_ZOOM - 1 : NEARBY_ZOOM;
}

export default function LocationMap({ location, forecast, nearby }) {
  const baseZoom = useBaseZoom();
  const [zoom, setZoom] = useState(baseZoom);
  const [showNearby, setShowNearby] = useState(true);
  useEffect(() => setZoom(baseZoom), [location.id, baseZoom]);

  const center = project(location.latitude, location.longitude, zoom);
  const cx = Math.floor(center.x / TILE_SIZE);
  const cy = Math.floor(center.y / TILE_SIZE);
  const count = 2 ** zoom;

  const tiles = [];
  for (let dy = -RADIUS; dy <= RADIUS; dy += 1) {
    for (let dx = -RADIUS; dx <= RADIUS; dx += 1) {
      const ty = cy + dy;
      if (ty < 0 || ty >= count) continue;
      const tx = (((cx + dx) % count) + count) % count;
      tiles.push({
        key: `${zoom}-${cx + dx}-${ty}`,
        src: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
        left: (cx + dx) * TILE_SIZE - center.x,
        top: ty * TILE_SIZE - center.y,
      });
    }
  }

  const markers = showNearby
    ? nearby.map((p) => {
        const pos = project(p.latitude, p.longitude, zoom);
        return { ...p, left: pos.x - center.x, top: pos.y - center.y, info: getWeatherInfo(p.weatherCode) };
      })
    : [];

  const { current, daily } = forecast;
  const info = getWeatherInfo(current.weatherCode);
  const osmUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=${zoom}/${location.latitude}/${location.longitude}`;

  return (
    <section id="section-map" className="card map-card" aria-labelledby="map-title">
      <h2 id="map-title" className="sr-only">
        Location map
      </h2>
      <div
        className="map-view"
        role="img"
        aria-label={`Map centred on ${location.name}${location.country ? `, ${location.country}` : ''}, zoom level ${zoom}${
          markers.length ? `, with ${markers.length} nearby temperature readings` : ''
        }`}
      >
        <div className="map-tiles" aria-hidden="true">
          {tiles.map((t) => (
            <img
              key={t.key}
              src={t.src}
              alt=""
              width={TILE_SIZE}
              height={TILE_SIZE}
              loading="lazy"
              draggable="false"
              style={{ transform: `translate(${t.left}px, ${t.top}px)` }}
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          ))}
          {markers.map((m) => (
            <div
              key={`${m.latitude},${m.longitude}`}
              className="map-temp"
              style={{ transform: `translate(calc(${m.left}px - 50%), calc(${m.top}px - 50%))` }}
            >
              <WeatherIcon icon={m.info.icon} isDay={m.isDay} size={30} />
              <span>{formatTemp(m.temperature)}</span>
            </div>
          ))}
        </div>

        <div className="map-marker" aria-hidden="true">
          <span className="map-pulse" />
          <span className="map-dot" />
        </div>

        <div className="map-info">
          <p className="map-info-temp">{formatTemp(current.temperature)}</p>
          <div className="map-info-text">
            <strong>{location.name}</strong>
            <span>{info.label}</span>
          </div>
          {daily[0].sunrise && daily[0].sunset && (
            <p className="map-info-sun">
              <span>
                <Icon name="sunrise" size={13} /> {formatClock(daily[0].sunrise)}
              </span>
              <span>
                <Icon name="sunrise" size={13} className="sunset-icon" /> {formatClock(daily[0].sunset)}
              </span>
            </p>
          )}
        </div>

        <a
          className="icon-btn map-expand"
          href={osmUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open this location in OpenStreetMap (new tab)"
        >
          <Icon name="expand" size={16} />
        </a>

        <div className="map-controls">
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 1))}
          >
            <Icon name="plus" size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 1))}
          >
            <Icon name="minus" size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Reset zoom"
            disabled={zoom === baseZoom}
            onClick={() => setZoom(baseZoom)}
          >
            <Icon name="target" size={16} />
          </button>
          <button
            type="button"
            className={`icon-btn ${showNearby ? 'is-on' : ''}`}
            aria-label="Show nearby temperatures"
            aria-pressed={showNearby}
            onClick={() => setShowNearby((v) => !v)}
          >
            <Icon name="layers" size={16} />
          </button>
        </div>

        <p className="map-attrib">
          ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{' '}
          contributors
        </p>
      </div>
      <p className="sr-only">
        {location.name}, {placeLabel(location)}. {Math.abs(location.latitude).toFixed(2)}°{' '}
        {location.latitude >= 0 ? 'N' : 'S'}, {Math.abs(location.longitude).toFixed(2)}°{' '}
        {location.longitude >= 0 ? 'E' : 'W'}.
      </p>
    </section>
  );
}
