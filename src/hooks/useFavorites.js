import { useCallback, useEffect, useState } from 'react';
import { getCurrentWeatherForMany } from '../services/weatherApi.js';
import { DEFAULT_FAVORITES, MAX_FAVORITES, STORAGE_KEYS } from '../config.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const isValidPlace = (p) => p && p.id && p.name && typeof p.latitude === 'number' && typeof p.longitude === 'number';

function loadFavorites() {
  const stored = readStorage(STORAGE_KEYS.favorites, null);
  if (!Array.isArray(stored)) return DEFAULT_FAVORITES;
  return stored.filter(isValidPlace).slice(0, MAX_FAVORITES);
}

export function useFavorites(unit) {
  const [favorites, setFavorites] = useState(loadFavorites);
  const [conditions, setConditions] = useState({});
  const [status, setStatus] = useState('idle');

  useEffect(() => writeStorage(STORAGE_KEYS.favorites, favorites), [favorites]);

  useEffect(() => {
    if (favorites.length === 0) {
      setConditions({});
      setStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    setStatus('loading');
    getCurrentWeatherForMany(favorites, { unit, signal: controller.signal })
      .then((results) => {
        setConditions(Object.fromEntries(favorites.map((f, i) => [f.id, results[i]])));
        setStatus('success');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (import.meta.env.DEV) console.warn('[favorites] request failed:', err.kind ?? err.name);
        setStatus('error');
      });
    return () => controller.abort();
  }, [favorites, unit]);

  const isFavorite = useCallback((place) => !!place && favorites.some((f) => f.id === place.id), [favorites]);

  const addFavorite = useCallback((place) => {
    if (!isValidPlace(place)) return;
    setFavorites((list) =>
      list.some((f) => f.id === place.id) || list.length >= MAX_FAVORITES ? list : [...list, place],
    );
  }, []);

  const removeFavorite = useCallback((id) => setFavorites((list) => list.filter((f) => f.id !== id)), []);

  return {
    favorites,
    conditions,
    status,
    isFavorite,
    addFavorite,
    removeFavorite,
    isFull: favorites.length >= MAX_FAVORITES,
  };
}
