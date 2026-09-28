const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export const formatTemp = (v) => (isNum(v) ? `${Math.round(v)}°` : '—');

export const formatWind = (v, unit = 'km/h') => (isNum(v) ? `${Math.round(v)} ${unit}` : '—');

export const formatPercent = (v) => (isNum(v) ? `${Math.round(v)}%` : '—');

export function formatVisibility(meters) {
  if (!isNum(meters)) return '—';
  const km = meters / 1000;
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

export const formatPrecip = (v, unit = 'mm') => (isNum(v) ? `${Math.round(v * 10) / 10} ${unit}` : '—');

// Open-Meteo returns local wall-clock strings ("2026-09-27T14:00") for the
// requested timezone. Parse them as UTC so the browser's own zone never shifts them.
export function parseLocal(isoLocal) {
  const [date, time = '00:00'] = isoLocal.split('T');
  return new Date(`${date}T${time}:00Z`);
}

const fmt = (options) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options });
const weekdayLong = fmt({ weekday: 'long' });
const weekdayShort = fmt({ weekday: 'short' });
const hourFmt = fmt({ hour: 'numeric' });
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit' });
const fullDateFmt = fmt({ weekday: 'long', day: 'numeric', month: 'short' });
const monthDayFmt = fmt({ month: 'short', day: 'numeric' });

export const formatWeekday = (isoDate, short = false) =>
  (short ? weekdayShort : weekdayLong).format(parseLocal(isoDate));
export const formatMonthDay = (isoDate) => monthDayFmt.format(parseLocal(isoDate));
export const formatHour = (isoLocal) => hourFmt.format(parseLocal(isoLocal));
export const formatClock = (isoLocal) => timeFmt.format(parseLocal(isoLocal));

// "Now" in the selected city's timezone, as a UTC-based Date for the formatters above.
export const cityNow = (utcOffsetSeconds) => new Date(Date.now() + utcOffsetSeconds * 1000);
const shortDateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short',
  year: '2-digit',
});
export const formatCityDate = (date) => fullDateFmt.format(date);
export const formatShortDate = (date) => shortDateFmt.format(date);
export const formatCityTime = (date) => timeFmt.format(date);

export function placeLabel(place) {
  if (!place) return '';
  return [place.region !== place.name ? place.region : '', place.country].filter(Boolean).join(', ');
}

// Fuller context for telling similar places apart: "district · Tamil Nadu, India".
export function placeDetail(place) {
  if (!place) return '';
  const where = [place.area !== place.region ? place.area : '', placeLabel(place)].filter(Boolean).join(', ');
  return [place.kind, where].filter(Boolean).join(' · ');
}
