import { Icon } from './Icons.jsx';
import { placeDetail, placeLabel } from '../utils/format.js';

// Explains which place a search resolved to and offers the other matches.
export default function MatchBar({ location, match, onChoose }) {
  if (!match) return null;
  const { alternatives, renamedFrom } = match;

  return (
    <div className="match-bar" role="note">
      <Icon name="pin" size={16} />
      <p>
        {renamedFrom ? (
          <>
            Showing <strong>{location.name}</strong>, {placeLabel(location)} — the best match for “{renamedFrom}”.
          </>
        ) : (
          <>
            Showing <strong>{location.name}</strong>, {placeLabel(location)}.
          </>
        )}
        {alternatives.length > 0 && <span className="match-hint"> Not the right place?</span>}
      </p>
      {alternatives.length > 0 && (
        <ul className="match-list">
          {alternatives.map((place) => (
            <li key={place.id}>
              <button type="button" className="match-chip" onClick={() => onChoose(place)}>
                {place.name}
                <small>{placeDetail(place)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
