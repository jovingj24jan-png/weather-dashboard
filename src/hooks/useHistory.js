import { useCallback, useEffect, useState } from 'react';
import { MAX_HISTORY, STORAGE_KEYS } from '../config.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const isValidPlace = (p) => p && p.id && p.name && typeof p.latitude === 'number' && typeof p.longitude === 'number';

// Recently viewed cities (places only — weather is always re-fetched when one is opened).
export function useHistory() {
  const [history, setHistory] = useState(() => {
    const stored = readStorage(STORAGE_KEYS.history, []);
    return Array.isArray(stored) ? stored.filter(isValidPlace).slice(0, MAX_HISTORY) : [];
  });

  useEffect(() => writeStorage(STORAGE_KEYS.history, history), [history]);

  const record = useCallback((place) => {
    if (!isValidPlace(place)) return;
    setHistory((list) =>
      list[0]?.id === place.id
        ? list
        : [{ ...place, viewedAt: Date.now() }, ...list.filter((p) => p.id !== place.id)].slice(0, MAX_HISTORY),
    );
  }, []);

  const clear = useCallback(() => setHistory([]), []);

  return { history, record, clear };
}
