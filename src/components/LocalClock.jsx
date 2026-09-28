import { useNow } from '../hooks/useNow.js';
import { formatLocalTime, formatZoneName } from '../utils/time.js';

// The selected location's wall clock, ticking every second in its own time zone.
// Isolated so the per-second update re-renders only this element.
export default function LocalClock({ zone, className = '' }) {
  const now = new Date(useNow(1000));
  return (
    <span className={`local-clock ${className}`}>
      <time dateTime={now.toISOString()}>{formatLocalTime(now, zone, { seconds: true })}</time>
      <span className="local-clock-zone">{formatZoneName(now, zone)}</span>
    </span>
  );
}
