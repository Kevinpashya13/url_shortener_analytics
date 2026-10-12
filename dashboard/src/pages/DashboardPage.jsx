import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Users, ArrowUpRight, ArrowDownRight,
  Copy, Check, ExternalLink, Plus, Globe, Sparkles, Lock, Calendar, Info, Trash2, Pencil, X, QrCode,
  Sliders, ChevronDown, ChevronUp, RotateCcw, AlertCircle
} from 'lucide-react';
import {
  createShortUrl, getMyUrls, getAccountMe,
  getAccountAnalyticsOverview, upgradeAccount, deleteShortUrl, updateShortUrl
} from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import QrCodeModal from '../components/QrCodeModal';
import './DashboardPage.css';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function getCountryName(code) {
  if (!code || code.toLowerCase() === 'unknown') return 'Indonesia';
  try {
    return regionNames.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

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

// ── Donut Chart (Device) ───────────────────────────────────────────────────
function DeviceDonutChart({ breakdown, isStandard, unit = 'Sessions' }) {
  const [hoveredKey, setHoveredKey] = useState(null);

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

// ── Browser Breakdown ────────────────────────────────────────────────────────
function BrowserBreakdownCard({ breakdown, isStandard }) {
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
  const totalBrowserClicks = items.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;

  const browsers = items
    .filter((b) => b.browser && b.count > 0)
    .slice(0, 5)
    .map((b) => {
      const name = b.browser === 'unknown' ? 'Unknown Browser' : b.browser;
      const pct = Math.round((b.count / totalBrowserClicks) * 100);
      return {
        name,
        count: b.count,
        pct,
      };
    });

  return (
    <div className="dash-box">
      <div className="box-header">
        <h3 className="card-section-title">Session by Browser</h3>
      </div>

      {browsers.length === 0 ? (
        <p className="no-data-hint" style={{ padding: '24px 0', textAlign: 'center' }}>
          No browser data recorded yet.
        </p>
      ) : (
        <div className="browser-bars-list">
          {browsers.map((b) => (
            <div className="browser-bar-item" key={b.name}>
              <div className="browser-bar-info">
                <span className="browser-name-text">{b.name}</span>
                <span className="browser-count-text">
                  {b.count.toLocaleString()}{' '}
                  <span className="browser-pct-text">({b.pct}%)</span>
                </span>
              </div>
              <div className="browser-bar-track">
                <div
                  className="browser-bar-fill"
                  style={{ width: `${Math.max(4, b.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Country Breakdown ─────────────────────────────────────────────────────────
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
  const totalCountryClicks = items.reduce((acc, curr) => acc + (curr.count || 0), 0) || totalClicks || 1;

  const countries = items.slice(0, 5).map((c) => {
    const name = getCountryName(c.country);
    const count = c.count || 0;
    const pct = Math.round((count / totalCountryClicks) * 100);
    return { name, count, pct };
  });

  return (
    <div className="dash-box">
      <div className="box-header">
        <h3 className="card-section-title">Active Users by Location</h3>
      </div>

      {countries.length === 0 ? (
        <p className="no-data-hint" style={{ padding: '24px 0', textAlign: 'center' }}>
          No location data recorded yet.
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

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
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
  const [linkPassword, setLinkPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState('');
  const [qrSelected, setQrSelected] = useState(null);

  // UTM Campaign Builder state
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const FIELD_HELP = {
    source: {
      title: 'Campaign Source (utm_source)',
      desc: 'The platform, search engine, or referrer where traffic originates.',
      example: 'e.g. google, instagram, facebook, newsletter, tiktok',
    },
    medium: {
      title: 'Campaign Medium (utm_medium)',
      desc: 'Marketing medium or delivery channel format.',
      example: 'e.g. cpc, bio, email, social, banner, story',
    },
    campaign: {
      title: 'Campaign Name (utm_campaign)',
      desc: 'Specific marketing campaign, promo tag, or product slogan.',
      example: 'e.g. summer_sale, holiday_promo, launch_2026',
    },
    term: {
      title: 'Campaign Term (utm_term)',
      desc: 'Search keywords tracked for paid search advertising.',
      example: 'e.g. running_shoes, web_agency, design_tips',
    },
    content: {
      title: 'Campaign Content (utm_content)',
      desc: 'Differentiates multiple links or creative variants for A/B testing.',
      example: 'e.g. top_banner, cta_blue_btn, footer_link',
    },
  };

  const buildFinalUrl = (baseUrl) => {
    if (!baseUrl) return '';
    try {
      const formatted = baseUrl.startsWith('http://') || baseUrl.startsWith('https://') ? baseUrl : `https://${baseUrl}`;
      const urlObj = new URL(formatted);
      if (utmSource.trim()) urlObj.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium.trim()) urlObj.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign.trim()) urlObj.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm.trim()) urlObj.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent.trim()) urlObj.searchParams.set('utm_content', utmContent.trim());
      return urlObj.toString();
    } catch {
      return baseUrl;
    }
  };

  const hasUtm = Boolean(utmSource.trim() || utmMedium.trim() || utmCampaign.trim() || utmTerm.trim() || utmContent.trim());

  const [editingUrl, setEditingUrl] = useState(null);
  const [editAlias, setEditAlias] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editLoading, setEditLoading] = useState(false);

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

    const destinationUrl = hasUtm ? buildFinalUrl(originalUrl) : originalUrl;

    try {
      const res = await createShortUrl(
        destinationUrl,
        customAlias || null,
        expiredAt || null,
        fallbackUrl || null,
        linkPassword || null
      );
      toast.success(`Short link created: ${res.data.shortUrl}`);
      setOriginalUrl('');
      setCustomAlias('');
      setExpiredAt('');
      setFallbackUrl('');
      setLinkPassword('');
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
      setUtmTerm('');
      setUtmContent('');
      setShowUtm(false);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create short URL';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleStartEdit = (u) => {
    setEditingUrl(u);
    setEditAlias(u.shortCode);
    setEditDestination(u.originalUrl);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUrl) return;
    setEditLoading(true);
    try {
      await updateShortUrl(editingUrl.shortCode, {
        newAlias: editAlias !== editingUrl.shortCode ? editAlias : undefined,
        originalUrl: features.editDestination ? editDestination : undefined,
      });
      const [urlsRes, meRes] = await Promise.all([getMyUrls(), getAccountMe()]);
      setUrls(urlsRes.data);
      setAccount(meRes.data);
      toast.success('Short link updated successfully.');
      setEditingUrl(null);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update short URL';
      setError(errMsg);
      toast.error(errMsg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (shortCode) => {
    if (!window.confirm(`Are you sure you want to delete /${shortCode}? This link will be deactivated immediately.`)) {
      return;
    }
    try {
      await deleteShortUrl(shortCode);
      const [urlsRes, meRes] = await Promise.all([getMyUrls(), getAccountMe()]);
      setUrls(urlsRes.data);
      setAccount(meRes.data);
      toast.success(`Link /${shortCode} deleted successfully.`);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to delete URL';
      setError(errMsg);
      toast.error(errMsg);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success('Link copied to clipboard!');
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
          {/* Donut Device Chart */}
          <DeviceDonutChart
            breakdown={overview?.deviceBreakdown}
            isStandard={isStandard}
            unit="Sessions"
          />

          {/* Browser Breakdown Card */}
          <BrowserBreakdownCard
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
              <input
                type="text"
                placeholder="Custom alias (optional)"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="input-sub"
              />

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

              {features.passwordProtection ? (
                <input
                  type="password"
                  placeholder="Link password (optional)"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  className="input-sub"
                />
              ) : (
                <div className="locked-pill">
                  <span>Password</span>
                  <Link to="/pricing" className="pill-badge">Pro ↑</Link>
                </div>
              )}
            </div>

            {/* UTM Tracking Collapsible Button */}
            <div className="utm-toggle-row">
              <button
                type="button"
                className={`btn-toggle-utm ${showUtm ? 'active' : ''}`}
                onClick={() => setShowUtm(!showUtm)}
              >
                <Sliders size={13} />
                <span>{showUtm ? 'Hide Campaign Tracking (UTM)' : 'Add Campaign Tracking (UTM)'}</span>
                {hasUtm && <span className="utm-badge-dot">Active</span>}
                {showUtm ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {hasUtm && (
                <button
                  type="button"
                  className="btn-clear-utm"
                  onClick={() => {
                    setUtmSource('');
                    setUtmMedium('');
                    setUtmCampaign('');
                    setUtmTerm('');
                    setUtmContent('');
                  }}
                  title="Clear all UTM parameters"
                >
                  <RotateCcw size={12} /> Clear UTM
                </button>
              )}
            </div>

            {/* UTM Builder Panel */}
            {showUtm && (
              <div className="utm-builder-panel">
                <div className="utm-fields-grid">
                  {/* Field 1: Source */}
                  <div className="utm-field">
                    <div className="utm-label-row">
                      <label className="utm-label">
                        Campaign Source <span className="req-dot">*</span>
                      </label>
                      <div className="utm-help-wrap">
                        <span className="btn-help-icon" title="Campaign Source information" tabIndex={0}>
                          <AlertCircle size={13} />
                        </span>
                        <div className="help-hover-card">
                          <span className="help-title">{FIELD_HELP.source.title}</span>
                          <p className="help-desc">{FIELD_HELP.source.desc}</p>
                          <div className="help-example">{FIELD_HELP.source.example}</div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. google, instagram, newsletter"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      className="utm-input"
                    />
                  </div>

                  {/* Field 2: Medium */}
                  <div className="utm-field">
                    <div className="utm-label-row">
                      <label className="utm-label">Campaign Medium</label>
                      <div className="utm-help-wrap">
                        <span className="btn-help-icon" title="Campaign Medium information" tabIndex={0}>
                          <AlertCircle size={13} />
                        </span>
                        <div className="help-hover-card">
                          <span className="help-title">{FIELD_HELP.medium.title}</span>
                          <p className="help-desc">{FIELD_HELP.medium.desc}</p>
                          <div className="help-example">{FIELD_HELP.medium.example}</div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. cpc, bio, email, social"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      className="utm-input"
                    />
                  </div>

                  {/* Field 3: Campaign */}
                  <div className="utm-field">
                    <div className="utm-label-row">
                      <label className="utm-label">Campaign Name</label>
                      <div className="utm-help-wrap">
                        <span className="btn-help-icon" title="Campaign Name information" tabIndex={0}>
                          <AlertCircle size={13} />
                        </span>
                        <div className="help-hover-card">
                          <span className="help-title">{FIELD_HELP.campaign.title}</span>
                          <p className="help-desc">{FIELD_HELP.campaign.desc}</p>
                          <div className="help-example">{FIELD_HELP.campaign.example}</div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. summer_sale, promo_launch"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="utm-input"
                    />
                  </div>

                  {/* Field 4: Term */}
                  <div className="utm-field">
                    <div className="utm-label-row">
                      <label className="utm-label">Campaign Term (Optional)</label>
                      <div className="utm-help-wrap">
                        <span className="btn-help-icon" title="Campaign Term information" tabIndex={0}>
                          <AlertCircle size={13} />
                        </span>
                        <div className="help-hover-card">
                          <span className="help-title">{FIELD_HELP.term.title}</span>
                          <p className="help-desc">{FIELD_HELP.term.desc}</p>
                          <div className="help-example">{FIELD_HELP.term.example}</div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. running+shoes"
                      value={utmTerm}
                      onChange={(e) => setUtmTerm(e.target.value)}
                      className="utm-input"
                    />
                  </div>

                  {/* Field 5: Content */}
                  <div className="utm-field">
                    <div className="utm-label-row">
                      <label className="utm-label">Campaign Content (Optional)</label>
                      <div className="utm-help-wrap">
                        <span className="btn-help-icon" title="Campaign Content information" tabIndex={0}>
                          <AlertCircle size={13} />
                        </span>
                        <div className="help-hover-card">
                          <span className="help-title">{FIELD_HELP.content.title}</span>
                          <p className="help-desc">{FIELD_HELP.content.desc}</p>
                          <div className="help-example">{FIELD_HELP.content.example}</div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. banner_top, cta_blue"
                      value={utmContent}
                      onChange={(e) => setUtmContent(e.target.value)}
                      className="utm-input"
                    />
                  </div>
                </div>

                {/* Realtime Live Preview */}
                {originalUrl && hasUtm && (
                  <div className="utm-preview-box">
                    <span className="utm-preview-tag">Assembled URL:</span>
                    <span className="utm-preview-url" title={buildFinalUrl(originalUrl)}>
                      {buildFinalUrl(originalUrl)}
                    </span>
                  </div>
                )}
              </div>
            )}

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
                    const shortUrl = `${API_BASE_URL}/${u.shortCode}`;
                    return (
                      <tr key={u.shortCode}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a href={shortUrl} target="_blank" rel="noreferrer" className="table-short-link">
                              /{u.shortCode}
                            </a>
                            {u.hasPassword && (
                              <span className="table-pw-badge" title="Password protected link">
                                <Lock size={12} color="#6366f1" />
                              </span>
                            )}
                          </div>
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
                            <button
                              type="button"
                              onClick={() => setQrSelected({ url: shortUrl, shortCode: u.shortCode })}
                              className="table-qr-btn"
                              title="View QR Code"
                            >
                              <QrCode size={13} />
                            </button>
                            <Link to={`/analytics/${u.shortCode}`} className="table-analytics-btn">
                              Analytics <ExternalLink size={12} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(u)}
                              className="table-edit-btn"
                              title="Edit link"
                            >
                              <Pencil size={13} />
                            </button>
                            {features.deleteUrl && (
                              <button
                                type="button"
                                onClick={() => handleDelete(u.shortCode)}
                                className="table-delete-btn"
                                title="Delete short link"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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

      {/* Edit Link Modal */}
      {editingUrl && (
        <div className="modal-overlay" onClick={() => setEditingUrl(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Short Link</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingUrl(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="modal-field">
                <label>Custom Alias</label>
                <div className="modal-input-prefix">
                  <span className="prefix-domain">{window.location.host}/</span>
                  <input
                    type="text"
                    value={editAlias}
                    onChange={(e) => setEditAlias(e.target.value)}
                    placeholder="my-alias"
                    required
                  />
                </div>
                <span className="field-hint">All users can rename their short link alias.</span>
              </div>

              <div className="modal-field">
                <div className="field-label-row">
                  <label>Destination URL</label>
                  {!features.editDestination && (
                    <Link to="/pricing" className="pill-badge">Pro ↑</Link>
                  )}
                </div>
                <input
                  type="url"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  disabled={!features.editDestination}
                  className={!features.editDestination ? 'input-locked' : ''}
                  required
                />
                {!features.editDestination ? (
                  <span className="field-hint text-warning">
                    Upgrading to Pro or Premium is required to change destination URL.
                  </span>
                ) : (
                  <span className="field-hint">Traffic will redirect to this updated URL.</span>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingUrl(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={!!qrSelected}
        onClose={() => setQrSelected(null)}
        url={qrSelected?.url}
        shortCode={qrSelected?.shortCode}
      />
    </div>
  );
}