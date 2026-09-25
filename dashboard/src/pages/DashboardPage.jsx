import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, MoreHorizontal, Users, ArrowUpRight, ArrowDownRight,
  Copy, Check, ExternalLink, Plus, Globe, Sparkles, Lock, Calendar, Info
} from 'lucide-react';
import {
  createShortUrl, getMyUrls, getAccountMe,
  getAccountAnalyticsOverview, upgradeAccount
} from '../api/url';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

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

function getCountryFlag(code) {
  if (!code || code === 'unknown' || code.length !== 2) return '🌐';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
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

// ── Smooth Spline Curve Chart ────────────────────────────────────────────────
function SplineSiteSessionsChart({
  trendData,
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

  const days = (trendData && trendData.length > 0)
    ? trendData
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

    // Reject if outside the actual plot bounds
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
  // Ensure the last date is shown if not too close to the previous shown label
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

  // Range description text
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
            <h3 className="card-section-title">Site Sessions</h3>
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
            <linearGradient id="trafficAreaGrad" x1="0" y1="0" x2="0" y2="1">
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
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          ))}

          {/* Non-overlapping X labels */}
          {days.map((d, i) => {
            if (!visibleLabelIndices.has(i)) return null;
            return (
              <text key={d.date} x={getX(i)} y={H - 10} fill="#94a3b8" fontSize="11" textAnchor="middle">
                {d.date}
              </text>
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#trafficAreaGrad)" />}

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

        {/* Floating Tooltip Card (ONLY when hovered, positioned on canvas) */}
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
            <span>Belum ada sesi tercatat pada periode ini</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Overlapping Circles / Bubble Pack (Device) ───────────────────────────────
function DeviceBubbleChart({ breakdown, isStandard }) {
  if (isStandard) {
    return (
      <div className="dash-box">
        <div className="box-header">
          <h3 className="card-section-title">Session by Device</h3>
        </div>
        <div className="chart-locked-box">
          <Lock size={20} color="#6366f1" />
          <p>Device analytics is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-badge">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const items = breakdown || [];
  const desktopCount = items.find((b) => b.deviceType?.toLowerCase() === 'desktop')?.count || 0;
  const mobileCount = items.find((b) => b.deviceType?.toLowerCase() === 'mobile')?.count || 0;
  const tabletCount = items.find((b) => b.deviceType?.toLowerCase() === 'tablet')?.count || 0;
  const total = desktopCount + mobileCount + tabletCount;

  const desktopPct = total > 0 ? Math.round((desktopCount / total) * 100) : 0;
  const mobilePct = total > 0 ? Math.round((mobileCount / total) * 100) : 0;
  const tabletPct = total > 0 ? Math.round((tabletCount / total) * 100) : 0;

  return (
    <div className="dash-box">
      <div className="box-header">
        <h3 className="card-section-title">Session by Device</h3>
        <button className="icon-btn-ghost"><MoreHorizontal size={18} /></button>
      </div>

      <div className="bubble-graphic-wrap">
        <svg viewBox="0 0 260 210" className="bubble-svg">
          <circle cx="95" cy="95" r="72" fill="#3b82f6" />
          <text x="95" y="103" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="800">
            {desktopPct}%
          </text>

          <circle cx="185" cy="85" r="48" fill="#044e43" />
          <text x="185" y="91" textAnchor="middle" fill="#ffffff" fontSize="17" fontWeight="700">
            {mobilePct}%
          </text>

          <circle cx="168" cy="148" r="32" fill="#f87171" />
          <text x="168" y="153" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
            {tabletPct}%
          </text>
        </svg>
      </div>

      <div className="device-legend-row">
        <div className="dev-pill">
          <span className="dev-badge blue">●</span>
          <span className="dev-count">{desktopCount.toLocaleString()}</span>
          <span className="dev-name">Desktop</span>
        </div>
        <div className="dev-pill">
          <span className="dev-badge green">●</span>
          <span className="dev-count">{mobileCount.toLocaleString()}</span>
          <span className="dev-name">Mobile</span>
        </div>
        <div className="dev-pill">
          <span className="dev-badge pink">●</span>
          <span className="dev-count">{tabletCount.toLocaleString()}</span>
          <span className="dev-name">Tablet</span>
        </div>
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
          <p>Browser analytics is available on <strong>Pro</strong> and above.</p>
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
        <button className="icon-btn-ghost"><MoreHorizontal size={18} /></button>
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

// ── World Map & Country List ──────────────────────────────────────────────────
function WorldActiveUsersCard({ breakdown, isStandard, totalClicks }) {
  if (isStandard) {
    return (
      <div className="dash-box">
        <div className="box-header">
          <h3 className="card-section-title">Active Users by Location</h3>
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
  const countries = items.slice(0, 6).map((c) => ({
    flag: getCountryFlag(c.country),
    name: COUNTRY_NAMES[c.country?.toUpperCase()] || c.country || 'Unknown',
    count: c.count.toLocaleString(),
  }));

  return (
    <div className="dash-box geo-box">
      <div className="geo-left">
        <h3 className="card-section-title" style={{ marginBottom: '18px' }}>
          Active Users by Location
        </h3>
        {countries.length === 0 ? (
          <p className="no-data-hint">No location data recorded yet.</p>
        ) : (
          <div className="country-list">
            {countries.map((c) => (
              <div className="country-item" key={c.name}>
                <span className="c-flag">{c.flag}</span>
                <span className="c-name">{c.name}</span>
                <span className="c-count">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="geo-right">
        <div className="floating-active-badge">
          <Users size={16} className="fab-icon" />
          <span className="fab-val">{totalClicks.toLocaleString()}</span>
        </div>

        <svg viewBox="0 0 650 340" className="world-map-svg">
          <path fill="#e2e8f0" d="M70,55 C120,40 170,50 190,80 C180,120 150,140 120,135 C100,160 85,150 70,110 Z" />
          <path fill="#e2e8f0" d="M140,165 C175,170 195,210 180,260 C160,280 150,260 140,210 Z" />
          <path fill="#e2e8f0" d="M280,65 C320,50 340,75 320,105 C290,110 275,90 280,65 Z" />
          <path fill="#e2e8f0" d="M280,125 C330,120 345,170 330,225 C300,240 285,210 280,160 Z" />
          <path fill="#e2e8f0" d="M350,60 C440,45 520,70 510,130 C450,160 380,140 350,100 Z" />
          <path fill="#e2e8f0" d="M470,215 C520,210 540,245 510,270 C475,270 460,245 470,215 Z" />

          {[
            { cx: 120, cy: 95 },
            { cx: 165, cy: 220 },
            { cx: 300, cy: 80 },
            { cx: 305, cy: 165 },
            { cx: 415, cy: 95 },
            { cx: 460, cy: 155 },
            { cx: 495, cy: 240 },
          ].map((pin, i) => (
            <g key={i}>
              <circle cx={pin.cx} cy={pin.cy} r="14" fill="#3b82f6" opacity="0.18" className="map-pulse-ring" />
              <circle cx={pin.cx} cy={pin.cy} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [urls, setUrls] = useState([]);
  const [account, setAccount] = useState(null);
  const [overview, setOverview] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null); // null = default 7 days
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [originalUrl, setOriginalUrl] = useState(location.state?.pendingUrl || '');
  const [customAlias, setCustomAlias] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState('');

  const role = user?.role || 'STANDARD';
  const isStandard = role === 'STANDARD';
  const features = account?.features || {};

  const fetchOverview = async (params = {}) => {
    try {
      const res = await getAccountAnalyticsOverview(params);
      setOverview(res.data);
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [urlsRes, meRes] = await Promise.all([
        getMyUrls(),
        getAccountMe(),
      ]);
      setUrls(urlsRes.data);
      setAccount(meRes.data);
      // Default: 7 days
      await fetchOverview({ days: 7 });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    const upgradeRole = location.state?.upgradeRole;
    if (upgradeRole) {
      upgradeAccount(upgradeRole)
        .then(() => {
          setSuccess(`🎉 Successfully upgraded to ${upgradeRole}! Please log in again to apply changes.`);
          navigate('/dashboard', { replace: true, state: {} });
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'Upgrade failed');
        });
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleSelectRange = (rangeId) => {
    if (rangeId === selectedRange || rangeId === 'default') {
      // Toggle off / reset to default 7 days
      setSelectedRange(null);
      fetchOverview({ days: 7 });
      return;
    }

    setSelectedRange(rangeId);

    if (rangeId === 'last_month') {
      const { startDate, endDate } = getLastMonthRange();
      fetchOverview({ startDate, endDate });
    } else if (rangeId === 'all') {
      fetchOverview({ days: 'all' });
    }
  };

  const handleApplyCustom = (start, end) => {
    setSelectedRange('custom');
    fetchOverview({ startDate: start, endDate: end });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await createShortUrl(
        originalUrl,
        customAlias || null,
        expiredAt || null,
        fallbackUrl || null
      );
      setSuccess(`Created: ${res.data.shortUrl}`);
      setOriginalUrl('');
      setCustomAlias('');
      setExpiredAt('');
      setFallbackUrl('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create short URL');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  const totalClicksCount = overview?.totalClicks ?? urls.reduce((sum, u) => sum + (u.clickCount || 0), 0);
  const urlsUsed = account?.usage?.urlsThisMonth ?? urls.length;
  const urlsLimit = account?.usage?.urlsLimit === Infinity ? '∞' : (account?.usage?.urlsLimit ?? 50);

  return (
    <div className="dash-screen">
      {/* ── Top Header ── */}
      <div className="dash-top-bar">
        <div>
          <h1 className="dash-main-title">Dashboard</h1>
          <p className="dash-main-sub">Search and manage your shortened links & traffic</p>
        </div>

        <div className="dash-user-area">
          <div className="notification-bell">
            <Bell size={20} />
            <span className="bell-badge-dot" />
          </div>

          <div className="user-profile-card">
            <div className="user-avatar-circle">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-profile-info">
              <span className="user-profile-name">{user?.email?.split('@')[0] || 'User'}</span>
              <span className="user-profile-role">{role}</span>
            </div>
          </div>

          <Link to="/pricing" className="dash-upgrade-btn">
            <Sparkles size={14} /> Upgrade
          </Link>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="dash-grid-layout">

        {/* ── LEFT COLUMN ── */}
        <div className="dash-col-left">

          {/* 3 KPI Stats Row */}
          <div className="kpi-three-grid">
            <div className="kpi-card">
              <span className="kpi-label">Total Shortened Links</span>
              <div className="kpi-num">{urls.length}</div>
              <div className="kpi-trend green">
                <ArrowUpRight size={13} /> Active <span className="kpi-vs">in library</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Total Clicks Across Links</span>
              <div className="kpi-num">{totalClicksCount.toLocaleString()}</div>
              <div className="kpi-trend green">
                <ArrowUpRight size={13} /> Realtime <span className="kpi-vs">tracked</span>
              </div>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Monthly Link Quota</span>
              <div className="kpi-num">{urlsUsed} <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/ {urlsLimit}</span></div>
              <div className="kpi-trend green">
                <ArrowUpRight size={13} /> {role} Plan
              </div>
            </div>
          </div>

          {/* Spline Chart with Date Range Controls */}
          <div className="dash-box">
            <SplineSiteSessionsChart
              trendData={overview?.clicksTrend}
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
            breakdown={overview?.countryBreakdown}
            isStandard={isStandard}
            totalClicks={totalClicksCount}
          />
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="dash-col-right">
          {/* Overlapping Bubble Device Chart */}
          <DeviceBubbleChart
            breakdown={overview?.deviceBreakdown}
            isStandard={isStandard}
          />

          {/* Striped Vertical Pill Bar Chart */}
          <StripedPillBarChart
            breakdown={overview?.browserBreakdown}
            isStandard={isStandard}
          />
        </div>
      </div>

      {/* ── Bottom Section: URL Creation & Link Management ── */}
      <div className="dash-bottom-section">
        {/* Shorten Form Card */}
        <div className="dash-box">
          <div className="box-header">
            <h3 className="card-section-title">Create a Short Link</h3>
            <span className="quota-pill">{urlsUsed} / {urlsLimit} URLs used</span>
          </div>

          <form onSubmit={handleCreate} className="create-url-form">
            <div className="form-main-row">
              <input
                type="url"
                placeholder="Paste destination URL (e.g. https://yourwebsite.com)"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                className="input-hero"
              />
              <button type="submit" className="btn-create-submit">
                <Plus size={16} /> Shorten URL
              </button>
            </div>

            <div className="form-options-row">
              {features.customAlias ? (
                <input
                  type="text"
                  placeholder="Custom alias (optional)"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="input-sub"
                />
              ) : (
                <div className="locked-pill">
                  <span>Custom Alias</span>
                  <Link to="/pricing" className="pill-badge">Pro ↑</Link>
                </div>
              )}

              {features.expiry ? (
                <input
                  type="datetime-local"
                  value={expiredAt}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  className="input-sub"
                />
              ) : (
                <div className="locked-pill">
                  <span>Link Expiry</span>
                  <Link to="/pricing" className="pill-badge">Pro ↑</Link>
                </div>
              )}

              {features.fallback ? (
                <input
                  type="url"
                  placeholder="Custom Fallback URL (optional)"
                  value={fallbackUrl}
                  onChange={(e) => setFallbackUrl(e.target.value)}
                  className="input-sub"
                />
              ) : (
                <div className="locked-pill">
                  <span>Fallback URL</span>
                  <Link to="/pricing" className="pill-badge purple">Premium ↑</Link>
                </div>
              )}
            </div>

            {error && <p className="form-alert error">{error}</p>}
            {success && <p className="form-alert success">{success}</p>}
          </form>
        </div>

        {/* Link Table / List */}
        <div className="dash-box">
          <div className="box-header">
            <h3 className="card-section-title">Your Shortened Links</h3>
            <span className="links-count-badge">{urls.length} Total</span>
          </div>

          {urls.length === 0 ? (
            <div className="empty-state-box">
              <Globe size={32} className="empty-icon" />
              <p>No shortened links created yet. Enter a URL above to get started!</p>
            </div>
          ) : (
            <div className="links-table-wrap">
              <table className="links-table">
                <thead>
                  <tr>
                    <th>Short Link</th>
                    <th>Destination URL</th>
                    <th>Clicks</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((u) => {
                    const shortUrl = `http://localhost:3000/${u.shortCode}`;
                    return (
                      <tr key={u.shortCode}>
                        <td>
                          <a href={shortUrl} target="_blank" rel="noreferrer" className="table-short-link">
                            /{u.shortCode}
                          </a>
                        </td>
                        <td className="table-dest-cell" title={u.originalUrl}>
                          {u.originalUrl}
                        </td>
                        <td>
                          <span className="table-clicks-badge">{u.clickCount} clicks</span>
                        </td>
                        <td className="table-date-cell">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-action-btns">
                            <button className="table-copy-btn" onClick={() => handleCopy(shortUrl)}>
                              {copied === shortUrl ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                              <span>{copied === shortUrl ? 'Copied' : 'Copy'}</span>
                            </button>
                            <Link to={`/analytics/${u.shortCode}`} className="table-analytics-btn">
                              Analytics <ExternalLink size={12} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}