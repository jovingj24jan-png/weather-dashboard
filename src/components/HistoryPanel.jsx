import Modal from './Modal.jsx';
import { Icon } from './Icons.jsx';
import { placeDetail } from '../utils/format.js';

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function timeAgo(ms) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return relativeTime.format(-mins, 'minute');
  const hours = Math.round(mins / 60);
  if (hours < 24) return relativeTime.format(-hours, 'hour');
  return relativeTime.format(-Math.round(hours / 24), 'day');
}

export default function HistoryPanel({ open, onClose, history, activeId, onSelect, onClear, onSearchNew }) {
  return (
    <Modal open={open} onClose={onClose} title="Recently viewed">
      {history.length === 0 ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <Icon name="clock" size={20} />
          </span>
          <p>No history yet</p>
          <small>Cities you look up will appear here.</small>
        </div>
      ) : (
        <>
          <ul className="history-list">
            {history.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className={`history-item ${place.id === activeId ? 'is-active' : ''}`}
                  aria-current={place.id === activeId ? 'true' : undefined}
                  onClick={() => {
                    onSelect(place);
                    onClose();
                  }}
                >
                  <span className="history-icon" aria-hidden="true">
                    <Icon name="pin" size={16} />
                  </span>
                  <span className="history-text">
                    <strong>{place.name}</strong>
                    <small>{placeDetail(place)}</small>
                  </span>
                  <small className="history-time">{place.viewedAt ? timeAgo(place.viewedAt) : ''}</small>
                </button>
              </li>
            ))}
          </ul>
          <div className="history-actions">
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Clear history
            </button>
          </div>
        </>
      )}
      <button
        type="button"
        className="btn btn-primary history-search"
        onClick={() => {
          onClose();
          onSearchNew();
        }}
      >
        <Icon name="search" size={16} /> Search for another city
      </button>
    </Modal>
  );
}
