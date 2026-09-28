import { forwardRef } from 'react';
import SearchBar from './SearchBar.jsx';
import Popover from './Popover.jsx';
import { Icon } from './Icons.jsx';

function weatherNotes(location, forecast) {
  if (!forecast) return [];
  const today = forecast.daily[0];
  const notes = [];
  if ((today.precipitationProbability ?? 0) >= 50) {
    notes.push(`Rain is likely today (${Math.round(today.precipitationProbability)}% chance).`);
  }
  if ((today.windMax ?? 0) >= 40) {
    notes.push(`Strong winds up to ${Math.round(today.windMax)} ${forecast.units.wind} today.`);
  }
  const hot = forecast.units.temperature.includes('F') ? 95 : 35;
  if (today.max >= hot) notes.push(`High heat today, up to ${Math.round(today.max)}°.`);
  return notes.length ? notes : [`No notable weather for ${location?.name ?? 'this location'} today.`];
}

// Rendered straight into the dashboard grid: on wide screens the search sits
// over the forecast column and the controls over the map column.
const Header = forwardRef(function Header(
  {
    onSearch,
    loading,
    choices,
    onChoose,
    onDismissChoices,
    theme,
    onThemeChange,
    unit,
    onUnitChange,
    location,
    forecast,
    onOpenSettings,
    children,
  },
  searchRef,
) {
  const notes = weatherNotes(location, forecast);
  const hasNotes = forecast && !notes[0].startsWith('No notable');

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-logo" aria-hidden="true">
          <Icon name="logo" size={20} />
        </span>
        <span className="header-brand-text">Weather</span>
      </div>
      <SearchBar
        ref={searchRef}
        onSearch={onSearch}
        loading={loading}
        choices={choices}
        onChoose={onChoose}
        onDismissChoices={onDismissChoices}
      />
      <div className="header-controls">
        <div className="unit-toggle" role="group" aria-label="Temperature unit">
          <button type="button" aria-pressed={unit === 'celsius'} onClick={() => onUnitChange('celsius')}>
            <span aria-hidden="true">°C</span>
            <span className="sr-only">Celsius</span>
          </button>
          <button type="button" aria-pressed={unit === 'fahrenheit'} onClick={() => onUnitChange('fahrenheit')}>
            <span aria-hidden="true">°F</span>
            <span className="sr-only">Fahrenheit</span>
          </button>
        </div>
        <div className="theme-toggle" role="group" aria-label="Color theme">
          <button
            type="button"
            aria-pressed={theme === 'light'}
            aria-label="Light theme"
            onClick={() => onThemeChange('light')}
          >
            <Icon name="sun" size={18} />
          </button>
          <button
            type="button"
            aria-pressed={theme === 'dark'}
            aria-label="Dark theme"
            onClick={() => onThemeChange('dark')}
          >
            <Icon name="moon" size={18} />
          </button>
        </div>
        <Popover
          className="notes"
          label="Weather notes"
          trigger={
            <>
              <Icon name="bell" size={18} />
              {hasNotes && <span className="dot" aria-hidden="true" />}
            </>
          }
        >
          <p className="popover-title">Today's weather notes</p>
          <ul className="notes-list">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="popover-foot">Based on the Open-Meteo forecast, not official warnings.</p>
        </Popover>
        <button type="button" className="profile" onClick={onOpenSettings} aria-label="Open settings for guest user">
          <span className="profile-text">Hi, Guest</span>
          <span className="avatar" aria-hidden="true">
            G
          </span>
        </button>
      </div>
      {children && <div className="header-notices">{children}</div>}
    </header>
  );
});

export default Header;
