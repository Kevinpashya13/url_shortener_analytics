import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, MousePointerClick, Calendar,
  Clock, ShieldCheck, Copy, Check, Users, Lock, Info
} from 'lucide-react';
import { getAnalytics } from '../api/url';
import { useAuth } from '../context/AuthContext';
import './AnalyticsPage.css';

const COUNTRY_NAMES = {
  US: 'United States',
  ID: 'Indonesia',
  BR: 'Brazil',
  GB: 'United Kingdom',
  ES: 'Spain',
  AR: 'Argentina',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  SG: 'Singapore',
  IN: 'India',
  NL: 'Netherlands',
  CA: 'Canada',
  AU: 'Australia',
};

function toDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLastMonthRange(refDate = new Date()) {
  const now = new Date(refDate);
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();
  const isLastDay = (date === lastDayOfCurrentMonth);

  let start, end;
  if (isLastDay) {
    start = new Date(year, month, 1);
    end = new Date(year, month, lastDayOfCurrentMonth, 23, 59, 59, 999);
  } else {
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    start = new Date(year, month - 1, 1);
    end = new Date(year, month - 1, prevMonthLastDay, 23, 59, 59, 999);
  }
  const monthName = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { startDate: toDateKey(start), endDate: toDateKey(end), monthName };
}

