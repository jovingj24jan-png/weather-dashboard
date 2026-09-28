const PATHS = {
  logo: (
    <>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M9 2.5v1.2M3.7 4.3l.9.9M2.5 9h1.2M14.3 4.3l-.9.9" />
      <path d="M8 20h9a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 13.6 3.2 3.2 0 0 0 8 20z" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  star: <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 20.5H5.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2H9" />
      <path d="m15.5 16.5 4.5-4.5-4.5-4.5M20 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  bell: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17S18 15.5 18 9z" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  expand: <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />,
  layers: (
    <>
      <path d="m12 3.5 8.5 4.75L12 13 3.5 8.25z" />
      <path d="m3.5 12.5 8.5 4.75 8.5-4.75" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  wind: <path d="M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5M3 12.5h15.5a2.5 2.5 0 1 1-2.5 2.5M3 16.5h8" />,
  droplet: <path d="M12 3.2s6 6.4 6 10.8a6 6 0 0 1-12 0c0-4.4 6-10.8 6-10.8z" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  umbrella: (
    <>
      <path d="M3 12a9 9 0 0 1 18 0z" />
      <path d="M12 12v6.5a2 2 0 0 1-4 0" />
    </>
  ),
  sunrise: (
    <>
      <path d="M5 17a7 7 0 0 1 14 0M3 20.5h18M12 3.5v5M9 6l3-2.5L15 6" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5M12 16h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4.5M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.5 4.5M20 20v-4h-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
};

export function Icon({ name, size = 20, className = '', filled = false, strokeWidth = 1.8 }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

// Shared gradients for the glossy weather icons. Rendered once (in App) and
// referenced by id from every <WeatherIcon>, so no icon repeats its own <defs>.
export function WeatherIconDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <radialGradient id="wi-sun" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff6c4" />
          <stop offset="45%" stopColor="#ffd046" />
          <stop offset="100%" stopColor="#f59a18" />
        </radialGradient>
        <radialGradient id="wi-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="#ffc93c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffc93c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wi-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--icon-cloud-top)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--icon-cloud-bottom)' }} />
        </linearGradient>
        <linearGradient id="wi-cloud-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--icon-cloud-dark-top)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--icon-cloud-dark-bottom)' }} />
        </linearGradient>
        <linearGradient id="wi-moon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f6ff" />
          <stop offset="100%" stopColor="#b8c3de" />
        </linearGradient>
        <linearGradient id="wi-drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8cc4ff" />
          <stop offset="100%" stopColor="#2f7df6" />
        </linearGradient>
        <linearGradient id="wi-bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe680" />
          <stop offset="100%" stopColor="#ffb21e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const CLOUD_PATH = 'M9.5 27h14.2a5.8 5.8 0 0 0 .9-11.53A8 8 0 0 0 9.3 17.2 4.9 4.9 0 0 0 9.5 27z';

// A soft darker copy under the cloud gives it volume without a filter.
const Cloud = ({ dark = false, transform }) => (
  <g transform={transform}>
    <path d={CLOUD_PATH} transform="translate(0.6 1.2)" fill="rgba(20, 40, 90, 0.18)" />
    <path d={CLOUD_PATH} fill={`url(#${dark ? 'wi-cloud-dark' : 'wi-cloud'})`} />
  </g>
);

const Sun = ({ cx = 16, cy = 16, r = 6.5 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r * 1.55} fill="url(#wi-sun-glow)" />
    <circle cx={cx} cy={cy} r={r} fill="url(#wi-sun)" />
  </g>
);

const Moon = ({ transform }) => (
  <path transform={transform} fill="url(#wi-moon)" d="M21 19.5A9 9 0 0 1 12.5 7a9 9 0 1 0 8.5 12.5z" />
);

const Drop = ({ x, y, s = 1 }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    fill="url(#wi-drop)"
    d="M0 0c1.4 2 2.2 3.3 2.2 4.3a2.2 2.2 0 0 1-4.4 0C-2.2 3.3-1.4 2 0 0z"
  />
);

const Drops = ({ count = 3 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => (
      <Drop key={i} x={12 + i * (count > 3 ? 4 : 5.5)} y={i % 2 ? 29.5 : 28.5} s={count > 3 ? 0.85 : 1} />
    ))}
  </g>
);

const Flakes = () => (
  <g fill="#ffffff" stroke="#b9d3ff" strokeWidth="0.6">
    {[12, 17.5, 23].map((x, i) => (
      <circle key={x} cx={x} cy={i % 2 ? 33 : 31} r="1.8" />
    ))}
  </g>
);

function glyph(icon, isDay) {
  switch (icon) {
    case 'clear':
      return isDay ? <Sun cx={18} cy={18} r={9} /> : <Moon transform="translate(3 2) scale(1.1)" />;
    case 'mostly-clear':
    case 'partly-cloudy':
      return (
        <>
          {isDay ? <Sun cx={14} cy={13} r={7} /> : <Moon transform="translate(-2 -3) scale(0.9)" />}
          <Cloud transform={icon === 'mostly-clear' ? 'translate(6 6) scale(0.85)' : 'translate(3 3)'} />
        </>
      );
    case 'cloudy':
      return (
        <>
          <Cloud dark transform="translate(6 -2) scale(0.85)" />
          <Cloud transform="translate(1 3)" />
        </>
      );
    case 'fog':
      return (
        <>
          <Cloud transform="translate(1 -2)" />
          <g stroke="var(--icon-cloud-dark-bottom)" strokeWidth="2" strokeLinecap="round">
            <line x1="7" y1="29" x2="29" y2="29" />
            <line x1="10" y1="33" x2="26" y2="33" />
          </g>
        </>
      );
    case 'drizzle':
    case 'rain':
    case 'heavy-rain':
    case 'showers':
      return (
        <>
          {icon === 'showers' && isDay && <Sun cx={25} cy={9} r={5} />}
          <Cloud dark={icon === 'heavy-rain'} transform="translate(1 -2)" />
          <Drops count={icon === 'drizzle' ? 2 : icon === 'heavy-rain' ? 4 : 3} />
        </>
      );
    case 'sleet':
      return (
        <>
          <Cloud transform="translate(1 -2)" />
          <Drops count={2} />
          <circle cx="24" cy="32" r="1.8" fill="#ffffff" stroke="#b9d3ff" strokeWidth="0.6" />
        </>
      );
    case 'snow':
      return (
        <>
          <Cloud transform="translate(1 -2)" />
          <Flakes />
        </>
      );
    case 'thunder':
      return (
        <>
          <Cloud dark transform="translate(1 -2)" />
          <path fill="url(#wi-bolt)" d="M18.5 23h4l-2.5 5h3.5l-7 8 2-6h-3.5z" />
        </>
      );
    default:
      return <Cloud transform="translate(1 3)" />;
  }
}

export function WeatherIcon({ icon, isDay = true, size = 40, label, className = '' }) {
  return (
    <svg
      className={`weather-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      overflow="visible"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      {glyph(icon, isDay)}
    </svg>
  );
}
