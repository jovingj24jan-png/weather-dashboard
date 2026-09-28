import { useMemo } from 'react';
import { useNow } from './useNow.js';
import { getDayPeriod, localMinutes, localNowKey } from '../utils/time.js';

// Everything time-dependent, derived from the SELECTED location's clock (not the
// browser's): its local "now", today's forecast entry, whether the sun is up
// (from that day's sunrise/sunset), the dawn/day/dusk/night period and the
// current hour in the hourly series. Re-evaluated every 30 s, no network.
export function useLocalTime(forecast) {
  const now = useNow(30_000);
  return useMemo(() => {
    if (!forecast) return null;
    const nowKey = localNowKey(new Date(now), forecast.zone);
    const date = nowKey.slice(0, 10);
    const todayIndex = Math.max(0, forecast.daily.findIndex((d) => d.date === date));
    const today = forecast.daily[todayIndex];
    const period = getDayPeriod(nowKey, today.sunrise, today.sunset);
    const isDay =
      today.sunrise && today.sunset
        ? localMinutes(nowKey) >= localMinutes(today.sunrise) && localMinutes(nowKey) < localMinutes(today.sunset)
        : forecast.current.isDay;
    const hourKey = `${nowKey.slice(0, 13)}:00`;
    const hourIndex = forecast.hourly.findIndex((h) => h.time === hourKey);
    return { now, nowKey, today, todayIndex, period: period ?? (isDay ? 'day' : 'night'), isDay, hourIndex };
  }, [forecast, now]);
}