// ── Date Range Filter Component ──────────────────────────────────────────────
function DateRangeFilter({
  selectedRange,
  onSelectRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  onApplyCustom,
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="date-filter-box">
      <div className="date-presets-row">
        {[
          { id: 'last_month', label: 'Last Month' },
          { id: 'all', label: 'All Time' },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            className={`date-preset-btn ${selectedRange === p.id && !showCustom ? 'active' : ''}`}
            onClick={() => {
              setShowCustom(false);
              onSelectRange(p.id);
            }}
          >
            {p.label}
          </button>
        ))}

        <button
          type="button"
          className={`date-preset-btn ${selectedRange === 'custom' || showCustom ? 'active' : ''}`}
          onClick={() => setShowCustom(!showCustom)}
        >
          <Calendar size={13} />
          <span>Custom</span>
        </button>
      </div>

      {showCustom && (
        <div className="date-custom-panel">
          <div className="date-input-group">
            <span className="date-field-label">From</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="date-picker-input"
            />
          </div>
          <span className="date-picker-sep">→</span>
          <div className="date-input-group">
            <span className="date-field-label">To</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="date-picker-input"
            />
          </div>
          <button
            type="button"
            className="date-picker-apply"
            onClick={() => {
              if (customStart && customEnd) {
                onApplyCustom(customStart, customEnd);
                setShowCustom(false);
              }
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ── Smooth Spline Curve Chart for Single URL ──────────────────────────────────
function SplineUrlClicksChart({
  clicksByDay,
  selectedRange,
  onSelectRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  onApplyCustom,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const canvasRef = useRef(null);

  const days = (clicksByDay && clicksByDay.length > 0)
    ? clicksByDay
    : [
        { date: 'Day 1', count: 0 },
        { date: 'Day 2', count: 0 },
        { date: 'Day 3', count: 0 },
        { date: 'Day 4', count: 0 },
        { date: 'Day 5', count: 0 },
        { date: 'Day 6', count: 0 },
        { date: 'Day 7', count: 0 },
      ];

  const W = 700, H = 240;
  const pad = { top: 24, right: 30, bottom: 35, left: 40 };

  const maxVal = Math.max(...days.map((d) => d.count), 5);
  const maxY = Math.ceil(maxVal * 1.25);

  const getX = (i) => pad.left + (i / Math.max(days.length - 1, 1)) * (W - pad.left - pad.right);
  const getY = (v) => pad.top + (1 - v / maxY) * (H - pad.top - pad.bottom);

  // Smooth bezier curve generator
  const createCurvedPath = () => {
    if (days.length === 1) {
      return `M ${getX(0)},${getY(days[0].count)}`;
    }
    return days.reduce((acc, point, i, arr) => {
      const x = getX(i);
      const y = getY(point.count);
      if (i === 0) return `M ${x},${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1].count);
      const cp1x = prevX + (x - prevX) / 2;
      const cp2x = prevX + (x - prevX) / 2;
      return `${acc} C ${cp1x},${prevY} ${cp2x},${y} ${x},${y}`;
    }, '');
  };

  const linePath = createCurvedPath();
  const areaPath = days.length >= 2
    ? `${linePath} L ${getX(days.length - 1)},${H - pad.bottom} L ${getX(0)},${H - pad.bottom} Z`
    : '';

  // Hover restricted strictly to the SVG chart area itself
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (
      clientX < pad.left - 15 ||
      clientX > rect.width - (pad.right * rect.width / W) + 15 ||
      clientY < pad.top - 20 ||
      clientY > rect.height - (pad.bottom * rect.height / H) + 20
    ) {
      setHoveredIdx(null);
      return;
    }

    const scaleX = W / rect.width;
    const svgX = clientX * scaleX;

    let closest = null, minDist = Infinity;
    days.forEach((_, i) => {
      const dist = Math.abs(getX(i) - svgX);
      if (dist < minDist && dist < 45 * scaleX) {
        minDist = dist;
        closest = i;
      }
    });
    setHoveredIdx(closest);
  };

  const yTicks = [0, Math.round(maxY * 0.33), Math.round(maxY * 0.66), maxY];

  // Non-overlapping X labels computation
  const maxLabels = 7;
  const labelStep = Math.max(1, Math.ceil(days.length / maxLabels));
  const visibleLabelIndices = new Set();
  for (let i = 0; i < days.length; i += labelStep) {
    visibleLabelIndices.add(i);
  }
  if (days.length > 1) {
    const lastIdx = days.length - 1;
    let closestPrev = -1;
    visibleLabelIndices.forEach((idx) => {
      if (idx < lastIdx && idx > closestPrev) closestPrev = idx;
    });
    if (lastIdx - closestPrev >= Math.max(1, Math.floor(labelStep * 0.6))) {
      visibleLabelIndices.add(lastIdx);
    }
  }

  const isAllZero = days.length > 0 && days.every((d) => d.count === 0);

  let subDescription = 'Showing last 7 days (default)';
  if (selectedRange === 'last_month') {
    const r = getLastMonthRange();
    subDescription = r.monthName;
  } else if (selectedRange === 'all') {
    subDescription = 'All time traffic';
  } else if (selectedRange === 'custom' && customStart && customEnd) {
    subDescription = `Custom (${customStart} to ${customEnd})`;
  }

  return (
    <div className="spline-chart-wrap">
      <div className="spline-header">
        <div>
          <div className="spline-title-row">
            <h3 className="card-section-title">Clicks Timeline</h3>
          </div>
          <span className="spline-sub-info">{subDescription}</span>
        </div>

        <DateRangeFilter
          selectedRange={selectedRange}
          onSelectRange={onSelectRange}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          onApplyCustom={onApplyCustom}
        />
      </div>

      {/* Dedicated Chart Canvas — Hover ONLY activates here */}
      <div
        className="spline-chart-canvas"
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
          <defs>
            <linearGradient id="urlAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {yTicks.map((val) => (
            <g key={val}>
              <line
                x1={pad.left} y1={getY(val)}
                x2={W - pad.right} y2={getY(val)}
                stroke="#f1f5f9" strokeWidth="1.2"
              />
              <text x={pad.left - 12} y={getY(val) + 3} fill="#94a3b8" fontSize="11" textAnchor="end">
                {val}
              </text>
            </g>
          ))}

          {/* Non-overlapping X labels */}
          {days.map((d, i) => {
            if (!visibleLabelIndices.has(i)) return null;
            return (
              <text key={d.date} x={getX(i)} y={H - 10} fill="#94a3b8" fontSize="11" textAnchor="middle">
                {d.date.length > 5 ? d.date.slice(5) : d.date}
              </text>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#urlAreaGrad)" />}

          {/* Main Traffic Curve */}
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" />

          {/* Active hover dot (ONLY when hovered) */}
          {hoveredIdx !== null && days[hoveredIdx] && (
            <circle
              cx={getX(hoveredIdx)}
              cy={getY(days[hoveredIdx].count)}
              r="6"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
          )}
        </svg>

        {/* Floating Tooltip Card (ONLY when hovered) */}
        {hoveredIdx !== null && days[hoveredIdx] && (
          <div
            className="spline-tooltip-card"
            style={{
              left: `${(getX(hoveredIdx) / W) * 100}%`,
              top: `${Math.max(getY(days[hoveredIdx].count) - 50, 10)}px`,
            }}
          >
            <div className="tooltip-row">
              <span className="tooltip-dot blue" />
              <span className="tooltip-label">{days[hoveredIdx].date}</span>
            </div>
            <div className="tooltip-val blue-text">
              {days[hoveredIdx].count.toLocaleString()}{' '}
              {days[hoveredIdx].count === 1 ? 'click' : 'clicks'}
            </div>
          </div>
        )}
        {isAllZero && (
          <div className="chart-empty-hint">
            <Info size={14} className="empty-hint-icon" />
            <span>Belum ada klik tercatat pada periode ini</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Donut Chart (Device) ───────────────────────────────────────────────────
function DeviceDonutChart({ breakdown, isStandard, unit = 'Clicks' }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  if (isStandard) {
    return (
      <div className="dash-box">
        <div className="box-header">
          <h3 className="card-section-title">Session by Device</h3>
        </div>
        <div className="chart-locked-box">
          <Lock size={20} color="#6366f1" />
          <p>Device breakdown is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-badge">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const items = breakdown || [];
  const desktopCount = items.find((b) => b.deviceType?.toLowerCase() === 'desktop')?.count || 0;
  const mobileCount = items.find((b) => b.deviceType?.toLowerCase() === 'mobile')?.count || 0;
  const tabletCount = items.find((b) => b.deviceType?.toLowerCase() === 'tablet')?.count || 0;

  const knownTypes = ['desktop', 'mobile', 'tablet'];
  const otherCount = items
    .filter((b) => !knownTypes.includes(b.deviceType?.toLowerCase()))
    .reduce((acc, curr) => acc + (curr.count || 0), 0);

  const total = desktopCount + mobileCount + tabletCount + otherCount;

  const devices = [
    { key: 'desktop', label: 'Desktop', count: desktopCount, color: '#3b82f6' },
    { key: 'mobile', label: 'Mobile', count: mobileCount, color: '#044e43' },
    { key: 'tablet', label: 'Tablet', count: tabletCount, color: '#f87171' },
  ];

  if (otherCount > 0) {
    devices.push({ key: 'other', label: 'Other', count: otherCount, color: '#8b5cf6' });
  }

  devices.forEach((d) => {
    d.pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
  });

  const strokeWidth = 22;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  const activeDevices = devices.filter((d) => d.count > 0);
  const gap = activeDevices.length > 1 ? 3 : 0;
  const totalGap = gap * activeDevices.length;
  const availableLength = Math.max(0, circumference - totalGap);

  let accumulatedLength = 0;
  const segments = activeDevices.map((d) => {
    const fraction = total > 0 ? d.count / total : 0;
    const arcLength = fraction * availableLength;
    const offset = accumulatedLength;
    accumulatedLength += arcLength + gap;
    return {
      ...d,
      arcLength,
      offset,
    };
  });

  const activeDevice = hoveredKey ? devices.find((d) => d.key === hoveredKey) : null;

  return (
    <div className="dash-box">
      <div className="box-header">
        <h3 className="card-section-title">Session by Device</h3>
      </div>

      <div className="donut-graphic-wrap">
        <svg viewBox="0 0 200 200" className="donut-svg">
          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Active Data Segments */}
          {total > 0 && segments.map((seg) => {
            const isHovered = hoveredKey === seg.key;
            return (
              <circle
                key={seg.key}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${seg.arcLength} ${circumference}`}
                strokeDashoffset={-seg.offset}
                transform="rotate(-90 100 100)"
                className="donut-segment"
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                  opacity: hoveredKey && !isHovered ? 0.45 : 1,
                  cursor: 'pointer',
                }}
              />
            );
          })}

          {/* Center Text */}
          <text
            x="100"
            y={activeDevice ? 94 : 96}
            textAnchor="middle"
            fill="#0f172a"
            fontSize={activeDevice ? 22 : 24}
            fontWeight="800"
          >
            {activeDevice ? `${activeDevice.pct}%` : (total > 0 ? total.toLocaleString() : '0')}
          </text>
          <text
            x="100"
            y={activeDevice ? 114 : 116}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="600"
          >
            {activeDevice ? activeDevice.label : (total > 0 ? unit : 'No Data')}
          </text>
        </svg>
      </div>

      <div className="device-legend-row">
        {devices.map((d) => (
          <div
            key={d.key}
            className={`dev-pill ${hoveredKey === d.key ? 'active' : ''}`}
            onMouseEnter={() => setHoveredKey(d.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <span className="dev-badge" style={{ color: d.color }}>●</span>
            <span className="dev-count">{d.count.toLocaleString()}</span>
            <span className="dev-name">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Striped Vertical Pill Bar Chart (Browser) ────────────────────────────────
function StripedPillBarChart({ breakdown, isStandard }) {
  if (isStandard) {
    return (
      <div className="dash-box">
        <div className="box-header">
          <h3 className="card-section-title">Session by Browser</h3>
        </div>
        <div className="chart-locked-box">
          <Lock size={20} color="#6366f1" />
          <p>Browser breakdown is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-badge">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const items = breakdown || [];
  const defaultBrowsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];

  const bars = defaultBrowsers.map((bName, idx) => {
    const found = items.find((b) => b.browser?.toLowerCase().includes(bName.toLowerCase()));
    const val = found ? found.count : 0;
    return {
      label: bName,
      val: val.toLocaleString(),
      count: val,
      colorClass: ['bar-pink', 'bar-blue', 'bar-teal', 'bar-red'][idx],
    };
  });

  const maxVal = Math.max(...bars.map((b) => b.count), 1);
  bars.forEach((b) => {
    b.heightPct = b.count > 0 ? Math.max(12, Math.round((b.count / maxVal) * 95)) : 8;
  });

  return (
    <div className="dash-box">
      <div className="box-header">
        <h3 className="card-section-title">Session by Browser</h3>
      </div>

      <div className="striped-bars-container">
        {bars.map((bar) => (
          <div className="striped-col" key={bar.label}>
            <span className="col-val">{bar.val}</span>
            <div className="col-track">
              <div
                className={`col-fill-striped ${bar.colorClass}`}
                style={{ height: `${bar.heightPct}%` }}
              />
            </div>
            <span className="col-label">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Country Breakdown ─────────────────────────────────────────────────────────
function WorldActiveUsersCard({ breakdown, isStandard, totalClicks }) {
  if (isStandard) {
    return (
      <div className="dash-box">
        <div className="box-header">
          <h3 className="card-section-title">Visitors by Location</h3>
        </div>
        <div className="chart-locked-box">
          <Lock size={20} color="#6366f1" />
          <p>Location analytics is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-badge">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const items = breakdown || [];
  const totalCountryClicks = items.reduce((acc, curr) => acc + (curr.count || 0), 0) || totalClicks || 1;

  const countries = items.slice(0, 5).map((c) => {
    const rawCountry = c.country?.toUpperCase();
    const isUnknown = !c.country || rawCountry === 'UNKNOWN';
    const name = isUnknown ? 'Indonesia' : (COUNTRY_NAMES[rawCountry] || c.country);
    const count = c.count || 0;
    const pct = Math.round((count / totalCountryClicks) * 100);
    return { name, count, pct };
  });

  return (
    <div className="dash-box">
      <div className="box-header">
        <h3 className="card-section-title">Visitors by Location</h3>
      </div>

      {countries.length === 0 ? (
        <p className="no-data-hint" style={{ padding: '24px 0', textAlign: 'center' }}>
          No location data recorded yet for this URL.
        </p>
      ) : (
        <div className="country-bars-list">
          {countries.map((c) => (
            <div className="country-bar-item" key={c.name}>
              <div className="country-bar-info">
                <span className="country-name-text">{c.name}</span>
                <span className="country-count-text">
                  {c.count.toLocaleString()}{' '}
                  <span className="country-pct-text">({c.pct}%)</span>
                </span>
              </div>
              <div className="country-bar-track">
                <div
                  className="country-bar-fill"
                  style={{ width: `${Math.max(4, c.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Horizontal Referrer Card ──────────────────────────────────────────────────
function TopReferrersCard({ referrers, isStandard }) {
  if (isStandard) {
    return (
      <div className="dash-box">
        <div className="box-header">
          <h3 className="card-section-title">Top Traffic Referrers</h3>
        </div>
        <div className="chart-locked-box">
          <Lock size={20} color="#6366f1" />
          <p>Referrer analytics is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-badge">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const items = referrers || [];
  const maxCount = Math.max(...items.map((r) => r.count), 1);

  return (
    <div className="dash-box">
      <div className="box-header">
        <h3 className="card-section-title">Top Traffic Referrers</h3>
        <span className="quota-pill">{items.length} Sources</span>
      </div>

      {items.length === 0 ? (
        <p className="no-data-hint">No referrer data recorded yet for this URL.</p>
      ) : (
        <div className="referrers-bars-wrap">
          {items.slice(0, 6).map((r) => {
            const pct = Math.round((r.count / maxCount) * 100);
            return (
              <div className="ref-row" key={r.referrer}>
                <span className="ref-label">{r.referrer || 'Direct / None'}</span>
                <div className="ref-track">
                  <div className="ref-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="ref-count">{r.count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Analytics Page ───────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { shortCode } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [selectedRange, setSelectedRange] = useState(null); // null = default 7 days
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const role = user?.role || 'STANDARD';
  const isStandard = role === 'STANDARD';

  const fetchDetailAnalytics = async (params = {}) => {
    try {
      const res = await getAnalytics(shortCode, params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load url analytics:', err);
    }
  };

  useEffect(() => {
    fetchDetailAnalytics({ days: 7 });
  }, [shortCode]);

  const handleSelectRange = (rangeId) => {
    if (rangeId === selectedRange || rangeId === 'default') {
      setSelectedRange(null);
      fetchDetailAnalytics({ days: 7 });
      return;
    }

    setSelectedRange(rangeId);

    if (rangeId === 'last_month') {
      const { startDate, endDate } = getLastMonthRange();
      fetchDetailAnalytics({ startDate, endDate });
    } else if (rangeId === 'all') {
      fetchDetailAnalytics({ days: 'all' });
    }
  };

  const handleApplyCustom = (start, end) => {
    setSelectedRange('custom');
    fetchDetailAnalytics({ startDate: start, endDate: end });
  };

  if (!data) return <div className="ap-loading-wrap">Loading analytics...</div>;

  const shortUrl = `http://localhost:3000/${data.shortCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="analytics-screen">
      {/* ── Top Header ── */}
      <div className="dash-top-bar">
        <div>
          <Link to="/dashboard" className="ap-back-btn">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <h1 className="dash-main-title" style={{ marginTop: '8px' }}>
            /{data.shortCode}
          </h1>
          <a href={data.originalUrl} target="_blank" rel="noreferrer" className="ap-dest-link">
            <span>{data.originalUrl}</span>
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="dash-user-area">
          <button className="ap-copy-btn" onClick={handleCopy}>
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            <span>{copied ? 'Copied Link' : 'Copy Short Link'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Grid Layout ── */}
      <div className="dash-grid-layout">

        {/* ── Left Column ── */}
        <div className="dash-col-left">

          {/* 3 KPI Stats */}
          <div className="kpi-three-grid">
            <div className="kpi-card">
              <span className="kpi-label">Total Clicks</span>
              <div className="kpi-num">{data.totalClicks.toLocaleString()}</div>
              <div className="kpi-trend green">
                <MousePointerClick size={13} /> Realtime clicks
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Creation Date</span>
              <div className="kpi-num" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
                {new Date(data.createdAt).toLocaleDateString()}
              </div>
              <div className="kpi-trend green">
                <Calendar size={13} /> Active link
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">{data.expiredAt ? 'Link Expiry' : 'Fallback Status'}</span>
              <div className="kpi-num" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
                {data.expiredAt ? new Date(data.expiredAt).toLocaleDateString() : (data.fallbackUrl ? 'Custom' : 'Default 404')}
              </div>
              <div className="kpi-trend">
                {data.expiredAt ? <Clock size={13} color="#f59e0b" /> : <ShieldCheck size={13} color="#6366f1" />}
                <span className="kpi-vs">{data.fallbackUrl ? 'Redirect set' : 'Standard'}</span>
              </div>
            </div>
          </div>

          {/* Spline Chart with Date Range Controls */}
          <div className="dash-box">
            <SplineUrlClicksChart
              clicksByDay={data.clicksByDay}
              selectedRange={selectedRange}
              onSelectRange={handleSelectRange}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              onApplyCustom={handleApplyCustom}
            />
          </div>

          {/* World Active Users */}
          <WorldActiveUsersCard
            breakdown={data.countryBreakdown}
            isStandard={isStandard}
            totalClicks={data.totalClicks}
          />

          {/* Traffic Referrers */}
          <TopReferrersCard
            referrers={data.topReferrers}
            isStandard={isStandard}
          />
        </div>

        {/* ── Right Column ── */}
        <div className="dash-col-right">
          {/* Donut Device Chart */}
          <DeviceDonutChart
            breakdown={data.deviceBreakdown}
            isStandard={isStandard}
            unit="Clicks"
          />

          {/* Striped Vertical Pill Bar Chart */}
          <StripedPillBarChart
            breakdown={data.browserBreakdown}
            isStandard={isStandard}
          />
        </div>

      </div>
    </div>
  );
}