import { useNow } from '../hooks/useNow.js';
import { formatLocalTime, getRelativeUpdateTime } from '../utils/time.js';

// "Updated 3 min ago" — when this browser last received the data (not a claim
// that the model data itself is live). Re-checks every 15 s on its own (no network).
export default function UpdatedAgo({ timestamp, zone, fromCache = false }) {
  const now = useNow(15_000);
  if (!timestamp) return null;
  const exact = formatLocalTime(new Date(timestamp), zone);
  return (
    <span className={`updated-ago ${fromCache ? 'is-stale' : ''}`} title={`Data received at ${exact} local time`}>
      {fromCache ? 'Last available · ' : ''}
      {getRelativeUpdateTime(timestamp, now)}
    </span>
  );
}
