import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import CurrentWeather from './components/CurrentWeather.jsx';
import FavoriteCities from './components/FavoriteCities.jsx';
import LocationMap from './components/LocationMap.jsx';
import Forecast from './components/Forecast.jsx';
import WeatherOverview from './components/WeatherOverview.jsx';
import DetailsSection from './components/DetailsSection.jsx';
import Atmosphere from './components/Atmosphere.jsx';
import LoadingState from './components/LoadingState.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import MatchBar from './components/MatchBar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ErrorState, StatusBanner } from './components/ErrorState.jsx';
import { WeatherIconDefs } from './components/Icons.jsx';
import { useWeather } from './hooks/useWeather.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useHistory } from './hooks/useHistory.js';
import { useNearbyWeather } from './hooks/useNearbyWeather.js';
import { useLocalTime } from './hooks/useLocalTime.js';
import { useInstallPrompt } from './hooks/useInstallPrompt.js';
import { getWeatherCondition } from './utils/weatherCodes.js';
import { STORAGE_KEYS } from './config.js';
import { readStorage, writeStorage } from './utils/storage.js';

// Weather is refreshed when it is this old and the tab is visible — never on a tight loop.
const AUTO_REFRESH_MS = 15 * 60 * 1000;

function usePersistentState(key, fallback, allowed) {
  const [value, setValue] = useState(() => {
    const stored = readStorage(key, fallback);
    return allowed.includes(stored) ? stored : fallback;
  });
  useEffect(() => writeStorage(key, value), [key, value]);
  return [value, setValue];
}

