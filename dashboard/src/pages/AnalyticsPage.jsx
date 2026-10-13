import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Calendar, Copy, Check,
  Lock, Info, QrCode, Download
} from 'lucide-react';
import { getAnalytics, getMyUrls } from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import QrCodeModal from '../components/QrCodeModal';
import { generateAnalyticsCsv, downloadCsv } from '../utils/csvExport';
import './DashboardPage.css';
import './AnalyticsPage.css';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function normalizeCountries(countryBreakdown) {
  if (!countryBreakdown || countryBreakdown.length === 0) return [];
  const map = {};
  for (const item of countryBreakdown) {
    const raw = item.country?.trim()?.toUpperCase() || 'UNKNOWN';
    let label = 'Unknown';
    if (raw === 'ID' || raw === 'INDONESIA' || raw === 'UNKNOWN') {
      label = 'Indonesia';
    } else {
      try {
        label = regionNames.of(raw) || raw;
      } catch {
        label = raw;
      }
    }
    map[label] = (map[label] || 0) + (item.count || 0);
  }
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
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

// ── Spline Chart Driven by Single URL Clicks (Real Data) ─────────────────────
function SplineClickAnalyticsChart({ trendData }) {
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

  const maxVal = Math.max(...days.map((d) => d.count), 5);
  const maxY = Math.ceil(maxVal * 1.3);

  const W = 620, H = 210;
  const pad = { top: 25, right: 25, bottom: 30, left: 35 };

  const getX = (i) => pad.left + (i / Math.max(days.length - 1, 1)) * (W - pad.left - pad.right);
  const getY = (val) => pad.top + (1 - Math.min(val, maxY) / maxY) * (H - pad.top - pad.bottom);

  // Smooth bezier curve
  const linePath = days.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.count);
    if (i === 0) return `M ${x},${y}`;
    const prevX = getX(i - 1);
    const prevY = getY(days[i - 1].count);
    const cp1x = prevX + (x - prevX) / 2;
    const cp2x = prevX + (x - prevX) / 2;
    return `${acc} C ${cp1x},${prevY} ${cp2x},${y} ${x},${y}`;
  }, '');

  const areaPath = days.length >= 2
    ? `${linePath} L ${getX(days.length - 1)},${H - pad.bottom} L ${getX(0)},${H - pad.bottom} Z`
    : '';

  const yTicks = [
    0,
    Math.round(maxY * 0.25),
    Math.round(maxY * 0.5),
    Math.round(maxY * 0.75),
    maxY
  ];

  const step = Math.max(1, Math.ceil(days.length / 7));
  const visibleIndices = new Set();
  for (let i = 0; i < days.length; i += step) visibleIndices.add(i);
  if (days.length > 1) visibleIndices.add(days.length - 1);

  const isAllZero = days.every((d) => d.count === 0);

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
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

  return (
    <div
      className="spline-chart-wrap"
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
      style={{ position: 'relative' }}
    >
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <linearGradient id="splineTealGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#086288" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#086288" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid lines */}
        {yTicks.map((val) => (
          <g key={val}>
            <line
              x1={pad.left} y1={getY(val)}
              x2={W - pad.right} y2={getY(val)}
              stroke="#e2edf5" strokeWidth="1"
            />
            <text x={pad.left - 8} y={getY(val) + 3} fill="#94a3b8" fontSize="10" textAnchor="end" fontWeight="500">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            </text>
          </g>
        ))}

        {/* X Labels */}
        {days.map((pt, i) => {
          if (!visibleIndices.has(i)) return null;
          return (
            <text key={pt.date + i} x={getX(i)} y={H - 8} fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="500">
              {pt.date}
            </text>
          );
        })}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#splineTealGradient)" />}

        {/* Single real click curve */}
        <path d={linePath} fill="none" stroke="#086288" strokeWidth="3" strokeLinecap="round" />

        {/* Active Hover Dot on Click Line */}
        {hoveredIdx !== null && days[hoveredIdx] && (
          <circle
            cx={getX(hoveredIdx)}
            cy={getY(days[hoveredIdx].count)}
            r="5.5"
            fill="#086288"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
        )}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIdx !== null && days[hoveredIdx] && (
        <div
          className="spline-floating-tooltip"
          style={{
            left: `${(getX(hoveredIdx) / W) * 100}%`,
            top: `${Math.max(getY(days[hoveredIdx].count) - 45, 10)}px`,
          }}
        >
          <span className="tooltip-date">{days[hoveredIdx].date}</span>
          <span className="tooltip-clicks">{days[hoveredIdx].count.toLocaleString()} clicks</span>
        </div>
      )}

      {isAllZero && (
        <div className="chart-empty-subtle">
          <Info size={13} />
          <span>No click sessions recorded in this timeframe</span>
        </div>
      )}
    </div>
  );
}

