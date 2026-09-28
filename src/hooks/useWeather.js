import { useCallback, useEffect, useRef, useState } from 'react';
import { getCoordinates } from '../services/geocodingApi.js';
import { getWeather } from '../services/weatherApi.js';
import { getAirQuality } from '../services/airQualityApi.js';
import { WeatherError, ERROR_MESSAGES } from '../services/http.js';
import { DEFAULT_CITY, STORAGE_KEYS } from '../config.js';
import { readStorage, writeStorage } from '../utils/storage.js';

const toWeatherError = (err) =>
  err instanceof WeatherError ? err : new WeatherError('malformed', ERROR_MESSAGES.malformed, err);

const isUsableSnapshot = (s) =>
  s && s.location && s.forecast?.current && Array.isArray(s.forecast.daily) && Array.isArray(s.forecast.hourly);

// Owns the one normalized weather state:
//   { location, forecast: { zone, units, current, hourly, daily, airQuality, fetchedAt }, status, phase, error }
//
//   city name ─GET→ geocoders ─→ { latitude, longitude }
//             ─GET→ forecast (+ air quality, in parallel) ─→ React state ─→ dashboard
//
// Each load aborts the previous one, so rapid repeated searches can never
// render an older city's data, and the last good forecast stays on screen
// until the new one is ready.
export function useWeather(unit) {
  const [location, setLocation] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [status, setStatus] = useState('loading');
  // 'searching' while geocoding, 'loading' while fetching weather.
  const [phase, setPhase] = useState('loading');
  // A quiet refresh of the same place: data stays fully visible.
  const [refreshing, setRefreshing] = useState(false);
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
    async (resolveMatch, { quiet = false, geocodes = false } = {}) => {
      controllerRef.current?.abort();
      lastAttemptRef.current = { resolveMatch, options: { quiet, geocodes } };
      const controller = new AbortController();
      controllerRef.current = controller;
      setError(null);
      setChoices(null);
      if (quiet) setRefreshing(true);
      else {
        setStatus('loading');
        setPhase(geocodes ? 'searching' : 'loading');
      }

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
        if (!quiet) setPhase('loading');
        // Air quality is fetched alongside but never holds up (or fails) the weather.
        const airQualityRequest = getAirQuality(place, { signal: controller.signal }).catch(() => null);
        const weather = await getWeather(place, { unit, signal: controller.signal });
        if (controller.signal.aborted) return;
        const fetchedAt = Date.now();
        const data = { ...weather, airQuality: undefined, fetchedAt };
        const nextMatch = quiet ? matchRef.current : alternatives.length || renamedFrom ? { alternatives, renamedFrom } : null;
        locationRef.current = place;
        matchRef.current = nextMatch;
        setLocation(place);
        setMatch(nextMatch);
        setForecast(data);
        hasForecastRef.current = true;
        setStatus('success');
        writeStorage(STORAGE_KEYS.lastLocation, place);

        const airQuality = await airQualityRequest;
        if (controller.signal.aborted) return;
        setForecast((prev) => (prev?.fetchedAt === fetchedAt ? { ...prev, airQuality } : prev));
        writeStorage(STORAGE_KEYS.lastWeather, { unit, location: place, forecast: { ...data, airQuality } });
      } catch (err) {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        if (import.meta.env.DEV) console.warn('[weather] request failed:', err.kind ?? err.name, err.cause ?? err);
        const weatherError = toWeatherError(err);
        const couldNotUpdate = weatherError.kind === 'network' || weatherError.kind === 'api';
        // Nothing on screen yet (first load failed): fall back to the last weather this
        // browser received, clearly labelled with its real age — never presented as current.
        const snapshot = !hasForecastRef.current && couldNotUpdate ? readStorage(STORAGE_KEYS.lastWeather, null) : null;
        const usedSnapshot = isUsableSnapshot(snapshot) && snapshot.unit === unit;
        if (usedSnapshot) {
          locationRef.current = snapshot.location;
          setLocation(snapshot.location);
          setForecast({ ...snapshot.forecast, fromCache: true });
          hasForecastRef.current = true;
        }
        // "Showing last available weather" only when the data on screen is for this same place.
        const keepsData = couldNotUpdate && (quiet || usedSnapshot);
        setError(
          keepsData ? new WeatherError(weatherError.kind, ERROR_MESSAGES.stale, weatherError.cause) : weatherError,
        );
        setStatus('error');
      } finally {
        if (controllerRef.current === controller) setRefreshing(false);
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
      run(async (signal) => ({ ...(await getCoordinates(query, { signal })), query: query.trim() }), { geocodes: true });
    },
    [run],
  );

  // Loads a known place directly (saved city, history, alternative match) — no geocoding GET.
  const loadPlace = useCallback((place, nextMatch = null) => run(async () => ({ place, ...nextMatch })), [run]);

  // Fresh weather for the place already shown (manual or periodic refresh).
  const refresh = useCallback(() => {
    if (locationRef.current) run(async () => ({ place: locationRef.current }), { quiet: true });
  }, [run]);

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
    const last = lastAttemptRef.current;
    if (last) run(last.resolveMatch, { ...last.options, quiet: false });
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
    phase,
    refreshing,
    error,
    match,
    choices,
    searchByName,
    loadPlace,
    refresh,
    chooseAlternative,
    chooseLocation,
    dismissChoices,
    retry,
    dismissError,
  };
}
