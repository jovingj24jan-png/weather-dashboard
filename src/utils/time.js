// Time helpers for the *selected location*, never the browser's own zone.
// Open-Meteo (timezone=auto) returns the location's IANA zone, e.g. "Europe/London";
// every "now" is formatted in that zone with Intl, so DST changes are handled.
// A `zone` object is { timeZone, utcOffsetSeconds } as returned by getWeather().

const validZones = new Map();

function isValidTimeZone(timeZone) {
  if (!timeZone) return false;
  if (!validZones.has(timeZone)) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone });
      validZones.set(timeZone, true);
    } catch {
      validZones.set(timeZone, false);
    }
  }
  return validZones.get(timeZone);
}

// Intl options for formatting a real instant in the location's zone. If the API
// ever returned an unknown zone name, fall back to shifting by its UTC offset.
function zoned(date, zone) {
  if (isValidTimeZone(zone?.timeZone)) return { date, timeZone: zone.timeZone };
  return { date: new Date(date.getTime() + (zone?.utcOffsetSeconds ?? 0) * 1000), timeZone: 'UTC' };
}

const formatterCache = new Map();
function formatter(options) {
  const key = JSON.stringify(options);
  if (!formatterCache.has(key)) formatterCache.set(key, new Intl.DateTimeFormat('en-US', options));
  return formatterCache.get(key);
}

// Always 12-hour ("8:15 PM"), in the location's zone — never the browser's.
export function formatLocalTime(date, zone, { seconds = false } = {}) {
  const z = zoned(date, zone);
  return formatter({
    timeZone: z.timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(seconds && { second: '2-digit' }),
  }).format(z.date);
}

export function formatLocalDate(date, zone) {
  const z = zoned(date, zone);
  return formatter({ timeZone: z.timeZone, weekday: 'long', month: 'long', day: 'numeric' }).format(z.date);
}

// Short zone name ("GMT+1", "JST", "GMT+5:30") so users can see which clock they're reading.
export function formatZoneName(date, zone) {
  const z = zoned(date, zone);
  const part = formatter({ timeZone: z.timeZone, timeZoneName: 'short' })
    .formatToParts(z.date)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? '';
}

/**
 * The location's current wall-clock time as "YYYY-MM-DDTHH:mm" — the same form
 * as Open-Meteo's local timestamps, so it can be compared with them directly.
 */
export function localNowKey(date, zone) {
  const z = zoned(date, zone);
  const parts = Object.fromEntries(
    formatter({
      timeZone: z.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(z.date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// Minutes since the epoch for a local "YYYY-MM-DDTHH:mm" string (zone-free arithmetic).
export function localMinutes(isoLocal) {
  const [d, t = '00:00'] = isoLocal.split('T');
  return Date.parse(`${d}T${t}:00Z`) / 60000;
}

const TWILIGHT_MINUTES = 40;

/** 'dawn' | 'day' | 'dusk' | 'night' from the location's own sunrise/sunset. */
export function getDayPeriod(nowKey, sunrise, sunset) {
  if (!sunrise || !sunset) return null;
  const now = localMinutes(nowKey);
  const rise = localMinutes(sunrise);
  const set = localMinutes(sunset);
  if (Math.abs(now - rise) <= TWILIGHT_MINUTES) return 'dawn';
  if (Math.abs(now - set) <= TWILIGHT_MINUTES) return 'dusk';
  return now > rise && now < set ? 'day' : 'night';
}

export function getRelativeUpdateTime(timestamp, now = Date.now()) {
  if (!timestamp) return '';
  const minutes = Math.floor((now - timestamp) / 60000);
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours} h ago`;
  return `Updated ${Math.floor(hours / 24)} d ago`;
}
