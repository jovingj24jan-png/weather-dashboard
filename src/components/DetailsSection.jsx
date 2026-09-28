import { Icon } from './Icons.jsx';
import { getAqiLevel } from '../services/airQualityApi.js';
import { formatClock, formatPercent, formatPrecip, formatTemp, formatVisibility, formatWind, getWindDirection } from '../utils/format.js';
import { localMinutes } from '../utils/time.js';

const UV_LEVELS = [
  { max: 2, label: 'Low' },
  { max: 5, label: 'Moderate' },
  { max: 7, label: 'High' },
  { max: 10, label: 'Very high' },
  { max: Infinity, label: 'Extreme' },
];
const uvLabel = (uv) => UV_LEVELS.find((l) => uv <= l.max + 0.5)?.label;

function formatDuration(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
}

// ---------------------------------------------------------------- details

function WeatherDetails({ forecast, time }) {
  const { current, units } = forecast;
  const wind = getWindDirection(current.windDirection);
  // Only metrics with real data are listed; nothing is shown as a placeholder value.
  const items = [
    current.apparentTemperature !== null && {
      emoji: '🌡️',
      label: 'Feels like',
      value: formatTemp(current.apparentTemperature),
    },
    current.humidity !== null && { emoji: '💧', label: 'Humidity', value: formatPercent(current.humidity) },
    current.windSpeed !== null && {
      emoji: '🌬️',
      label: 'Wind',
      value: formatWind(current.windSpeed, units.wind),
      note: current.windGusts !== null ? `Gusts ${formatWind(current.windGusts, units.wind)}` : null,
    },
    wind && {
      emoji: '🧭',
      label: 'Wind direction',
      value: (
        <>
          <Icon name="arrowUp" size={16} className="wind-arrow" style={{ transform: `rotate(${wind.degrees + 180}deg)` }} />
          {wind.point}
        </>
      ),
      note: `${Math.round(wind.degrees)}° · ${wind.spoken}`,
      aria: `Wind ${wind.spoken}, ${Math.round(wind.degrees)} degrees`,
    },
    current.visibility !== null && current.visibility !== undefined && {
      emoji: '👁️',
      label: 'Visibility',
      value: formatVisibility(current.visibility),
    },
    current.uvIndex !== null && {
      emoji: '☀️',
      label: 'UV index',
      value: `${Math.round(current.uvIndex)} · ${uvLabel(current.uvIndex)}`,
      note: time.today.uvIndexMax !== null ? `Today's max ${Math.round(time.today.uvIndexMax)}` : null,
    },
    current.pressure !== null && { emoji: '⏲️', label: 'Pressure', value: `${Math.round(current.pressure)} hPa`, note: 'Sea level' },
    current.precipitation !== null && current.precipitation !== undefined && {
      emoji: '🌧️',
      label: 'Precipitation',
      value: formatPrecip(current.precipitation, units.precipitation),
      note: time.today.precipitationSum !== null ? `Today ${formatPrecip(time.today.precipitationSum, units.precipitation)}` : null,
    },
  ].filter(Boolean);

  return (
    <section className="card details" aria-labelledby="details-title">
      <h2 id="details-title">Weather details</h2>
      <dl className="details-grid">
        {items.map((item) => (
          <div key={item.label} className="detail" aria-label={item.aria}>
            <dt>
              <span aria-hidden="true">{item.emoji}</span> {item.label}
            </dt>
            <dd>
              <span className="detail-value">{item.value}</span>
              {item.note && <small>{item.note}</small>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------- daylight

function Daylight({ forecast, time }) {
  const today = time.today;
  const tomorrow = forecast.daily[time.todayIndex + 1];
  if (!today.sunrise || !today.sunset) {
    return (
      <section className="card daylight" aria-labelledby="daylight-title">
        <h2 id="daylight-title">Daylight</h2>
        <p className="card-sub">Sunrise and sunset aren't available for this location today (polar day or night).</p>
      </section>
    );
  }

  const now = localMinutes(time.nowKey);
  const rise = localMinutes(today.sunrise);
  const set = localMinutes(today.sunset);
  const length = set - rise;
  // The sun marker only travels along the arc while the sun is actually up.
  let state;
  if (now < rise) state = { phase: 'before', progress: 0, text: `Sunrise in ${formatDuration(rise - now)}` };
  else if (now < set) state = { phase: 'day', progress: (now - rise) / length, text: `Sunset in ${formatDuration(set - now)}` };
  else {
    const next = tomorrow?.sunrise ? ` · rises ${formatClock(tomorrow.sunrise)}` : '';
    state = { phase: 'after', progress: 1, text: `Sunset was ${formatDuration(now - set)} ago${next}` };
  }

  return (
    <section className={`card daylight is-${state.phase}`} aria-labelledby="daylight-title">
      <div className="card-head">
        <h2 id="daylight-title">Daylight</h2>
        <span className="card-meta">{formatDuration(length)}</span>
      </div>
      <p className="daylight-status">{state.text}</p>
      <div
        className="daylight-track"
        role="img"
        aria-label={
          state.phase === 'day'
            ? `${Math.round(state.progress * 100)}% of today's daylight has passed`
            : state.phase === 'before'
              ? 'Before sunrise'
              : 'After sunset'
        }
      >
        <span className="daylight-fill" style={{ '--progress': state.progress }} />
        {state.phase === 'day' && <span className="daylight-sun" style={{ '--progress': state.progress }} />}
      </div>
      <div className="daylight-times">
        <p>
          <span aria-hidden="true">🌅</span> Sunrise
          <strong>{formatClock(today.sunrise)}</strong>
        </p>
        <p>
          <span aria-hidden="true">🌇</span> Sunset
          <strong>{formatClock(today.sunset)}</strong>
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- air quality

const POLLUTANTS = [
  ['pm25', 'PM2.5'],
  ['pm10', 'PM10'],
  ['no2', 'NO₂'],
  ['o3', 'O₃'],
];

function AirQuality({ airQuality }) {
  if (airQuality === undefined) {
    return (
      <section className="card air" aria-labelledby="air-title" aria-busy="true">
        <h2 id="air-title">Air quality</h2>
        <span className="skeleton" style={{ height: 56, marginTop: 14 }} />
        <span className="skeleton" style={{ height: 40, marginTop: 12 }} />
      </section>
    );
  }
  if (airQuality === null || airQuality.usAqi === null) {
    return (
      <section className="card air" aria-labelledby="air-title">
        <h2 id="air-title">Air quality</h2>
        <p className="card-sub">Air-quality data isn't available for this location right now.</p>
      </section>
    );
  }
  const level = getAqiLevel(airQuality.usAqi);
  return (
    <section className={`card air tone-${level.tone}`} aria-labelledby="air-title">
      <div className="card-head">
        <h2 id="air-title">
          <span aria-hidden="true">🌫️</span> Air quality
        </h2>
        {airQuality.time && <span className="card-meta">As of {formatClock(airQuality.time)}</span>}
      </div>
      <div className="aqi">
        <p className="aqi-value">
          <strong>{Math.round(airQuality.usAqi)}</strong>
          <span>US AQI</span>
        </p>
        <div>
          <p className="aqi-level">{level.label}</p>
          <p className="aqi-advice">{level.advice}</p>
        </div>
      </div>
      <div className="aqi-scale" aria-hidden="true">
        <span style={{ '--pos': Math.min(1, airQuality.usAqi / 300) }} />
      </div>
      <dl className="pollutants">
        {POLLUTANTS.filter(([key]) => airQuality[key] !== null).map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>
              {Math.round(airQuality[key] * 10) / 10} <small>µg/m³</small>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function DetailsSection({ forecast, time }) {
  return (
    <div className="details-row">
      <WeatherDetails forecast={forecast} time={time} />
      <Daylight forecast={forecast} time={time} />
      <AirQuality airQuality={forecast.airQuality} />
    </div>
  );
}
