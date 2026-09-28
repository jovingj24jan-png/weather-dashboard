import { forwardRef, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';
import { placeDetail } from '../utils/format.js';

// Shown when a search matches several equally likely places; nothing is
// fetched until the user picks one.
function LocationChoices({ choices, onChoose, onDismiss, inputRef }) {
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.querySelector('button')?.focus();
  }, [choices]);

  useEffect(() => {
    const onPointer = (e) => {
      if (!listRef.current?.parentElement?.contains(e.target)) onDismiss();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [onDismiss]);

  const onKeyDown = (e) => {
    const buttons = [...listRef.current.querySelectorAll('button')];
    const i = buttons.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length;
      buttons[next].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onDismiss();
      inputRef.current?.focus();
    }
  };

  return (
    <div className="search-choices" role="dialog" aria-label={`Choose which “${choices.query}”`} onKeyDown={onKeyDown}>
      <p className="search-choices-title">
        Which <strong>{choices.query}</strong> did you mean?
      </p>
      <ul ref={listRef}>
        {choices.options.map((place) => (
          <li key={place.id}>
            <button type="button" className="search-choice" onClick={() => onChoose(place)}>
              <Icon name="pin" size={16} />
              <span>
                <strong>{place.name}</strong>
                <small>{placeDetail(place)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SearchBar = forwardRef(function SearchBar({ onSearch, loading, choices, onChoose, onDismissChoices }, inputRef) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form className="search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="city-search" className="sr-only">
        Search city
      </label>
      <Icon name="search" size={18} className="search-icon" />
      <input
        ref={inputRef}
        id="city-search"
        type="search"
        placeholder="Search city..."
        autoComplete="off"
        enterKeyHint="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className="search-submit" aria-label="Search weather for this city">
        {loading ? <span className="spinner" aria-hidden="true" /> : <Icon name="search" size={16} />}
      </button>
      {choices && (
        <LocationChoices choices={choices} onChoose={onChoose} onDismiss={onDismissChoices} inputRef={inputRef} />
      )}
    </form>
  );
});

export default SearchBar;
