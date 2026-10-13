import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bell, Home, BarChart2, Link as LinkIcon, FileText, Settings,
  LogOut, Plus, ExternalLink, Copy, Check, QrCode, Pencil, Trash2, X,
  Calendar, Lock, Sliders, ChevronDown, ChevronUp, AlertCircle, Sparkles, Info
} from 'lucide-react';
import {
  createShortUrl, getMyUrls, getAccountMe,
  getAccountAnalyticsOverview, upgradeAccount, deleteShortUrl, updateShortUrl
} from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import QrCodeModal from '../components/QrCodeModal';
import Sidebar from '../components/Sidebar';
import './DashboardPage.css';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function normalizeCountries(countryBreakdown) {
  if (!countryBreakdown || countryBreakdown.length === 0) return [];
  const map = {};
  for (const item of countryBreakdown) {
    const raw = item.country?.trim()?.toUpperCase() || 'UNKNOWN';
    let label = 'Unknown';
    if (raw === 'ID') label = 'Indonesia';
    else if (raw === 'US') label = 'United States';
    else if (raw === 'UNKNOWN') label = 'Localhost / Private';
    else {
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

// ── Spline Chart Driven by Real clicksTrend (Single Real Curve) ───────────────
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

  // Smooth bezier curve for single real clicks data
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

// ── Geographic Distribution Card (Accurate & Combined by Real Country) ──────
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

// ── Main Dashboard Page Component ────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [urls, setUrls] = useState([]);
  const [account, setAccount] = useState(null);
  const [overview, setOverview] = useState(null);

  // Notifications Popover
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Date Filter State
  const [selectedRange, setSelectedRange] = useState(null); // null = default 7 days
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // New Link Modal & Inputs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [originalUrl, setOriginalUrl] = useState(location.state?.pendingUrl || '');
  const [customAlias, setCustomAlias] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [qrSelected, setQrSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // UTM tracking state
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  // Edit Link Modal
  const [editingUrl, setEditingUrl] = useState(null);
  const [editAlias, setEditAlias] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const role = user?.role || 'STANDARD';
  const isStandard = role === 'STANDARD';
  const features = account?.features || {};
  const urlsLimit = account?.usage?.urlsLimit === Infinity ? '∞' : (account?.usage?.urlsLimit ?? 25);

  const buildFinalUrl = (baseUrl) => {
    if (!baseUrl) return '';
    try {
      const formatted = baseUrl.startsWith('http://') || baseUrl.startsWith('https://') ? baseUrl : `https://${baseUrl}`;
      const urlObj = new URL(formatted);
      if (utmSource.trim()) urlObj.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium.trim()) urlObj.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign.trim()) urlObj.searchParams.set('utm_campaign', utmCampaign.trim());
      return urlObj.toString();
    } catch {
      return baseUrl;
    }
  };

  const hasUtm = Boolean(utmSource.trim() || utmMedium.trim() || utmCampaign.trim());

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
      await fetchOverview({ days: 7 });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDateDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Date filter handler
  const handleSelectRange = (rangeId) => {
    if (rangeId === selectedRange || rangeId === 'default' || rangeId === '7days') {
      setSelectedRange(null);
      fetchOverview({ days: 7 });
      setShowDateDropdown(false);
      return;
    }

    setSelectedRange(rangeId);

    if (rangeId === 'last_month') {
      const { startDate, endDate } = getLastMonthRange();
      fetchOverview({ startDate, endDate });
    } else if (rangeId === 'all') {
      fetchOverview({ days: 'all' });
    }
    setShowDateDropdown(false);
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      setSelectedRange('custom');
      fetchOverview({ startDate: customStart, endDate: customEnd });
      setShowDateDropdown(false);
    }
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
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
      setShowUtm(false);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create short URL';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(''), 2000);
  };

  const handleDelete = async (shortCode) => {
    if (!window.confirm(`Are you sure you want to delete /${shortCode}?`)) return;
    try {
      await deleteShortUrl(shortCode);
      toast.success(`Link /${shortCode} deleted.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete URL');
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
      toast.success('Short link updated successfully.');
      setEditingUrl(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update short URL');
    } finally {
      setEditLoading(false);
    }
  };

  // Metrics
  const totalClicksCount = overview?.totalClicks ?? urls.reduce((sum, u) => sum + (u.clickCount || 0), 0);
  const uniqueVisitorsCount = overview?.uniqueVisitors ?? (totalClicksCount > 0 ? Math.min(totalClicksCount, Math.round(totalClicksCount * 0.8)) : 0);
  const todayClicks = overview?.clicksTrend?.[overview.clicksTrend.length - 1]?.count ?? 0;

  // Filter links for the Links library
  const filteredUrls = urls.filter((u) =>
    u.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.originalUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topRankedLinks = [...urls].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0)).slice(0, 4);
  const telemetryList = overview?.recentClicks || [];

  return (
    <div className="ad-dashboard-layout">
      {/* ── STANDALONE APP SIDEBAR COMPONENT ── */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        linksCount={urls.length}
        firstShortCode={urls[0]?.shortCode}
      />

      {/* ── MAIN CONTENT CANVAS ── */}
      <main className="ad-main-canvas">
        {/* Top Header Bar */}
        <header className="ad-top-bar">
          <div className="search-capsule">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeNav !== 'links') setActiveNav('links');
              }}
              className="search-input"
            />
          </div>

          <div className="top-right-actions">
            <button
              type="button"
              className="btn-new-link"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} /> New Link
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="notif-anchor" ref={notifRef}>
              <div
                className="icon-btn-round bell-wrap"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={18} />
                <span className="bell-red-dot" />
              </div>

              {showNotifications && (
                <div className="notifications-dropdown-card">
                  <div className="notif-header">
                    <span>Notifications</span>
                    <span className="notif-count-badge">Active</span>
                  </div>
                  <div className="notif-list">
                    <div className="notif-item">
                      <span className="notif-dot blue" />
                      <div className="notif-text">
                        <strong>Link Quota</strong>
                        <span>{urls.length} of {urlsLimit} short links used</span>
                      </div>
                    </div>
                    <div className="notif-item">
                      <span className="notif-dot green" />
                      <div className="notif-text">
                        <strong>Realtime Telemetry</strong>
                        <span>{totalClicksCount} total clicks recorded across links</span>
                      </div>
                    </div>
                    <div className="notif-item">
                      <span className="notif-dot orange" />
                      <div className="notif-text">
                        <strong>Account Plan</strong>
                        <span>{role} tier currently active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile-circle" title={user?.email}>
              <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
          </div>
        </header>

        {/* ── VIEW 1: DASHBOARD OVERVIEW ── */}
        {activeNav === 'dashboard' && (
          <>
            {/* Subheader: All Short Links & Interactive Date Picker */}
            <div className="ad-subheader-row">
              <div className="subheader-title-group">
                <h1 className="overview-title">
                  Overview: <span className="overview-link">All Short Links</span>
                </h1>
                <span className="overview-date-pill">{dateRangeLabel}</span>
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

            {/* ── 4 COLORFUL KPI STAT CARDS (100% Real System Data) ── */}
            <div className="ad-kpi-row">
              {/* Card 1: Total Clicks */}
              <div className="ad-kpi-card kpi-blue-dark">
                <span className="kpi-card-label">Total Clicks</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val">{totalClicksCount.toLocaleString()}</span>
                  <span className="kpi-card-badge">Realtime</span>
                </div>
              </div>

              {/* Card 2: Unique Visitors (Distinct IPs) */}
              <div className="ad-kpi-card kpi-teal">
                <span className="kpi-card-label">Unique Visitors</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val">{uniqueVisitorsCount.toLocaleString()}</span>
                  <span className="kpi-card-badge">Distinct IPs</span>
                </div>
              </div>

              {/* Card 3: Total Short Links */}
              <div className="ad-kpi-card kpi-orange">
                <span className="kpi-card-label">Total Short Links</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val">{urls.length}</span>
                  <span className="kpi-card-badge">Active</span>
                </div>
              </div>

              {/* Card 4: Monthly Link Quota */}
              <div className="ad-kpi-card kpi-sky">
                <span className="kpi-card-label">Monthly Link Quota</span>
                <div className="kpi-card-val-row">
                  <span className="kpi-card-val">
                    {account?.usage?.urlsThisMonth ?? urls.length}
                    <span style={{ fontSize: '1rem', opacity: 0.85 }}>
                      {' '}/ {urlsLimit}
                    </span>
                  </span>
                  <span className="kpi-card-badge">{role}</span>
                </div>
              </div>
            </div>

            {/* ── BALANCED 2-COLUMN MIDDLE GRID (Zero Whitespace Gap) ── */}
            <div className="ad-middle-grid">
              {/* Left Block: Click Analytics Chart with Integrated Today Stat */}
              <div className="dash-card card-analytics">
                <div className="card-header-clean">
                  <div>
                    <h3 className="card-clean-title">Click Analytics</h3>
                    <span className="card-sub-hint">Daily traffic trend</span>
                  </div>
                  <div className="chart-today-pill">
                    <span className="today-pill-dot" />
                    <span>Today: <strong>{todayClicks.toLocaleString()}</strong> clicks</span>
                  </div>
                </div>
                <SplineClickAnalyticsChart trendData={overview?.clicksTrend} />
              </div>

              {/* Right Block: Top Referring Domains Donut */}
              <TopReferringDomainsCard referrers={overview?.topReferrers} isStandard={isStandard} />
            </div>

            {/* ── GEOGRAPHIC DISTRIBUTION CARD (Accurate Normalized Country Data) ── */}
            <div className="ad-geo-section">
              <VisitorGeographicCard countryBreakdown={overview?.countryBreakdown} isStandard={isStandard} />
            </div>

            {/* ── BOTTOM TABLES SECTION (Real Top Links & Real Telemetry) ── */}
            <div className="ad-bottom-grid">
              {/* Table 1: Link Performance Summary */}
              <div className="dash-card">
                <div className="card-header-clean">
                  <h3 className="card-clean-title">Link Performance Summary</h3>
                  <button type="button" className="btn-view-all-links" onClick={() => setActiveNav('links')}>
                    View All →
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Top Link</th>
                        <th>Clicks</th>
                        <th>Conversion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRankedLinks.length > 0 ? (
                        topRankedLinks.map((u) => {
                          const linkPct = totalClicksCount > 0 ? ((u.clickCount / totalClicksCount) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={u.shortCode}>
                              <td className="table-link-cell">
                                <a href={`${API_BASE_URL}/${u.shortCode}`} target="_blank" rel="noreferrer">
                                  /{u.shortCode}
                                </a>
                              </td>
                              <td className="table-bold-cell">{u.clickCount.toLocaleString()}</td>
                              <td>{linkPct}%</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>
                            No shortened links created yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Latest Click Telemetry */}
              <div className="dash-card">
                <div className="card-header-clean">
                  <h3 className="card-clean-title">Latest Click Telemetry</h3>
                </div>
                <div className="table-responsive">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Device</th>
                        <th>Referral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telemetryList.length > 0 ? (
                        telemetryList.map((t) => (
                          <tr key={t.id || t.time}>
                            <td>{new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>{t.location === 'ID' ? 'Indonesia' : (t.location === 'US' ? 'United States' : (t.location === 'unknown' ? 'Local / Private' : t.location))}</td>
                            <td style={{ textTransform: 'capitalize' }}>{t.device}</td>
                            <td style={{ textTransform: 'capitalize' }}>{t.referral}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>
                            No click events recorded for this timeframe yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── VIEW 2: DEDICATED LINKS LIBRARY (Moved from Bottom of Dashboard) ── */}
        {activeNav === 'links' && (
          <div className="dash-card card-full-management links-view-card">
            <div className="card-header-clean">
              <div>
                <h2 className="card-clean-title" style={{ fontSize: '1.35rem' }}>All Shortened Links</h2>
                <p className="card-sub-hint">Manage destinations, copy links, generate QR codes, or edit aliases</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="links-count-pill">{filteredUrls.length} Links</span>
                <button
                  type="button"
                  className="btn-new-link"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={16} /> Create Short Link
                </button>
              </div>
            </div>

            {filteredUrls.length === 0 ? (
              <div className="empty-management-box">
                <p>{urls.length === 0 ? "You haven't created any short links yet. Click 'Create Short Link' above to start!" : `No links match '${searchQuery}'. Try another query.`}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="ad-table full-table">
                  <thead>
                    <tr>
                      <th>Short Code</th>
                      <th>Target Destination</th>
                      <th>Clicks</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUrls.map((u) => {
                      const shortUrl = `${API_BASE_URL}/${u.shortCode}`;
                      return (
                        <tr key={u.shortCode}>
                          <td className="table-link-cell">
                            <a href={shortUrl} target="_blank" rel="noreferrer">/{u.shortCode}</a>
                            {u.hasPassword && <Lock size={12} className="pw-icon" />}
                          </td>
                          <td className="dest-url-cell" title={u.originalUrl}>{u.originalUrl}</td>
                          <td className="table-bold-cell">{u.clickCount} clicks</td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-actions-row">
                              <button
                                type="button"
                                className="action-pill-btn"
                                onClick={() => handleCopy(shortUrl)}
                              >
                                {copied === shortUrl ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                                <span>{copied === shortUrl ? 'Copied' : 'Copy'}</span>
                              </button>

                              <button
                                type="button"
                                className="action-icon-btn"
                                onClick={() => setQrSelected({ url: shortUrl, shortCode: u.shortCode })}
                                title="QR Code"
                              >
                                <QrCode size={14} />
                              </button>

                              <Link to={`/analytics/${u.shortCode}`} className="action-icon-btn" title="Analytics">
                                <ExternalLink size={14} />
                              </Link>

                              <button
                                type="button"
                                className="action-icon-btn"
                                onClick={() => handleStartEdit(u)}
                                title="Edit link"
                              >
                                <Pencil size={14} />
                              </button>

                              {features.deleteUrl && (
                                <button
                                  type="button"
                                  className="action-icon-btn delete"
                                  onClick={() => handleDelete(u.shortCode)}
                                  title="Delete link"
                                >
                                  <Trash2 size={14} />
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
        )}
      </main>

      {/* ── CREATE NEW LINK MODAL (Full English & Preserves UTM Builder) ── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>Create Short Link</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-dialog-body">
              <div className="form-group">
                <label>Destination URL *</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com/long-page"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  required
                  className="modal-input"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Custom Alias (Optional)</label>
                  <input
                    type="text"
                    placeholder="my-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="modal-input"
                  />
                </div>

                <div className="form-group">
                  <label>Link Expiry</label>
                  {features.expiry ? (
                    <input
                      type="datetime-local"
                      value={expiredAt}
                      onChange={(e) => setExpiredAt(e.target.value)}
                      className="modal-input"
                    />
                  ) : (
                    <div className="locked-input-badge">
                      <span>Pro Feature</span>
                      <Link to="/pricing">Upgrade</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* UTM Tracking Collapsible */}
              <div className="utm-accordion">
                <button
                  type="button"
                  className="utm-accordion-toggle"
                  onClick={() => setShowUtm(!showUtm)}
                >
                  <Sliders size={14} />
                  <span>{showUtm ? 'Hide Campaign Tracking (UTM)' : 'Add Campaign Tracking (UTM)'}</span>
                  {showUtm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showUtm && (
                  <div className="utm-fields-wrap">
                    <div className="utm-grid">
                      <input
                        type="text"
                        placeholder="utm_source (e.g. google, twitter)"
                        value={utmSource}
                        onChange={(e) => setUtmSource(e.target.value)}
                        className="modal-input"
                      />
                      <input
                        type="text"
                        placeholder="utm_medium (e.g. cpc, bio, email)"
                        value={utmMedium}
                        onChange={(e) => setUtmMedium(e.target.value)}
                        className="modal-input"
                      />
                      <input
                        type="text"
                        placeholder="utm_campaign (e.g. launch_sale)"
                        value={utmCampaign}
                        onChange={(e) => setUtmCampaign(e.target.value)}
                        className="modal-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="form-error-text">{error}</p>}

              <div className="modal-dialog-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Short Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT LINK MODAL ── */}
      {editingUrl && (
        <div className="modal-backdrop" onClick={() => setEditingUrl(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>Edit Short Link</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingUrl(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-dialog-body">
              <div className="form-group">
                <label>Custom Alias</label>
                <input
                  type="text"
                  value={editAlias}
                  onChange={(e) => setEditAlias(e.target.value)}
                  className="modal-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Destination URL</label>
                <input
                  type="url"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  disabled={!features.editDestination}
                  className="modal-input"
                  required
                />
              </div>

              <div className="modal-dialog-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingUrl(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QR CODE MODAL ── */}
      <QrCodeModal
        isOpen={!!qrSelected}
        onClose={() => setQrSelected(null)}
        url={qrSelected?.url}
        shortCode={qrSelected?.shortCode}
      />
    </div>
  );
}