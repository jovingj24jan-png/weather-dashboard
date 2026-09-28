import { useEffect, useState } from 'react';

// Current instant, refreshed every `intervalMs`, aligned to the interval so a
// 1 s clock ticks on the second. Only the component using it re-renders.
export function useNow(intervalMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      timer = setTimeout(tick, intervalMs - (t % intervalMs));
    };
    tick();
    return () => clearTimeout(timer);
  }, [intervalMs]);
  return now;
}
