import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatHour, formatWeekday } from '../utils/format.js';
import { getWeatherCondition } from '../utils/weatherCodes.js';
import NextHours from './NextHours.jsx';

const round1 = (v) => Math.round(v * 10) / 10;
const sum = (vals) => vals.reduce((a, b) => a + b, 0);

// For each metric and range: which Open-Meteo series to plot ('hourly' rows or
// 'daily' rows) and which field of the row holds the value.
const METRICS = {
  temperature: {
    label: 'Temperature',
    kind: 'line',
    source: { day: ['hourly', 'temperature'], week: ['hourly', 'temperature'] },
    axis: (v) => `${Math.round(v)}°`,
    format: (v) => `${Math.round(v)}°`,
    summary: (vals, units) =>
      `High ${Math.round(Math.max(...vals))}° · Low ${Math.round(Math.min(...vals))}° (${units.temperature})`,
  },
  humidity: {
    label: 'Humidity',
    kind: 'line',
    fixedDomain: [0, 100],
    source: { day: ['hourly', 'humidity'], week: ['hourly', 'humidity'] },
    axis: (v) => `${Math.round(v)}%`,
    format: (v) => `${Math.round(v)}%`,
    summary: (vals) => `Average ${Math.round(sum(vals) / vals.length)}% relative humidity`,
  },
  rainfall: {
    label: 'Rainfall',
    kind: 'bar',
    source: { day: ['hourly', 'precipitation'], week: ['daily', 'precipitationSum'] },
    axis: (v) => `${round1(v)}`,
    format: (v, units) => `${round1(v)} ${units.precipitation}`,
    summary: (vals, units) => `Total ${round1(sum(vals))} ${units.precipitation} expected`,
  },
};

const RANGES = [
  { id: 'day', label: '24h' },
  { id: 'week', label: '7 days' },
];

const PAD = { top: 52, right: 12, bottom: 32, left: 42 };

// Monotone cubic interpolation (Fritsch–Carlson): smooth, but never overshoots
// the data, so the curve can't dip below real minimums.
function monotonePath(points) {
  const n = points.length;
  if (n < 2) return '';
  const dx = [];
  const slope = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(points[i + 1].x - points[i].x);
    slope.push((points[i + 1].y - points[i].y) / dx[i]);
  }
  const t = [slope[0]];
  for (let i = 1; i < n - 1; i += 1) {
    t.push(
      slope[i - 1] * slope[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]),
    );
  }
  t.push(slope[n - 2]);
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i] / 3;
    d += `C${points[i].x + h},${points[i].y + h * t[i]} ${points[i + 1].x - h},${points[i + 1].y - h * t[i + 1]} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

function niceDomain(values, metric) {
  if (metric.fixedDomain) return metric.fixedDomain;
  const max = Math.max(...values);
  if (metric.kind === 'bar') return [0, Math.max(1, Math.ceil(max))];
  const lo = Math.floor(Math.min(...values) - 2);
  const hi = Math.ceil(max + 2);
  return [lo, hi === lo ? lo + 4 : hi];
}

function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function Segmented({ label, options, value, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`} role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          className={value === opt.id ? 'is-active' : ''}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const rowDate = (row) => row.date ?? row.time.slice(0, 10);

// Draw the line once, the first time the chart scrolls into view.
function useFirstVisible(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    if (typeof IntersectionObserver !== 'function') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, visible]);
  return visible;
}

const PRECIP_BAR_MAX = 26; // px height of a 100% rain-chance indicator

