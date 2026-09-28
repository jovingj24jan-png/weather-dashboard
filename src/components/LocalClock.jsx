import { useNow } from '../hooks/useNow.js';
import { formatLocalDate, formatLocalTime, formatZoneName } from '../utils/time.js';

// The selected location's current wall clock ("8:15 PM"), in its own IANA time
// zone. Ticks every second (aligned to the second) so the minute and AM/PM
// flip on time; only this element re-renders, and no request is made.
export default function LocalClock({ zone, className = '' }) {
  const now = new Date(useNow(1000));
  return (
    <span className={`local-clock ${className}`}>
      <time dateTime={now.toISOString()}>{formatLocalTime(now, zone)}</time>
      <span className="local-clock-zone">{formatZoneName(now, zone)}</span>
    </span>
  );
}

// The selected location's current date, on the same 1 s tick as the clock so
// both roll over at local midnight together.
export function LocalDate({ zone, className = '' }) {
  const now = new Date(useNow(1000));
  return <span className={className}>{formatLocalDate(now, zone)}</span>;
}