// ── Top Referring Domains Donut Chart (Real Data) ───────────────────────────
function TopReferringDomainsCard({ referrers, isStandard }) {
  if (isStandard) {
    return (
      <div className="dash-card card-referring">
        <div className="card-header-clean">
          <h3 className="card-clean-title">Top Referring Domains</h3>
        </div>
        <div className="card-locked-inline">
          <Lock size={18} color="#086288" />
          <p>Referral analytics is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-upgrade-link">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const raw = referrers || [];
  const total = raw.reduce((sum, r) => sum + (r.count || 0), 0);

  const colors = ['#f97316', '#14b8a6', '#0284c7', '#eab308', '#8b5cf6'];
  const items = raw.slice(0, 4).map((r, idx) => ({
    label: r.referrer === 'direct' ? 'Direct' : (r.referrer || 'Other'),
    count: r.count,
    pct: total > 0 ? Math.round((r.count / total) * 100) : 0,
    color: colors[idx % colors.length],
  }));

  const radius = 54;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = items.map((c) => {
    const arc = (c.pct / 100) * circumference;
    const offset = accumulated;
    accumulated += arc;
    return { ...c, arc, offset };
  });

  return (
    <div className="dash-card card-referring">
      <div className="card-header-clean">
        <div>
          <h3 className="card-clean-title">Top Referring Domains</h3>
          <span className="card-sub-hint">Traffic sources breakdown</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-sub-text">No referral data recorded yet.</div>
      ) : (
        <div className="referring-body">
          <div className="donut-circle-box">
            <svg viewBox="0 0 150 150" className="donut-ad-svg">
              <circle cx="75" cy="75" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
              {segments.map((seg) => (
                <circle
                  key={seg.label}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.arc} ${circumference}`}
                  strokeDashoffset={-seg.offset}
                  transform="rotate(-90 75 75)"
                />
              ))}
            </svg>
          </div>

          <div className="referring-legend-list">
            {items.map((c) => (
              <div className="ref-legend-item" key={c.label}>
                <span className="ref-dot" style={{ background: c.color }} />
                <span className="ref-label">{c.label}</span>
                <span className="ref-pct">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Geographic Distribution Card (Real Country Data) ────────────────────────
function VisitorGeographicCard({ countryBreakdown, isStandard }) {
  if (isStandard) {
    return (
      <div className="dash-card card-geo">
        <div className="card-header-clean">
          <h3 className="card-clean-title">Geographic Distribution</h3>
        </div>
        <div className="card-locked-inline">
          <Lock size={18} color="#086288" />
          <p>Location analytics is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-upgrade-link">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const countries = normalizeCountries(countryBreakdown);
  const totalCountryClicks = countries.reduce((sum, c) => sum + c.count, 0) || 1;

  return (
    <div className="dash-card card-geo">
      <div className="card-header-clean">
        <div>
          <h3 className="card-clean-title">Geographic Distribution</h3>
          <span className="card-sub-hint">Visitor traffic grouped by real country</span>
        </div>
        <span className="geo-total-pill">{countries.length} Region{countries.length === 1 ? '' : 's'}</span>
      </div>

      <div className="geo-body-clean">
        {countries.length === 0 ? (
          <div className="empty-sub-text">No location data recorded yet.</div>
        ) : (
          <div className="geo-countries-progress-list">
            {countries.map((c) => {
              const pct = Math.round((c.count / totalCountryClicks) * 100);
              return (
                <div className="geo-country-item" key={c.name}>
                  <div className="geo-country-info">
                    <span className="geo-country-name">{c.name}</span>
                    <span className="geo-country-stats">
                      <strong>{c.count.toLocaleString()}</strong> clicks{' '}
                      <span className="geo-pct">({pct}%)</span>
                    </span>
                  </div>
                  <div className="geo-progress-track">
                    <div className="geo-progress-fill" style={{ width: `${Math.max(6, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Donut Device Chart Card ──────────────────────────────────────────────────
function DeviceDonutChartCard({ breakdown, isStandard }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  if (isStandard) {
    return (
      <div className="dash-card">
        <div className="card-header-clean">
          <h3 className="card-clean-title">Session by Device</h3>
        </div>
        <div className="card-locked-inline">
          <Lock size={18} color="#086288" />
          <p>Device analytics is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-upgrade-link">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const raw = breakdown || {};
  const total = (raw.mobile || 0) + (raw.desktop || 0) + (raw.tablet || 0) + (raw.other || 0);

  const devices = [
    { key: 'mobile', label: 'Mobile', count: raw.mobile || 0, color: '#086288' },
    { key: 'desktop', label: 'Desktop', count: raw.desktop || 0, color: '#14b8a6' },
    { key: 'tablet', label: 'Tablet', count: raw.tablet || 0, color: '#f97316' },
    { key: 'other', label: 'Other', count: raw.other || 0, color: '#94a3b8' },
  ].map((d) => ({
    ...d,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));

  const radius = 54;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = devices.map((d) => {
    const arc = (d.pct / 100) * circumference;
    const offset = accumulated;
    accumulated += arc;
    return { ...d, arc, offset };
  });

  return (
    <div className="dash-card">
      <div className="card-header-clean">
        <div>
          <h3 className="card-clean-title">Session by Device</h3>
          <span className="card-sub-hint">Hardware device category</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="empty-sub-text">No device telemetry recorded yet.</div>
      ) : (
        <div className="referring-body">
          <div className="donut-circle-box">
            <svg viewBox="0 0 150 150" className="donut-ad-svg">
              <circle cx="75" cy="75" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
              {segments.map((seg) => (
                <circle
                  key={seg.key}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredKey === seg.key ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${seg.arc} ${circumference}`}
                  strokeDashoffset={-seg.offset}
                  transform="rotate(-90 75 75)"
                  onMouseEnter={() => setHoveredKey(seg.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
                />
              ))}
            </svg>
          </div>

          <div className="referring-legend-list">
            {devices.map((d) => (
              <div
                className="ref-legend-item"
                key={d.key}
                onMouseEnter={() => setHoveredKey(d.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{ cursor: 'pointer', opacity: hoveredKey && hoveredKey !== d.key ? 0.5 : 1 }}
              >
                <span className="ref-dot" style={{ background: d.color }} />
                <span className="ref-label">{d.label}</span>
                <span className="ref-pct">{d.count} ({d.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Browser Breakdown Card ───────────────────────────────────────────────────
function BrowserBreakdownCard({ breakdown, isStandard }) {
  if (isStandard) {
    return (
      <div className="dash-card">
        <div className="card-header-clean">
          <h3 className="card-clean-title">Session by Browser</h3>
        </div>
        <div className="card-locked-inline">
          <Lock size={18} color="#086288" />
          <p>Browser analytics is available on <strong>Pro</strong> and above.</p>
          <Link to="/pricing" className="pill-upgrade-link">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const items = breakdown || [];
  const total = items.reduce((sum, b) => sum + (b.count || 0), 0) || 1;

  return (
    <div className="dash-card">
      <div className="card-header-clean">
        <div>
          <h3 className="card-clean-title">Session by Browser</h3>
          <span className="card-sub-hint">Web client & browser distribution</span>
        </div>
        <span className="geo-total-pill">{items.length} Client{items.length === 1 ? '' : 's'}</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-sub-text">No browser telemetry recorded yet.</div>
      ) : (
        <div className="geo-countries-progress-list" style={{ marginTop: '8px' }}>
          {items.slice(0, 4).map((b) => {
            const pct = Math.round(((b.count || 0) / total) * 100);
            return (
              <div className="geo-country-item" key={b.browser || 'Unknown'}>
                <div className="geo-country-info">
                  <span className="geo-country-name">{b.browser || 'Unknown'}</span>
                  <span className="geo-country-stats">
                    <strong>{(b.count || 0).toLocaleString()}</strong> clicks{' '}
                    <span className="geo-pct">({pct}%)</span>
                  </span>
                </div>
                <div className="geo-progress-track">
                  <div
                    className="geo-progress-fill"
                    style={{
                      width: `${Math.max(6, pct)}%`,
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Analytics Page Component ─────────────────────────────────────────────
export default function AnalyticsPage() {
  const { shortCode } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [linksCount, setLinksCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Date Filter State
  const [selectedRange, setSelectedRange] = useState(null); // null = 7 days
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const role = user?.role || 'STANDARD';
  const isStandard = role === 'STANDARD';

  // Close date popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all user links to populate sidebar link count
  useEffect(() => {
    getMyUrls()
      .then((res) => {
        if (Array.isArray(res.data)) setLinksCount(res.data.length);
      })
      .catch(() => {});
  }, []);

  // Fetch detailed analytics for the current short code
  const fetchDetailAnalytics = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getAnalytics(shortCode, params);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailAnalytics({ days: 7 });
  }, [shortCode]);

  const handleSelectRange = (rangeId) => {
    if (rangeId === selectedRange || rangeId === '7days') {
      setSelectedRange(null);
      setShowDateDropdown(false);
      fetchDetailAnalytics({ days: 7 });
      return;
    }

    setSelectedRange(rangeId);
    setShowDateDropdown(false);

    if (rangeId === 'last_month') {
      const { startDate, endDate } = getLastMonthRange();
      fetchDetailAnalytics({ startDate, endDate });
    } else if (rangeId === 'all') {
      fetchDetailAnalytics({ days: 'all' });
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    setSelectedRange('custom');
    setShowDateDropdown(false);
    fetchDetailAnalytics({ startDate: customStart, endDate: customEnd });
  };

  let dateRangeLabel = 'Last 7 Days';
  if (selectedRange === 'last_month') {
    const r = getLastMonthRange();
    dateRangeLabel = r.monthName;
  } else if (selectedRange === 'all') {
    dateRangeLabel = 'All Time';
  } else if (selectedRange === 'custom' && customStart && customEnd) {
    dateRangeLabel = `${customStart} → ${customEnd}`;
  }

  const shortUrl = `${API_BASE_URL}/${data?.shortCode || shortCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!data) return;
    let rangeLabel = 'Last 7 Days (Default)';
    if (selectedRange === 'last_month') {
      const r = getLastMonthRange();
      rangeLabel = r.monthName;
    } else if (selectedRange === 'all') {
      rangeLabel = 'All Time';
    } else if (selectedRange === 'custom' && customStart && customEnd) {
      rangeLabel = `Custom (${customStart} to ${customEnd})`;
    }

    const csvData = generateAnalyticsCsv(data, rangeLabel);
    const filename = `analytics_${data.shortCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csvData);
    toast.success('Analytics exported to CSV!');
  };

  const todayClicks = data?.clicksByDay?.[data.clicksByDay.length - 1]?.count ?? 0;
  const isExpired = data?.expiredAt && new Date(data.expiredAt) < new Date();

  return (
    <div className="ad-dashboard-layout">
      {/* ── STANDALONE APP SIDEBAR COMPONENT ── */}
      <Sidebar
        activeNav="links"
        linksCount={linksCount}
        firstShortCode={shortCode}
      />

      {/* ── MAIN CONTENT CANVAS ── */}
      <main className="ad-main-canvas">
        {/* Top Header Bar */}
        <header className="ad-top-bar">
          <div className="search-capsule" style={{ width: 'auto', minWidth: '220px' }}>
            <ArrowLeft size={16} className="search-icon" />
            <Link
              to="/dashboard"
              style={{
                textDecoration: 'none',
                color: '#1e293b',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="top-right-actions">
            <button
              type="button"
              className="btn-new-link"
              onClick={handleCopy}
              title="Copy Short Link"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              className="icon-btn-round"
              onClick={() => setQrModalOpen(true)}
              title="View QR Code"
            >
              <QrCode size={18} />
            </button>

            <button
              type="button"
              className="icon-btn-round"
              onClick={handleExportCsv}
              title="Export CSV Report"
              disabled={!data}
            >
              <Download size={18} />
            </button>

            <div className="user-profile-circle" title={user?.email}>
              <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
          </div>
        </header>

        {error ? (
          <div className="dash-card" style={{ padding: '60px 20px', textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 16px' }}>{error}</p>
            <Link to="/dashboard" className="btn-new-link" style={{ display: 'inline-flex', margin: '0 auto' }}>
              ← Return to Dashboard
            </Link>
          </div>
        ) : loading && !data ? (
          <div className="dash-card" style={{ padding: '80px 20px', textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#086288', fontWeight: 600 }}>Loading analytics for /{shortCode}...</p>
          </div>
        ) : data && (
          <>
            {/* Subheader: Overview Title & Interactive Date Picker */}
            <div className="ad-subheader-row">
              <div className="subheader-title-group">
                <h1 className="overview-title">
                  Overview: <span className="overview-link">/{data.shortCode}</span>
                </h1>
                <a
                  href={data.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="overview-date-pill"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#64748b' }}
                  title={data.originalUrl}
                >
                  <span style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {data.originalUrl}
                  </span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Interactive Date Range Dropdown Popover */}
              <div className="date-picker-anchor" ref={dropdownRef}>
                <button
                  type="button"
                  className="date-display-badge"
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                >
                  <span>Dated: {dateRangeLabel}</span>
                  <Calendar size={15} />
                </button>

                {showDateDropdown && (
                  <div className="date-dropdown-card">
                    <div className="date-dropdown-header">Filter Range</div>
                    <div className="date-preset-buttons">
                      <button
                        type="button"
                        className={`date-chip ${!selectedRange ? 'active' : ''}`}
                        onClick={() => handleSelectRange('7days')}
                      >
                        Last 7 Days
                      </button>
                      <button
                        type="button"
                        className={`date-chip ${selectedRange === 'last_month' ? 'active' : ''}`}
                        onClick={() => handleSelectRange('last_month')}
                      >
                        Last Month
                      </button>
                      <button
                        type="button"
                        className={`date-chip ${selectedRange === 'all' ? 'active' : ''}`}
                        onClick={() => handleSelectRange('all')}
                      >
                        All Time
                      </button>
                    </div>

                    <div className="date-custom-divider">Custom Range</div>
                    <div className="date-inputs-row">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="date-native-input"
                      />
                      <span className="date-arrow">→</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="date-native-input"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-apply-custom-date"
                      onClick={handleApplyCustom}
                      disabled={!customStart || !customEnd}
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── 4 COLORFUL KPI STAT CARDS (Matching Dashboard Theme) ── */}
            <div className="ad-kpi-row">
              {/* Card 1: Total Clicks */}
              <div className="ad-kpi-card kpi-blue-dark">
                <span className="kpi-card-label">Total Clicks</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val">
                    {(data.filteredClicks ?? data.totalClicks ?? 0).toLocaleString()}
                  </span>
                  <span className="kpi-card-badge">Realtime</span>
                </div>
              </div>

              {/* Card 2: Created Date */}
              <div className="ad-kpi-card kpi-teal">
                <span className="kpi-card-label">Created Date</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val" style={{ fontSize: '1.25rem' }}>
                    {data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                  </span>
                  <span className="kpi-card-badge">Active</span>
                </div>
              </div>

              {/* Card 3: Link Expiration */}
              <div className="ad-kpi-card kpi-orange">
                <span className="kpi-card-label">Link Expiration</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val" style={{ fontSize: '1.25rem' }}>
                    {data.expiredAt ? new Date(data.expiredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                  </span>
                  <span className="kpi-card-badge">
                    {data.expiredAt ? 'Has Expiry' : 'Permanent'}
                  </span>
                </div>
              </div>

              {/* Card 4: Link Status */}
              <div className="ad-kpi-card kpi-sky">
                <span className="kpi-card-label">Link Status</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val">
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                  <span className="kpi-card-badge">
                    {data.fallbackUrl ? 'Fallback Set' : 'Normal'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── BALANCED 2-COLUMN MIDDLE GRID (Chart + Referrers) ── */}
            <div className="ad-middle-grid">
              {/* Left Block: Click Analytics Spline Chart */}
              <div className="dash-card card-analytics">
                <div className="card-header-clean">
                  <div>
                    <h3 className="card-clean-title">Click Analytics</h3>
                    <span className="card-sub-hint">Daily traffic trend for /{data.shortCode}</span>
                  </div>
                  <div className="chart-today-pill">
                    <span className="today-pill-dot" />
                    <span>Today: <strong>{todayClicks.toLocaleString()}</strong> clicks</span>
                  </div>
                </div>
                <SplineClickAnalyticsChart trendData={data.clicksByDay} />
              </div>

              {/* Right Block: Top Referring Domains Donut */}
              <TopReferringDomainsCard referrers={data.topReferrers} isStandard={isStandard} />
            </div>

            {/* ── GEOGRAPHIC DISTRIBUTION CARD ── */}
            <div className="ad-geo-section">
              <VisitorGeographicCard countryBreakdown={data.countryBreakdown} isStandard={isStandard} />
            </div>

            {/* ── BOTTOM 2-COLUMN GRID (Device & Browser Breakdown) ── */}
            <div className="ad-bottom-grid">
              <DeviceDonutChartCard breakdown={data.deviceBreakdown} isStandard={isStandard} />
              <BrowserBreakdownCard breakdown={data.browserBreakdown} isStandard={isStandard} />
            </div>
          </>
        )}
      </main>

      {/* QR Code Modal */}
      {data && (
        <QrCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          url={shortUrl}
          shortCode={data.shortCode}
        />
      )}
    </div>
  );
}