export default function WeatherOverview({ forecast, time, dayIndex, onSelectDay }) {
  const [metricId, setMetricId] = useState('temperature');
  const [range, setRange] = useState('day');
  const [hoverIndex, setHoverIndex] = useState(null);
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const drawn = useFirstVisible(wrapRef);
  const gradientId = useId();
  const metric = METRICS[metricId];
  const [sourceName, key] = metric.source[range];
  const isWeek = range === 'week';
  const isDaily = sourceName === 'daily';
  const day = forecast.daily[dayIndex];
  const todayDate = time.today.date;
  // "24h" on today means the next 24 hours from the current local hour.
  const fromNow = !isWeek && dayIndex === time.todayIndex && time.hourIndex >= 0;

  const rows = useMemo(() => {
    const source = forecast[sourceName];
    let scoped;
    if (isWeek) scoped = source;
    else if (fromNow) scoped = source.slice(time.hourIndex, time.hourIndex + 24);
    else scoped = source.filter((r) => rowDate(r) === day.date);
    return scoped.filter((r) => typeof r[key] === 'number');
  }, [forecast, sourceName, key, isWeek, fromNow, time.hourIndex, day]);

  const currentHourKey = time.hourIndex >= 0 ? forecast.hourly[time.hourIndex].time : null;
  const nowIndex = isDaily ? -1 : rows.findIndex((r) => r.time === currentHourKey);

  const dayLabel = (date, short) => (date === todayDate ? 'Today' : formatWeekday(date, short));
  const pointLabel = (row) => {
    if (isDaily) return dayLabel(row.date, false);
    const label = row.time === currentHourKey ? 'Now' : formatHour(row.time);
    return isWeek || fromNow ? `${dayLabel(rowDate(row), true)} ${label}` : label;
  };

  const defaultIndex = useMemo(() => {
    if (isDaily) return Math.max(0, rows.findIndex((r) => r.date === day.date));
    if (nowIndex >= 0) return nowIndex;
    const i = rows.findIndex((r) => rowDate(r) === day.date && r.time.slice(11, 13) === '12');
    return i === -1 ? 0 : i;
  }, [rows, isDaily, day, nowIndex]);

  useEffect(() => setHoverIndex(null), [dayIndex, metricId, range]);

  const height = width < 480 ? 230 : width > 1000 ? 300 : 270;
  const hasData = rows.length > 1;
  const activeIndex = Math.min(hoverIndex ?? defaultIndex, Math.max(0, rows.length - 1));
  const values = rows.map((r) => r[key]);

  const [lo, hi] = hasData ? niceDomain(values, metric) : [0, 1];
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const inset = isDaily ? Math.min(40, innerW / 14) : 0;
  const step = hasData ? (innerW - inset * 2) / (rows.length - 1) : 0;
  const xAt = (i) => PAD.left + inset + i * step;
  const yAt = (v) => PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;
  const baseline = PAD.top + innerH;

  const linePath = metric.kind === 'line' ? monotonePath(values.map((v, i) => ({ x: xAt(i), y: yAt(v) }))) : '';
  const areaPath = linePath ? `${linePath}L${xAt(rows.length - 1)},${baseline}L${xAt(0)},${baseline}Z` : '';
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const barW = Math.max(3, Math.min(isDaily ? 36 : 14, step * 0.55));
  const allZero = metric.kind === 'bar' && values.every((v) => v === 0);
  // Rain-chance indicators under temperature/humidity lines (hourly data only).
  const showPrecip = metric.kind === 'line' && !isDaily;
  const precipW = Math.max(2, Math.min(10, step * 0.5));

  // X-axis labels: a weekday under the middle of each day for the hourly week,
  // every few hours for 24h, every row for daily data.
  const labelEvery = width < 480 ? 6 : width < 800 ? 4 : 3;
  const xLabels = rows
    .map((row, i) => {
      if (isDaily) return { i, text: dayLabel(row.date, true) };
      if (isWeek) return row.time.slice(11, 13) === '12' ? { i, text: formatWeekday(rowDate(row), true) } : null;
      return i % labelEvery === 0 ? { i, text: i === nowIndex ? 'Now' : formatHour(row.time) } : null;
    })
    .filter(Boolean);

  const indexFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round((e.clientX - rect.left - PAD.left - inset) / step);
    return Math.max(0, Math.min(rows.length - 1, i));
  };
  const selectDayOf = (i) => {
    if (!isWeek) return;
    const index = forecast.daily.findIndex((d) => d.date === rowDate(rows[i]));
    if (index !== -1) onSelectDay(index);
  };

  const onKeyDown = (e) => {
    const stepSize = isWeek && !isDaily ? 3 : 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const delta = e.key === 'ArrowRight' ? stepSize : -stepSize;
      setHoverIndex(Math.max(0, Math.min(rows.length - 1, activeIndex + delta)));
    } else if (isWeek && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      selectDayOf(activeIndex);
    }
  };

  const activeRow = hasData ? rows[activeIndex] : null;
  const activeX = hasData ? xAt(activeIndex) : 0;
  const activeY = hasData ? yAt(activeRow[key]) : 0;
  const bubbleTop = metric.kind === 'bar' ? Math.min(activeY, baseline - 3) : activeY;
  const bubbleLeft = Math.max(70, Math.min(width - 70, activeX));
  const bubbleValue = hasData ? metric.format(activeRow[key], forecast.units) : '';
  // Hourly points get the full picture: feels like, rain chance and condition.
  const extras =
    hasData && !isDaily
      ? [
          activeRow.apparentTemperature !== null && `Feels like ${Math.round(activeRow.apparentTemperature)}°`,
          activeRow.precipitationProbability !== null && `Rain chance ${Math.round(activeRow.precipitationProbability)}%`,
          activeRow.weatherCode !== null && getWeatherCondition(activeRow.weatherCode, activeRow.isDay ?? true).label,
        ].filter(Boolean)
      : [];
  const scope = isWeek ? 'Next 7 days' : fromNow ? 'Next 24 hours' : dayLabel(day.date, false);
  const instructions = isWeek
    ? 'Use left and right arrow keys to move along the week, Enter to select that day.'
    : 'Use left and right arrow keys to inspect hours.';

  return (
    <section id="section-overview" className="card overview" aria-labelledby="overview-title">
      <NextHours forecast={forecast} time={time} />

      <div className="overview-head">
        <div>
          <h2 id="overview-title">Overview</h2>
          <p className="card-sub">
            {scope} · {hasData ? metric.summary(values, forecast.units) : 'No data'}
          </p>
        </div>
        <div className="overview-controls">
          <Segmented label="Chart range" options={RANGES} value={range} onChange={setRange} className="tabs-range" />
          <Segmented
            label="Chart metric"
            options={Object.entries(METRICS).map(([id, m]) => ({ id, label: m.label }))}
            value={metricId}
            onChange={setMetricId}
          />
        </div>
      </div>

      <div className={`chart-wrap ${drawn ? 'is-drawn' : ''}`} ref={wrapRef}>
        {width > 0 && hasData && (
          <>
            <svg
              className={`chart ${isWeek ? 'is-week' : ''}`}
              width={width}
              height={height}
              tabIndex={0}
              role="img"
              aria-label={`${metric.label}, ${scope}. ${metric.summary(values, forecast.units)}. ${instructions}`}
              onPointerMove={(e) => setHoverIndex(indexFromEvent(e))}
              onPointerDown={(e) => setHoverIndex(indexFromEvent(e))}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setHoverIndex(null)}
              onClick={(e) => selectDayOf(indexFromEvent(e))}
              onKeyDown={onKeyDown}
              onBlur={() => setHoverIndex(null)}
            >
              <defs>
                <clipPath id={`${gradientId}-reveal`}>
                  <rect className="chart-reveal" x="0" y="0" width={width} height={height} />
                </clipPath>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.42" />
                  <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {ticks.map((t) => (
                <g key={t}>
                  <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={yAt(t)} y2={yAt(t)} />
                  <text className="chart-axis" x={PAD.left - 10} y={yAt(t)} dy="0.32em" textAnchor="end">
                    {metric.axis(t)}
                  </text>
                </g>
              ))}
              {xLabels.map(({ i, text }) => (
                <text
                  key={`${text}-${i}`}
                  className={`chart-axis ${(isWeek && rowDate(rows[i]) === day.date) || i === nowIndex ? 'is-selected' : ''}`}
                  x={xAt(i)}
                  y={height - 8}
                  textAnchor="middle"
                >
                  {text}
                </text>
              ))}

              {showPrecip &&
                rows.map((r, i) =>
                  r.precipitationProbability > 0 ? (
                    <rect
                      key={`p-${r.time}`}
                      className="chart-precip"
                      x={xAt(i) - precipW / 2}
                      y={baseline - (r.precipitationProbability / 100) * PRECIP_BAR_MAX}
                      width={precipW}
                      height={(r.precipitationProbability / 100) * PRECIP_BAR_MAX}
                      rx={Math.min(2, precipW / 2)}
                    />
                  ) : null,
                )}

              {nowIndex >= 0 && (
                <g className="chart-now" aria-hidden="true">
                  <line x1={xAt(nowIndex)} x2={xAt(nowIndex)} y1={PAD.top - 14} y2={baseline} />
                </g>
              )}

              <line className="chart-cross" x1={activeX} x2={activeX} y1={activeY} y2={baseline} />

              {metric.kind === 'line' ? (
                <>
                  <g clipPath={`url(#${gradientId}-reveal)`}>
                    <path d={areaPath} fill={`url(#${gradientId})`} className="chart-area" />
                    <path d={linePath} className="chart-line" />
                  </g>
                  <circle cx={activeX} cy={activeY} r="9" className="chart-point-halo" />
                  <circle cx={activeX} cy={activeY} r="5" className="chart-point" />
                </>
              ) : (
                values.map((v, i) => {
                  const h = Math.max(v > 0 ? 3 : 0, baseline - yAt(v));
                  return (
                    <rect
                      key={rows[i].time ?? rows[i].date}
                      className={`chart-bar ${i === activeIndex ? 'is-active' : ''}`}
                      x={xAt(i) - barW / 2}
                      y={baseline - h}
                      width={barW}
                      height={h}
                      rx={Math.min(4, barW / 2)}
                    />
                  );
                })
              )}
            </svg>
            <div className="chart-bubble" style={{ left: bubbleLeft, top: bubbleTop }} aria-hidden="true">
              <span className="chart-bubble-time">{pointLabel(activeRow)}</span>
              <strong>{bubbleValue}</strong>
              {extras.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            {allZero && (
              <p className="chart-empty">
                No rain expected {isWeek ? 'this week' : fromNow ? 'in the next 24 hours' : `on ${scope}`}.
              </p>
            )}
            <p className="sr-only" aria-live="polite">
              {hoverIndex !== null ? `${pointLabel(activeRow)}: ${[bubbleValue, ...extras].join(', ')}` : ''}
            </p>
          </>
        )}
        {width > 0 && !hasData && <p className="chart-empty">{metric.label} data isn't available for this period.</p>}
      </div>
    </section>
  );
}
