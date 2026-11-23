import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Copy, Check, QrCode, Trash2, ArrowUpRight,
  Pencil, ExternalLink, Calendar, Bell, Mail, ChevronDown, ChevronUp,
  Sliders, X, Lock, Info, RefreshCw
} from 'lucide-react';
import {
  getMyUrls, getAccountMe, getAccountAnalyticsOverview,
  createShortUrl, deleteShortUrl, updateShortUrl
} from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import QrCodeModal from '../components/QrCodeModal';
import './DashboardPage.css';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function normalizeCountries(countryBreakdown) {
  if (!countryBreakdown || countryBreakdown.length === 0) return [];
  const map = {};
  for (const item of countryBreakdown) {
    const raw = item.country?.trim()?.toUpperCase() || 'UNKNOWN';
    let label = 'Unknown';
    if (raw === 'ID' || raw === 'INDONESIA') label = 'Indonesia';
    else if (raw === 'US' || raw === 'USA') label = 'USA';
    else if (raw === 'GB' || raw === 'UK') label = 'UK';
    else if (raw === 'CA') label = 'Canada';
    else if (raw === 'SG') label = 'Singapore';
    else if (raw === 'DE') label = 'Germany';
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

// ── Multi-Wave Spline Area Chart Driven by Real Data ─────────────────────────
function LinklyticsSplineChart({ trendData, daysRange, onRangeChange }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const containerRef = useRef(null);

  // Generate real fallback dates if no data recorded
  const points = (trendData && trendData.length > 0)
    ? trendData
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: 0
        };
      });

  const maxVal = Math.max(...points.map((p) => p.count || 0), 10);
  const maxY = Math.ceil(maxVal * 1.25);

  const W = 680, H = 210;
  const pad = { top: 32, right: 25, bottom: 25, left: 38 };

  const getX = (i) => pad.left + (i / Math.max(points.length - 1, 1)) * (W - pad.left - pad.right);
  const getY = (val) => pad.top + (1 - Math.min(val, maxY) / maxY) * (H - pad.top - pad.bottom);

  // Primary real curve (Cyan/Teal)
  const primaryPath = points.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.count || 0);
    if (i === 0) return `M ${x},${y}`;
    const prevX = getX(i - 1);
    const prevY = getY(points[i - 1].count || 0);
    const cp1x = prevX + (x - prevX) / 2;
    const cp2x = prevX + (x - prevX) / 2;
    return `${acc} C ${cp1x},${prevY} ${cp2x},${y} ${x},${y}`;
  }, '');

  // Dynamic Y axis ticks
  const yTicks = [
    0,
    Math.round(maxY * 0.25),
    Math.round(maxY * 0.5),
    Math.round(maxY * 0.75),
    maxY
  ];

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = W / rect.width;
    const svgX = clientX * scaleX;

    let closest = null, minDist = Infinity;
    points.forEach((_, i) => {
      const dist = Math.abs(getX(i) - svgX);
      if (dist < minDist && dist < 45 * scaleX) {
        minDist = dist;
        closest = i;
      }
    });
    setHoveredIdx(closest);
  };

  // Find real peak point
  const peakIdx = points.reduce((bestIdx, p, idx) => (p.count > (points[bestIdx]?.count || 0) ? idx : bestIdx), 0);
  const hasClicks = points.some((p) => p.count > 0);

  return (
    <div
      className="chart-canvas-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <div className="chart-card-header">
        <h2 className="card-heading">Click Analytics</h2>
        <div className="chart-dropdown-wrap">
          <select
            value={daysRange}
            onChange={(e) => onRangeChange(e.target.value)}
            className="chart-select-pill"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
        {/* Horizontal gridlines */}
        {yTicks.map((val, idx) => (
          <g key={idx}>
            <line
              x1={pad.left} y1={getY(val)}
              x2={W - pad.right} y2={getY(val)}
              stroke="#e2ecf2" strokeWidth="1"
            />
            <text x={pad.left - 8} y={getY(val) + 3} fill="#94a3b8" fontSize="10" textAnchor="end" fontWeight="500">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            </text>
          </g>
        ))}

        {/* X labels */}
        {points.map((pt, i) => {
          // Show fewer labels on longer ranges to avoid clutter
          const step = Math.max(1, Math.floor(points.length / 8));
          if (i % step !== 0 && i !== points.length - 1) return null;
          return (
            <text key={pt.date + i} x={getX(i)} y={H - 6} fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="500">
              {pt.date}
            </text>
          );
        })}

        {/* Real clicks wave curve */}
        <path d={primaryPath} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />

        {/* Real Peak Marker */}
        {hasClicks && points[peakIdx] && points[peakIdx].count > 0 && (
          <g transform={`translate(${getX(peakIdx)}, ${getY(points[peakIdx].count)})`}>
            <circle r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <rect x="-36" y="-30" width="72" height="22" rx="4" fill="#182a3a" />
            <text x="0" y="-15" fill="#ffffff" fontSize="9.5" textAnchor="middle" fontWeight="600">
              {points[peakIdx].count.toLocaleString()} clicks
            </text>
          </g>
        )}

        {/* Hover inspection dot */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <circle
            cx={getX(hoveredIdx)}
            cy={getY(points[hoveredIdx].count || 0)}
            r="5"
            fill="#0284c7"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="dash-chart-tooltip"
          style={{
            left: `${(getX(hoveredIdx) / W) * 100}%`,
            top: `${Math.max(getY(points[hoveredIdx].count || 0) - 38, 6)}px`,
          }}
        >
          <span className="tooltip-date">{points[hoveredIdx].date}</span>
          <span className="tooltip-clicks">{points[hoveredIdx].count.toLocaleString()} clicks</span>
        </div>
      )}

      {!hasClicks && (
        <div className="chart-empty-state">
          <Info size={13} />
          <span>No click sessions recorded in this timeframe yet</span>
        </div>
      )}
    </div>
  );
}

