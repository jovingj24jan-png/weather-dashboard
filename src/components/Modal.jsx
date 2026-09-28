import { useEffect, useId, useRef } from 'react';
import { Icon } from './Icons.jsx';

// Native <dialog> gives focus trapping, Escape-to-close and a backdrop for free.
export default function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-btn" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>
      {open && children}
    </dialog>
  );
}
