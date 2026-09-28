import Modal from './Modal.jsx';

const Option = ({ name, value, current, onChange, children }) => (
  <label className={`seg-option ${current === value ? 'is-active' : ''}`}>
    <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} />
    {children}
  </label>
);

export default function SettingsPanel({ open, onClose, unit, onUnitChange, theme, onThemeChange }) {
  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <fieldset>
        <legend>Temperature unit</legend>
        <div className="seg">
          <Option name="unit" value="celsius" current={unit} onChange={onUnitChange}>
            Celsius (°C)
          </Option>
          <Option name="unit" value="fahrenheit" current={unit} onChange={onUnitChange}>
            Fahrenheit (°F)
          </Option>
        </div>
      </fieldset>
      <fieldset>
        <legend>Theme</legend>
        <div className="seg">
          <Option name="theme" value="dark" current={theme} onChange={onThemeChange}>
            Dark
          </Option>
          <Option name="theme" value="light" current={theme} onChange={onThemeChange}>
            Light
          </Option>
        </div>
      </fieldset>
      <p className="modal-foot">Weather data by Open-Meteo.com. Preferences are saved in this browser.</p>
    </Modal>
  );
}