// ── Top Referring Domains Donut Chart Driven by Real Data ───────────────────
function TopReferringDonutChart({ referrers, isStandard }) {
  if (isStandard) {
    return (
      <div className="donut-card">
        <h3 className="card-title">Top Referring Domains</h3>
        <div className="card-locked-box">
          <Lock size={16} />
          <span>Referrer breakdown is a Pro feature.</span>
          <Link to="/pricing" className="upgrade-link">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const rawList = referrers || [];
  const totalRef = rawList.reduce((sum, r) => sum + (r.count || 0), 0);

  const colors = ['#ea580c', '#0d9488', '#0284c7', '#eab308', '#334155'];

  const data = rawList.slice(0, 4).map((r, idx) => ({
    label: r.referrer === 'direct' ? 'Direct' : r.referrer,
    count: r.count,
    pct: totalRef > 0 ? Math.round(((r.count || 0) / totalRef) * 100) : 0,
    color: colors[idx % colors.length],
  }));

  const R = 42;
  const C = 2 * Math.PI * R; // ~263.89
  let currentOffset = 0;

  return (
    <div className="donut-card">
      <h3 className="card-title">Top Referring Domains</h3>
      {data.length === 0 || totalRef === 0 ? (
        <div className="donut-empty-notice">
          <Info size={15} />
          <span>No traffic referral sources recorded yet.</span>
        </div>
      ) : (
        <div className="donut-body">
          <div className="donut-graphic-wrap">
            <svg width="124" height="124" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {data.map((item, idx) => {
                const dashLength = (item.pct / 100) * C;
                const dashSpace = C - dashLength;
                const strokeOffset = -currentOffset;
                currentOffset += dashLength;

                return (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="16"
                    strokeDasharray={`${dashLength} ${dashSpace}`}
                    strokeDashoffset={strokeOffset}
                  />
                );
              })}
            </svg>
          </div>

          <div className="donut-legend-wrap">
            {data.map((item, idx) => (
              <div key={idx} className="donut-legend-row">
                <span className="donut-dot" style={{ backgroundColor: item.color }} />
                <span className="donut-label">{item.label}</span>
                <span className="donut-pct">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Geographic Distribution World Map & Top Countries Driven by Real Data ──
function GeographicDistributionCard({ countries, isStandard }) {
  if (isStandard) {
    return (
      <div className="map-card">
        <h3 className="card-title">Visitor Geographic Distribution</h3>
        <div className="card-locked-box">
          <Lock size={16} />
          <span>Geographic telemetry requires Pro or Premium plan.</span>
          <Link to="/pricing" className="upgrade-link">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const list = normalizeCountries(countries);
  const topList = list.slice(0, 3);

  // Check if specific regions exist in real country logs
  const rawCodes = (countries || []).map((c) => c.country?.toUpperCase());
  const hasUS = rawCodes.some((c) => c === 'US' || c === 'USA');
  const hasEurope = rawCodes.some((c) => c === 'GB' || c === 'UK' || c === 'DE' || c === 'FR');
  const hasIndonesia = rawCodes.some((c) => c === 'ID' || c === 'INDONESIA');
  const hasAnyData = list.length > 0;

  return (
    <div className="map-card">
      <h3 className="card-title">Visitor Geographic Distribution</h3>
      <div className="map-body">
        <div className="map-graphic-area">
          {/* Stylized Vector World Map */}
          <svg viewBox="0 0 450 200" className="world-vector-map">
            {/* North America */}
            <path
              d="M 40 45 Q 60 30 110 35 Q 125 55 105 85 Q 75 90 60 70 Z M 70 88 Q 85 95 90 120 Q 80 135 70 115 Z"
              fill="#e7dfd1"
            />
            {/* South America */}
            <path
              d="M 105 110 Q 130 115 125 150 Q 110 185 100 170 Q 95 135 105 110 Z"
              fill="#e7dfd1"
            />
            {/* Europe */}
            <path
              d="M 195 35 Q 235 30 240 55 Q 215 70 195 60 Z M 180 40 Q 190 35 185 50 Z"
              fill="#e7dfd1"
            />
            {/* Africa */}
            <path
              d="M 190 70 Q 235 65 245 100 Q 230 145 205 140 Q 185 105 190 70 Z"
              fill="#e7dfd1"
            />
            {/* Asia */}
            <path
              d="M 245 35 Q 320 25 365 60 Q 345 105 295 95 Q 255 80 245 35 Z M 285 95 Q 310 95 305 115 Z"
              fill="#e7dfd1"
            />
            {/* Australia */}
            <path
              d="M 330 130 Q 375 130 370 160 Q 340 165 330 145 Z"
              fill="#e7dfd1"
            />
            {/* Indonesia Islands */}
            <path
              d="M 295 120 Q 315 120 320 128 Q 300 130 295 120 Z"
              fill="#e7dfd1"
            />

            {/* Dynamic Bubble markers only for real visitor regions */}
            {hasUS && (
              <g>
                <circle cx="85" cy="65" r="14" fill="#06b6d4" fillOpacity="0.45" />
                <circle cx="85" cy="65" r="4" fill="#0284c7" />
              </g>
            )}

            {hasEurope && (
              <g>
                <circle cx="215" cy="50" r="10" fill="#06b6d4" fillOpacity="0.45" />
                <circle cx="215" cy="50" r="3" fill="#0284c7" />
              </g>
            )}

            {hasIndonesia && (
              <g>
                <circle cx="310" cy="115" r="12" fill="#06b6d4" fillOpacity="0.45" />
                <circle cx="310" cy="115" r="3.5" fill="#0284c7" />
              </g>
            )}
          </svg>

          {/* Color Scale Legend */}
          <div className="map-scale-legend">
            <span className="scale-label">Visitor Density</span>
            <div className="scale-bar" />
            <div className="scale-range">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Top Countries List */}
        <div className="top-countries-box">
          <span className="top-countries-header">Top Countries</span>
          <div className="top-countries-list">
            {!hasAnyData ? (
              <span className="no-telemetry-text">No country logs recorded yet</span>
            ) : (
              topList.map((c, i) => (
                <div key={i} className="top-country-item">
                  <span className="country-name">{c.name}</span>
                  <span className="country-count">{c.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState(null);
  const [overview, setOverview] = useState(null);
  const [daysRange, setDaysRange] = useState('7'); // '7' | '30' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [showManageTable, setShowManageTable] = useState(false);

  // Creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [showUtm, setShowUtm] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [editingUrl, setEditingUrl] = useState(null);
  const [editAlias, setEditAlias] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // QR Modal
  const [qrModal, setQrModal] = useState({ isOpen: false, url: '', code: '' });
  const [copiedId, setCopiedId] = useState(null);

  const isStandard = (user?.role || 'STANDARD') === 'STANDARD';
  const features = accountInfo?.features || {};

  const fetchData = async (range = daysRange) => {
    try {
      setLoading(true);
      const [urlsRes, meRes, overviewRes] = await Promise.all([
        getMyUrls(),
        getAccountMe(),
        getAccountAnalyticsOverview({ days: range })
      ]);
      setUrls(urlsRes.data || []);
      setAccountInfo(meRes.data || null);
      setOverview(overviewRes.data || null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to sync telemetry metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(daysRange);
  }, [daysRange]);

  const handleRangeChange = (newRange) => {
    setDaysRange(newRange);
  };

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setSubmitting(true);
    const finalUrl = showUtm ? buildFinalUrl(newUrl.trim()) : newUrl.trim();

    try {
      await createShortUrl(
        finalUrl,
        newAlias.trim() || undefined,
        newExpiresAt || undefined
      );
      showToast('Short link created successfully', 'success');
      setNewUrl('');
      setNewAlias('');
      setNewExpiresAt('');
      setShowUtm(false);
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
      setCreateModalOpen(false);
      fetchData(daysRange);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create link', 'error');
    } finally {
      setSubmitting(false);
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
      showToast('Short link updated', 'success');
      setEditingUrl(null);
      fetchData(daysRange);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update short link', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (shortCode) => {
    if (!window.confirm('Delete this short link permanently?')) return;
    try {
      await deleteShortUrl(shortCode);
      showToast('Link removed', 'info');
      setUrls((prev) => prev.filter((u) => u.shortCode !== shortCode));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete link', 'error');
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Real calculations
  const totalClicksCount = overview?.totalClicks ?? urls.reduce((sum, u) => sum + (u.clickCount ?? u.clicks ?? 0), 0);
  const uniqueVisitorsCount = overview?.uniqueVisitors ?? 0;
  const filteredClicksCount = overview?.filteredClicks ?? totalClicksCount;

  // Active links
  const activeLinksCount = urls.filter((u) => !u.expiredAt || new Date(u.expiredAt) > new Date()).length;

  // Daily clicks for latest day in trendData
  const trendPoints = overview?.clicksTrend || [];
  const todayClickCount = trendPoints.length > 0 ? (trendPoints[trendPoints.length - 1]?.count || 0) : 0;

  // Real Top Performance Links (Sorted by real clickCount)
  const topPerformanceUrls = [...urls]
    .sort((a, b) => (b.clickCount ?? b.clicks ?? 0) - (a.clickCount ?? a.clicks ?? 0))
    .slice(0, 3);

  // Real Recent Telemetry Logs
  const recentTelemetryLogs = overview?.recentClicks || [];

  // Display URL for Overview Header
  const activeLink = urls[0];
  const primaryDisplayUrl = activeLink ? `${API_BASE_URL}/${activeLink.shortCode}` : 'No links created yet';

  // Date formatted stamp
  const todayDateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Filtered URLs for search
  const filteredUrls = urls.filter((u) =>
    u.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.originalUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="linklytics-shell">
      <Sidebar />

      <main className="linklytics-canvas">
        {/* ── Top Bar: Search & Profile Row ── */}
        <div className="top-control-bar">
          <div className="top-search-pill">
            <Search size={15} className="search-icon-grey" />
            <input
              type="text"
              placeholder="Search Links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="top-search-input"
            />
          </div>

          <div className="top-actions-cluster">
            <button
              type="button"
              className="top-create-btn"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={15} />
              <span>New Link</span>
            </button>

            <button
              type="button"
              className="top-icon-pill"
              title="Refresh Telemetry"
              onClick={() => fetchData(daysRange)}
            >
              <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            </button>

            <div className="top-user-avatar">
              <span className="avatar-letter">
                {(user?.email?.[0] || 'K').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Title & Date Range Stamp Row ── */}
        <div className="overview-header-row">
          <div className="overview-title-group">
            <h1 className="overview-h1">
              Overview: <span className="overview-slug">{primaryDisplayUrl.replace('http://', '').replace('https://', '')}</span>
            </h1>
            <span className="overview-date-pill">
              {daysRange === 'all' ? 'All Time' : `Last ${daysRange} Days`}
            </span>
          </div>

          <div className="dated-indicator">
            <Calendar size={14} className="dated-calendar-icon" />
            <span>Updated: {todayDateStr}</span>
          </div>
        </div>

        {/* ── 4 Vibrant KPI Cards (Row 1) ── */}
        <div className="kpi-quad-grid">
          {/* Card 1: Navy (Total Clicks) */}
          <div className="kpi-card kpi-navy">
            <span className="kpi-label">Total Clicks Recorded</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{totalClicksCount.toLocaleString()}</span>
              <span className="kpi-badge badge-green">
                {filteredClicksCount.toLocaleString()} in range
              </span>
            </div>
          </div>

          {/* Card 2: Teal (Unique Visitors) */}
          <div className="kpi-card kpi-teal">
            <span className="kpi-label">Unique Visitors</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{uniqueVisitorsCount.toLocaleString()}</span>
              <span className="kpi-badge badge-mint">
                {totalClicksCount > 0 ? `${Math.round((uniqueVisitorsCount / totalClicksCount) * 100)}% unique` : '100%'}
              </span>
            </div>
          </div>

          {/* Card 3: Orange (Active Short Links) */}
          <div className="kpi-card kpi-orange">
            <span className="kpi-label">Active Links / Quota</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{activeLinksCount}</span>
              <span className="kpi-badge badge-warm">
                {accountInfo?.usage?.urlsThisMonth || urls.length} / {accountInfo?.usage?.urlsLimit || 25} cap
              </span>
            </div>
          </div>

          {/* Card 4: Blue (Today's Clicks) */}
          <div className="kpi-card kpi-blue">
            <span className="kpi-label">Today's Clicks</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{todayClickCount.toLocaleString()}</span>
              <span className="kpi-badge badge-mint">
                {trendPoints.length > 0 ? 'Live telemetry' : 'Real-time'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Middle Row: Spline Wave Chart + Daily Clicks + Donut Chart ── */}
        <div className="middle-analytics-grid">
          {/* Spline Chart Card */}
          <div className="spline-chart-card">
            <LinklyticsSplineChart
              trendData={overview?.clicksTrend}
              daysRange={daysRange}
              onRangeChange={handleRangeChange}
            />
          </div>

          {/* Daily Clicks Card */}
          <div className="daily-clicks-card">
            <span className="daily-clicks-label">Today's Traffic</span>
            <span className="daily-clicks-num">{todayClickCount.toLocaleString()}</span>
            <span className="daily-subtext">Click events logged today</span>
          </div>

          {/* Donut Chart Card */}
          <TopReferringDonutChart
            referrers={overview?.topReferrers}
            isStandard={isStandard}
          />
        </div>

        {/* ── Bottom Row: Link Summary Table + Recent Telemetry + Geographic Map ── */}
        <div className="bottom-telemetry-grid">
          {/* Table 1: Link Performance Summary */}
          <div className="summary-table-card">
            <h3 className="card-title">Link Performance Summary</h3>
            <div className="table-responsive-clean">
              {topPerformanceUrls.length === 0 ? (
                <div className="table-empty-notice">
                  <span>No short links created yet.</span>
                </div>
              ) : (
                <table className="mini-dash-table">
                  <thead>
                    <tr>
                      <th>Top Link</th>
                      <th style={{ textAlign: 'right' }}>Clicks</th>
                      <th style={{ textAlign: 'right' }}>Share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformanceUrls.map((item, idx) => {
                      const count = item.clickCount ?? item.clicks ?? 0;
                      const sharePct = totalClicksCount > 0 ? ((count / totalClicksCount) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx}>
                          <td className="link-slug-cell">
                            <Link to={`/analytics/${item.shortCode}`} className="slug-link">
                              /{item.shortCode}
                            </Link>
                          </td>
                          <td style={{ textAlign: 'right' }}>{count.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>{sharePct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Table 2: Latest Click Telemetry */}
          <div className="telemetry-table-card">
            <h3 className="card-title">Latest Click Telemetry</h3>
            <div className="table-responsive-clean">
              {recentTelemetryLogs.length === 0 ? (
                <div className="table-empty-notice">
                  <span>No click events recorded yet. Share your links to capture visits.</span>
                </div>
              ) : (
                <table className="mini-dash-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Location</th>
                      <th>Device</th>
                      <th>Referral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTelemetryLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td className="time-subtle">
                          {log.time ? new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td>{log.location || 'Local / Unknown'}</td>
                        <td>{log.device || 'Desktop'}</td>
                        <td>{log.referral || 'Direct'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Geographic Distribution World Map */}
          <GeographicDistributionCard
            countries={overview?.countryBreakdown}
            isStandard={isStandard}
          />
        </div>

        {/* ── Collapsible Full Link Library & Management ── */}
        <div className="full-library-section">
          <button
            type="button"
            className="toggle-library-btn"
            onClick={() => setShowManageTable(!showManageTable)}
          >
            <span>Workspace Link Inventory ({urls.length} links recorded)</span>
            {showManageTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showManageTable && (
            <div className="library-expanded-panel">
              <table className="mini-dash-table full-table">
                <thead>
                  <tr>
                    <th>Short Code</th>
                    <th>Destination URL</th>
                    <th style={{ textAlign: 'right' }}>Clicks</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUrls.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>
                        No short links created yet. Click "+ New Link" above to start.
                      </td>
                    </tr>
                  ) : (
                    filteredUrls.map((item) => {
                      const fullUrl = `${API_BASE_URL}/${item.shortCode}`;
                      const count = item.clickCount ?? item.clicks ?? 0;
                      return (
                        <tr key={item.id || item.shortCode}>
                          <td>
                            <strong>/{item.shortCode}</strong>
                          </td>
                          <td>
                            <a href={item.originalUrl} target="_blank" rel="noreferrer" className="table-ext-link">
                              {item.originalUrl}
                            </a>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {count.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="row-actions-cluster">
                              <Link
                                to={`/analytics/${item.shortCode}`}
                                className="action-pill-btn"
                                title="Inspect Analytics"
                              >
                                <ArrowUpRight size={13} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(fullUrl, item.id || item.shortCode)}
                                className="action-pill-btn"
                                title="Copy link"
                              >
                                {copiedId === (item.id || item.shortCode) ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setQrModal({ isOpen: true, url: fullUrl, code: item.shortCode })}
                                className="action-pill-btn"
                                title="QR Code"
                              >
                                <QrCode size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="action-pill-btn"
                                title="Edit"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.shortCode)}
                                className="action-pill-btn btn-danger"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Modal Create Link ── */}
        {createModalOpen && (
          <div className="modal-overlay-backdrop" onClick={() => setCreateModalOpen(false)}>
            <div className="modal-dialog-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-dialog-top">
                <h2 className="modal-dialog-h2">Create Short Link</h2>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="modal-close-icon"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="form-group-item">
                  <label className="form-item-label">Destination URL *</label>
                  <input
                    type="url"
                    placeholder="https://example.com/very-long-url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                    className="form-item-input"
                  />
                </div>

                <div className="form-row-duo">
                  <div className="form-group-item">
                    <label className="form-item-label">Custom Slug (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. launch-2026"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      className="form-item-input"
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-item-label">Expiration Date (Optional)</label>
                    {isStandard ? (
                      <div className="form-locked-chip">
                        <span>Pro Feature</span>
                        <Link to="/pricing">Upgrade</Link>
                      </div>
                    ) : (
                      <input
                        type="datetime-local"
                        value={newExpiresAt}
                        onChange={(e) => setNewExpiresAt(e.target.value)}
                        className="form-item-input"
                      />
                    )}
                  </div>
                </div>

                {/* UTM Tracking Accordion */}
                <div className="utm-drawer-container">
                  <button
                    type="button"
                    className="utm-drawer-trigger"
                    onClick={() => setShowUtm(!showUtm)}
                  >
                    <Sliders size={13} />
                    <span>{showUtm ? 'Hide UTM Tracking' : 'Add Campaign UTM Tracking'}</span>
                    {showUtm ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {showUtm && (
                    <div className="utm-inputs-stack">
                      <input
                        type="text"
                        placeholder="utm_source (e.g. twitter, google)"
                        value={utmSource}
                        onChange={(e) => setUtmSource(e.target.value)}
                        className="form-item-input"
                      />
                      <input
                        type="text"
                        placeholder="utm_medium (e.g. cpc, email)"
                        value={utmMedium}
                        onChange={(e) => setUtmMedium(e.target.value)}
                        className="form-item-input"
                      />
                      <input
                        type="text"
                        placeholder="utm_campaign (e.g. summer_sale)"
                        value={utmCampaign}
                        onChange={(e) => setUtmCampaign(e.target.value)}
                        className="form-item-input"
                      />
                    </div>
                  )}
                </div>

                <div className="modal-dialog-buttons">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn-save"
                    disabled={submitting}
                  >
                    {submitting ? 'Generating...' : 'Save Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Edit Link ── */}
        {editingUrl && (
          <div className="modal-overlay-backdrop" onClick={() => setEditingUrl(null)}>
            <div className="modal-dialog-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-dialog-top">
                <h2 className="modal-dialog-h2">Edit Short Link</h2>
                <button
                  type="button"
                  onClick={() => setEditingUrl(null)}
                  className="modal-close-icon"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="form-group-item">
                  <label className="form-item-label">Custom Slug</label>
                  <input
                    type="text"
                    value={editAlias}
                    onChange={(e) => setEditAlias(e.target.value)}
                    required
                    className="form-item-input"
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-item-label">Destination URL</label>
                  <input
                    type="url"
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    disabled={!features.editDestination}
                    required
                    className="form-item-input"
                  />
                  {!features.editDestination && (
                    <span className="locked-inline-hint">
                      Editing destination requires Pro or Premium plan.
                    </span>
                  )}
                </div>

                <div className="modal-dialog-buttons">
                  <button
                    type="button"
                    onClick={() => setEditingUrl(null)}
                    className="modal-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-btn-save"
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Modal Component */}
        {qrModal.isOpen && (
          <QrCodeModal
            isOpen={qrModal.isOpen}
            onClose={() => setQrModal({ isOpen: false, url: '', code: '' })}
            shortUrl={qrModal.url}
            shortCode={qrModal.code}
          />
        )}
      </main>
    </div>
  );
}