export default function App() {
  const [unit, setUnit] = usePersistentState(STORAGE_KEYS.unit, 'celsius', ['celsius', 'fahrenheit']);
  const [theme, setTheme] = usePersistentState(STORAGE_KEYS.theme, 'dark', ['dark', 'light']);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [openPanel, setOpenPanel] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [pendingFavId, setPendingFavId] = useState(null);
  const searchRef = useRef(null);

  const {
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
  } = useWeather(unit);
  const favs = useFavorites(unit);
  const { history, record: recordHistory, clear: clearHistory } = useHistory();
  const nearby = useNearbyWeather(location, unit);
  const time = useLocalTime(forecast);
  const installPrompt = useInstallPrompt();

  // Controlled auto-refresh: checked once a minute and when the tab becomes
  // visible again; only fires if 15 min have passed since the last successful
  // fetch AND since the last automatic attempt — so a failing API (e.g. HTTP
  // 429) is retried every 15 min, not every minute.
  const refreshState = useRef({ lastAttempt: 0 });
  refreshState.current = {
    ...refreshState.current,
    fetchedAt: forecast?.fetchedAt,
    busy: status === 'loading' || refreshing,
    refresh,
  };
  useEffect(() => {
    const maybeRefresh = () => {
      const state = refreshState.current;
      if (!state.fetchedAt || state.busy || document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - Math.max(state.fetchedAt, state.lastAttempt) < AUTO_REFRESH_MS) return;
      state.lastAttempt = now;
      state.refresh();
    };
    const id = setInterval(maybeRefresh, 60_000);
    document.addEventListener('visibilitychange', maybeRefresh);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', maybeRefresh);
    };
  }, []);

  useEffect(() => {
    if (location) recordHistory(location);
  }, [location, recordHistory]);

  useEffect(() => {
    if (status !== 'loading') setPendingFavId(null);
  }, [status]);

  const selectFavorite = useCallback(
    (place) => {
      setPendingFavId(place.id);
      loadPlace(place);
    },
    [loadPlace],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // A new forecast starts on the location's own "today".
  const todayIndex = time?.todayIndex ?? 0;
  useEffect(() => setDayIndex(todayIndex), [forecast]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  const navigate = useCallback((item) => {
    if (item.action) {
      setOpenPanel(item.action);
      return;
    }
    setActiveNav(item.id);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduce ? 'auto' : 'smooth';
    if (item.target === 'top') window.scrollTo({ top: 0, behavior });
    else document.getElementById(item.target)?.scrollIntoView({ block: 'start', behavior });
  }, []);

  const openSettings = useCallback(() => setOpenPanel('settings'), []);
  const openHistory = useCallback(() => setOpenPanel('history'), []);
  const closePanel = useCallback(() => setOpenPanel(null), []);

  const loading = status === 'loading';
  const hasData = !!(location && forecast);
  const isCurrentSaved = favs.isFavorite(location);
  const mode = hasData && time ? 'data' : status === 'error' && error ? 'error' : 'loading';
  const condition = mode === 'data' ? getWeatherCondition(forecast.current.weatherCode, time.isDay) : null;
  // Cards re-mount (and fade in) when the location changes, not on every refresh.
  const placeKey = location?.id ?? 'none';

  let content;
  if (mode === 'data') {
    content = (
      <>
        <div className="area-current" key={`current-${placeKey}`}>
          <CurrentWeather
            location={location}
            forecast={forecast}
            time={time}
            onRefresh={refresh}
            refreshing={refreshing}
            isFavorite={isCurrentSaved}
            favoritesFull={favs.isFull}
            onToggleFavorite={() => (isCurrentSaved ? favs.removeFavorite(location.id) : favs.addFavorite(location))}
            onChangeCity={openHistory}
          />
        </div>
        <div className="area-forecast" key={`forecast-${placeKey}`}>
          <Forecast
            daily={forecast.daily}
            todayDate={time.today.date}
            windUnit={forecast.units.wind}
            selectedIndex={dayIndex}
            onSelect={setDayIndex}
          />
        </div>
        <div className="area-map" key={`map-${placeKey}`}>
          <LocationMap location={location} forecast={forecast} nearby={nearby} isDay={time.isDay} />
        </div>
        <div className="area-favs">
          <FavoriteCities
            favorites={favs.favorites}
            conditions={favs.conditions}
            status={favs.status}
            activeId={location.id}
            pendingId={pendingFavId}
            currentLocation={location}
            isCurrentSaved={isCurrentSaved}
            isFull={favs.isFull}
            onSelect={selectFavorite}
            onRemove={favs.removeFavorite}
            onAddCurrent={() => favs.addFavorite(location)}
            onFocusSearch={focusSearch}
          />
        </div>
        <div className="area-overview" key={`overview-${placeKey}`}>
          <WeatherOverview forecast={forecast} time={time} dayIndex={dayIndex} onSelectDay={setDayIndex} />
        </div>
        <div className="area-details" key={`details-${placeKey}`}>
          <DetailsSection forecast={forecast} time={time} />
        </div>
      </>
    );
  } else if (mode === 'error') {
    content = (
      <div className="area-error">
        <ErrorState error={error} onRetry={retry} onFocusSearch={focusSearch} />
      </div>
    );
  } else {
    content = <LoadingState />;
  }

  return (
    <div className="page" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <WeatherIconDefs />
      {condition && <Atmosphere atmosphere={condition.atmosphere} period={time.period} />}
      <Sidebar active={activeNav} onNavigate={navigate} onOpenSettings={openSettings} />
      <main className="main" id="main" tabIndex={-1}>
        <div className={`board is-${mode} ${loading && hasData ? 'is-refreshing' : ''}`} aria-busy={loading}>
          <Header
            ref={searchRef}
            onSearch={searchByName}
            loading={loading}
            choices={choices}
            onChoose={chooseLocation}
            onDismissChoices={dismissChoices}
            theme={theme}
            onThemeChange={setTheme}
            unit={unit}
            onUnitChange={setUnit}
            canInstall={installPrompt.canInstall}
            onInstall={installPrompt.install}
            location={location}
            forecast={forecast}
            onOpenSettings={openSettings}
          >
            {error && hasData && <StatusBanner error={error} onRetry={retry} onDismiss={dismissError} />}
            {hasData && !error && match && <MatchBar location={location} match={match} onChoose={chooseAlternative} />}
          </Header>
          <ErrorBoundary resetKey={forecast} onRetry={retry} onFocusSearch={focusSearch}>
            {content}
          </ErrorBoundary>
        </div>
        <div className="toast-region" role="status" aria-live="polite">
          {loading && hasData && (
            <span className="loading-pill">
              <span className="spinner" aria-hidden="true" />{' '}
              {phase === 'searching' ? 'Searching weather...' : 'Loading weather...'}
            </span>
          )}
        </div>
        <footer className="footer">
          Weather by{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo.com
          </a>{' '}
          · Place search by Open-Meteo,{' '}
          <a href="https://nominatim.org/" target="_blank" rel="noreferrer">
            Nominatim
          </a>{' '}
          and{' '}
          <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">
            Photon
          </a>{' '}
          · Map data ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{' '}
          contributors
        </footer>
      </main>
      <SettingsPanel
        open={openPanel === 'settings'}
        onClose={closePanel}
        unit={unit}
        onUnitChange={setUnit}
        theme={theme}
        onThemeChange={setTheme}
      />
      <HistoryPanel
        open={openPanel === 'history'}
        onClose={closePanel}
        history={history}
        activeId={location?.id}
        onSelect={loadPlace}
        onClear={clearHistory}
        onSearchNew={focusSearch}
      />
    </div>
  );
}
