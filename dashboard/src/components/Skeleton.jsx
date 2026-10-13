import './Skeleton.css';

export function Skeleton({ width, height, borderRadius, className = '', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: borderRadius || '6px',
        ...style,
      }}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton-screen">
      <div className="page-skeleton-content">
        <div className="page-skeleton-logo">KP</div>
        <div className="page-skeleton-bar-wrap">
          <div className="page-skeleton-bar" />
        </div>
        <span className="page-skeleton-text">Initializing session...</span>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="analytics-screen analytics-skeleton-wrap">
      {/* Top Header Skeleton */}
      <div className="dash-top-bar" style={{ marginBottom: '28px' }}>
        <div>
          <Skeleton width="130px" height="20px" borderRadius="6px" style={{ marginBottom: '10px' }} />
          <Skeleton width="280px" height="34px" borderRadius="8px" style={{ marginBottom: '8px' }} />
          <Skeleton width="360px" height="18px" borderRadius="6px" />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Skeleton width="100px" height="38px" borderRadius="8px" />
          <Skeleton width="100px" height="38px" borderRadius="8px" />
        </div>
      </div>

      {/* Date Filter Bar Skeleton */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <Skeleton width="90px" height="34px" borderRadius="999px" />
        <Skeleton width="110px" height="34px" borderRadius="999px" />
        <Skeleton width="90px" height="34px" borderRadius="999px" />
      </div>

      {/* 4 Stats Cards Skeleton */}
      <div className="ap-stats-four-grid" style={{ marginBottom: '24px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi-card" style={{ padding: '20px' }}>
            <Skeleton width="60%" height="14px" style={{ marginBottom: '14px' }} />
            <Skeleton width="45%" height="32px" borderRadius="6px" style={{ marginBottom: '10px' }} />
            <Skeleton width="80%" height="12px" />
          </div>
        ))}
      </div>

      {/* Big Chart Box Skeleton */}
      <div className="dash-box" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Skeleton width="180px" height="22px" />
          <Skeleton width="120px" height="16px" />
        </div>
        <div className="skeleton-chart-bars">
          {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((h, i) => (
            <div key={i} className="skeleton-chart-bar-wrap">
              <div className="skeleton-shimmer" style={{ width: '100%', height: `${h}%`, borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Breakdown Grid Skeleton */}
      <div className="ap-two-col-grid">
        <div className="dash-box" style={{ padding: '24px' }}>
          <Skeleton width="180px" height="20px" style={{ marginBottom: '20px' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <Skeleton width="40%" height="14px" />
                <Skeleton width="20%" height="14px" />
              </div>
              <Skeleton width="100%" height="8px" borderRadius="4px" />
            </div>
          ))}
        </div>

        <div className="dash-box" style={{ padding: '24px' }}>
          <Skeleton width="180px" height="20px" style={{ marginBottom: '20px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
            <Skeleton width="120px" height="120px" borderRadius="50%" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
