import { Icon } from './Icons.jsx';

// `target` scrolls to a dashboard section; `action` opens a panel instead.
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: 'dashboard', target: 'top' },
  {
    id: 'calendar',
    label: 'Calendar · 7-day forecast',
    short: 'Calendar',
    icon: 'calendar',
    target: 'section-forecast',
  },
  { id: 'favorites', label: 'Favorites', short: 'Favorites', icon: 'star', target: 'section-favorites' },
  { id: 'locations', label: 'Locations · map', short: 'Map', icon: 'pin', target: 'section-map' },
  { id: 'history', label: 'History · recently viewed', short: 'History', icon: 'clock', action: 'history' },
];

export default function Sidebar({ active, onNavigate, onOpenSettings }) {
  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => item.id === active),
  );

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-panel">
        <div className="sidebar-brand" aria-hidden="true">
          <span className="sidebar-logo">
            <Icon name="logo" size={22} />
          </span>
          <span className="sidebar-brand-text">Weather</span>
        </div>
        <ul className="sidebar-list" style={{ '--i': activeIndex }}>
          <li className="nav-indicator" aria-hidden="true" />
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`nav-btn ${active === item.id ? 'is-active' : ''}`}
                aria-label={item.label}
                aria-current={active === item.id ? 'page' : undefined}
                aria-haspopup={item.action ? 'dialog' : undefined}
                data-tooltip={item.label}
                onClick={() => onNavigate(item)}
              >
                <Icon name={item.icon} size={20} />
                <span className="nav-label" aria-hidden="true">
                  {item.short}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-foot">
          <button
            type="button"
            className="nav-btn"
            aria-label="Settings"
            aria-haspopup="dialog"
            data-tooltip="Settings"
            onClick={onOpenSettings}
          >
            <Icon name="settings" size={20} />
          </button>
          <button
            type="button"
            className="nav-btn"
            aria-label="Log out (not available in this demo)"
            data-tooltip="Log out (demo)"
            aria-disabled="true"
          >
            <Icon name="logout" size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
