const Bar = ({ w = '100%', h = 14, style }) => <span className="skeleton" style={{ width: w, height: h, ...style }} />;

// First-load skeleton: one placeholder per dashboard area, in the same grid.
export default function LoadingState() {
  return (
    <>
      <p className="sr-only" role="status">
        Loading weather...
      </p>
      <div className="area-current">
        <div className="card current skeleton-card">
          <Bar w="45%" h={12} />
          <Bar w="60%" h={22} />
          <Bar w="40%" h={80} style={{ alignSelf: 'center', marginTop: 24 }} />
          <Bar w="50%" h={90} style={{ alignSelf: 'center', borderRadius: 999 }} />
          <p className="loading-label">
            <span className="spinner" aria-hidden="true" /> Loading weather...
          </p>
        </div>
      </div>
      <div className="area-forecast">
        <div className="card skeleton-card forecast">
          <Bar w="35%" h={18} />
          {Array.from({ length: 7 }, (_, i) => (
            <Bar key={i} h={34} style={{ borderRadius: 12 }} />
          ))}
        </div>
      </div>
      <div className="area-map">
        <div className="card skeleton-card map-card">
          <Bar h="100%" style={{ flex: 1, minHeight: 260, borderRadius: 14 }} />
        </div>
      </div>
      <div className="area-favs">
        <div className="favorites skeleton-stack">
          {[0, 1].map((i) => (
            <div key={i} className="card skeleton-card">
              <Bar w="55%" h={16} />
              <Bar w="35%" h={28} />
            </div>
          ))}
        </div>
      </div>
      <div className="area-overview">
        <div className="card skeleton-card overview">
          <Bar w="18%" h={16} />
          <div className="skeleton-hours">
            {Array.from({ length: 8 }, (_, i) => (
              <Bar key={i} h={104} style={{ borderRadius: 14 }} />
            ))}
          </div>
          <Bar w="20%" h={18} />
          <Bar h={220} style={{ borderRadius: 14 }} />
        </div>
      </div>
      <div className="area-details">
        <div className="details-row">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card skeleton-card">
              <Bar w="40%" h={18} />
              <Bar h={120} style={{ borderRadius: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
