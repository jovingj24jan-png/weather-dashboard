import { Icon } from './Icons.jsx';

const TITLES = {
  'not-found': 'City not found',
  network: "You're offline",
  api: 'Service unavailable',
  malformed: 'Unexpected response',
  empty: 'Nothing to search',
};

// Full-panel error, used when there is no previous forecast to keep on screen.
export function ErrorState({ error, onRetry, onFocusSearch }) {
  return (
    <div className="card error-state" role="alert">
      <span className="error-icon" aria-hidden="true">
        <Icon name="alert" size={28} />
      </span>
      <h2>{TITLES[error.kind] ?? 'Something went wrong'}</h2>
      <p>{error.message}</p>
      <div className="error-actions">
        {error.kind === 'not-found' ? (
          <button type="button" className="btn btn-primary" onClick={onFocusSearch}>
            Search another city
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            <Icon name="refresh" size={16} /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

// Inline banner, used when a new request fails but the last good data is still shown.
export function StatusBanner({ error, onRetry, onDismiss }) {
  const retryable = error.kind === 'network' || error.kind === 'api' || error.kind === 'malformed';
  return (
    <div
      className={`banner banner-${error.kind === 'empty' || error.kind === 'not-found' ? 'info' : 'error'}`}
      role="alert"
    >
      <Icon name="alert" size={18} />
      <p>{error.message}</p>
      {retryable && (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
      <button type="button" className="icon-btn" aria-label="Dismiss message" onClick={onDismiss}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
