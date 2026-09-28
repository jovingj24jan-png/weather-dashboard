import { useEffect, useState } from 'react';
import { cityNow } from '../utils/format.js';

// Wall-clock time in the selected city, refreshed every 30 seconds.
export function useCityClock(utcOffsetSeconds) {
  const [now, setNow] = useState(() => cityNow(utcOffsetSeconds));
  useEffect(() => {
    setNow(cityNow(utcOffsetSeconds));
    const id = setInterval(() => setNow(cityNow(utcOffsetSeconds)), 30_000);
    return () => clearInterval(id);
  }, [utcOffsetSeconds]);
  return now;
}
