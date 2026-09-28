// Subtle background that reflects the selected location's weather and its
// local time of day. Purely decorative: fixed behind the content, ignores
// pointer events, animates only transform/opacity, and is static when the
// user prefers reduced motion. Keyed by state so changes cross-fade.
export default function Atmosphere({ atmosphere, period }) {
  if (!atmosphere) return null;
  const night = period === 'night';
  const precipitation = ['drizzle', 'rain', 'heavy-rain', 'storm'].includes(atmosphere);
  return (
    <div className={`atmos atmos-${atmosphere} period-${period}`} key={`${atmosphere}-${period}`} aria-hidden="true">
      <div className="atmos-tint" />
      {night && <div className="atmos-stars" />}
      {atmosphere === 'clear' && !night && <div className="atmos-glow" />}
      {(atmosphere === 'clouds' || precipitation || atmosphere === 'snow') && (
        <div className="atmos-clouds">
          <span />
          <span />
          <span />
        </div>
      )}
      {atmosphere === 'fog' && (
        <div className="atmos-fog">
          <span />
          <span />
        </div>
      )}
      {precipitation && <div className={`atmos-rain ${atmosphere === 'drizzle' ? 'is-light' : ''} ${atmosphere === 'heavy-rain' ? 'is-heavy' : ''}`} />}
      {atmosphere === 'snow' && <div className="atmos-snow" />}
      {atmosphere === 'storm' && <div className="atmos-lightning" />}
    </div>
  );
}
