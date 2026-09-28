import { useCallback, useEffect, useRef, useState } from 'react';
import { getCoordinates } from '../services/geocodingApi.js';
import { getWeather } from '../services/weatherApi.js';
import { WeatherError, ERROR_MESSAGES } from '../services/http.js';
import { DEFAULT_CITY, STORAGE_KEYS } from '../config.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const toWeatherError = (err) =>
  err instanceof WeatherError ? err : new WeatherError('malformed', ERROR_MESSAGES.malformed, err);

// Owns the selected location and its forecast.
//
//   city name ─GET→ geocoding API ─→ { latitude, longitude }
//             ─GET→ forecast API  ─→ JSON ─→ React state ─→ dashboard
//
// Each load aborts the previous one, so rapid repeated searches can never
// render an older city's data, and the last good forecast stays on screen
// until the new one is ready.
export function useWeather(unit) {
  const [location, setLocation] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  // Other geocoding matches for the last search ("Not the right place?").
  const [match, setMatch] = useState(null);
  // Several equally likely places for a search: the user picks one before any weather GET.
  const [choices, setChoices] = useState(null);
  const controllerRef = useRef(null);
  const locationRef = useRef(null);
  const matchRef = useRef(null);
  const hasForecastRef = useRef(false);
  // The most recent request, so "Try again" repeats what actually failed.
  const lastAttemptRef = useRef(null);

  const run = useCallback(
    async (resolveMatch) => {
      controllerRef.current?.abort();
      lastAttemptRef.current = resolveMatch;
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('loading');
      setError(null);
      setChoices(null);

      try {
        const {
          place,
          alternatives = [],
          renamedFrom = null,
          ambiguous = false,
          query,
        } = await resolveMatch(controller.signal);
        if (controller.signal.aborted) return;
        // Ask instead of guessing — except on first load, where the dashboard needs something to show.
        if (ambiguous && hasForecastRef.current) {
          setChoices({ query, options: [place, ...alternatives] });
          setStatus('success');
          return;
        }
        const data = await getWeather(place, { unit, signal: controller.signal });
        if (controller.signal.aborted) return;
        const nextMatch = alternatives.length || renamedFrom ? { alternatives, renamedFrom } : null;
        locationRef.current = place;
        matchRef.current = nextMatch;
        setLocation(place);
        setMatch(nextMatch);
        setForecast(data);
        hasForecastRef.current = true;
        setStatus('success');
        writeStorage(STORAGE_KEYS.lastLocation, place);
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        if (import.meta.env.DEV) console.warn('[weather] request failed:', err.kind ?? err.name, err.cause ?? err);
        setError(toWeatherError(err));
        setStatus('error');
      }
    },
    [unit],
  );

  const searchByName = useCallback(
    (query) => {
      if (!query.trim()) {
        setError(new WeatherError('empty', ERROR_MESSAGES.empty));
        return;
      }
      run(async (signal) => ({ ...(await getCoordinates(query, { signal })), query: query.trim() }));
    },
    [run],
  );

  // Loads a known place directly (saved city, history, alternative match) — no geocoding GET.
  const loadPlace = useCallback((place, nextMatch = null) => run(async () => ({ place, ...nextMatch })), [run]);

  // Swap to another match from the same search, keeping the rest on offer.
  const chooseAlternative = useCallback(
    (place) => {
      const current = matchRef.current;
      const others = [locationRef.current, ...(current?.alternatives ?? [])].filter((p) => p && p.id !== place.id);
      loadPlace(place, { alternatives: others });
    },
    [loadPlace],
  );

  const retry = useCallback(() => {
    if (lastAttemptRef.current) run(lastAttemptRef.current);
    else searchByName(DEFAULT_CITY);
  }, [run, searchByName]);

  // The user picked one of several matching places.
  const chooseLocation = useCallback(
    (place) => {
      const others = (choices?.options ?? []).filter((p) => p.id !== place.id);
      loadPlace(place, { alternatives: others });
    },
    [choices, loadPlace],
  );

  const dismissChoices = useCallback(() => setChoices(null), []);
  const dismissError = useCallback(() => setError(null), []);

  // Initial load, and reload in the new unit when the unit changes.
  useEffect(() => {
    const saved = locationRef.current ?? readStorage(STORAGE_KEYS.lastLocation, null);
    const valid = saved && typeof saved.latitude === 'number' && typeof saved.longitude === 'number';
    if (valid) loadPlace(saved, matchRef.current);
    else searchByName(DEFAULT_CITY);
    return () => controllerRef.current?.abort();
  }, [loadPlace, searchByName]);

  return {
    location,
    forecast,
    status,
    error,
    match,
    choices,
    searchByName,
    loadPlace,
    chooseAlternative,
    chooseLocation,
    dismissChoices,
    retry,
    dismissError,
  };
}
