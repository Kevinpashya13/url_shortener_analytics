import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, QrCode, Download, Copy, Check } from 'lucide-react';
import { getAnalytics } from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import QrCodeModal from '../components/QrCodeModal';
import { generateAnalyticsCsv, downloadCsv } from '../utils/csvExport';
import './AnalyticsPage.css';

// ── Clean Single-Stroke Spline Chart (No gradients, no rainbow fills) ────────
function CleanClickLineChart({ trendData }) {
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
  const maxY = Math.ceil(maxVal * 1.25);

  const W = 720, H = 200;
  const pad = { top: 20, right: 20, bottom: 25, left: 35 };

  const getX = (i) => pad.left + (i / Math.max(days.length - 1, 1)) * (W - pad.left - pad.right);
  const getY = (val) => pad.top + (1 - Math.min(val, maxY) / maxY) * (H - pad.top - pad.bottom);

  const linePath = days.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.count);
    return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');

  const yTicks = [0, Math.round(maxY / 2), maxY];

  return (
    <div className="an-chart-container">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Subtle Horizontal Grid lines */}
        {yTicks.map((val) => (
          <g key={val}>
            <line
              x1={pad.left} y1={getY(val)}
              x2={W - pad.right} y2={getY(val)}
              stroke="#eeeeee" strokeWidth="1"
            />
            <text x={pad.left - 6} y={getY(val) + 3} fill="#8a8a8a" fontSize="10" textAnchor="end">
              {val}
            </text>
          </g>
        ))}

        {/* X Axis labels */}
        {days.map((pt, i) => (
          <text key={pt.date + i} x={getX(i)} y={H - 6} fill="#8a8a8a" fontSize="10" textAnchor="middle">
            {pt.date}
          </text>
        ))}

        {/* The Single Series Stroke (The one chart hue) */}
        <path d={linePath} fill="none" stroke="#0d7480" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

// ── Proportional Share Table (Replaces generic rainbow donut charts) ─────────
function ShareTable({ title, rows, total, isStandard }) {
  if (isStandard) {
    return (
      <div className="an-share-card">
        <h3 className="an-share-title">{title}</h3>
        <div className="an-locked-notice">
          <span>Available on Pro and above.</span>
          <Link to="/pricing" className="an-locked-link">Upgrade Plan →</Link>
        </div>
      </div>
    );
  }

  const items = rows || [];
  const maxCount = Math.max(...items.map((r) => r.count || 0), 1);

  return (
    <div className="an-share-card">
      <h3 className="an-share-title">{title}</h3>
      <div className="an-share-list">
        {items.length === 0 ? (
          <span className="an-empty-row">No telemetry recorded for this segment.</span>
        ) : (
          items.slice(0, 5).map((item, idx) => {
            const count = item.count || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const widthPct = Math.round((count / maxCount) * 100);

            return (
              <div key={idx} className="an-share-row">
                {/* Horizontal data bar */}
                <div className="an-share-bar" style={{ width: `${widthPct}%` }} />
                <span className="an-share-name">{item.name || item.country || item.referrer || item.device || item.browser || 'Direct / Organic'}</span>
                <div className="an-share-stats">
                  <span className="an-share-pct">{pct}%</span>
                  <span className="an-share-count">{count}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { shortCode } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const isStandard = user?.role === 'STANDARD';

  useEffect(() => {
    async function loadTelemetry() {
      try {
        setLoading(true);
        const res = await getAnalytics(shortCode);
        setData(res.data);
      } catch (err) {
        showToast(err.response?.data?.error || 'Failed to fetch telemetry details', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadTelemetry();
  }, [shortCode]);

  const shortUrl = `${API_BASE_URL}/${shortCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExportCsv = () => {
    if (!data) return;
    const csvContent = generateAnalyticsCsv(data);
    downloadCsv(csvContent, `telemetry-${shortCode}.csv`);
    showToast('Telemetry CSV exported', 'success');
  };

  return (
    <div className="dash-shell">
      <Sidebar />

      <main className="dash-canvas">
        {/* Navigation Breadcrumb */}
        <div className="an-crumb-row">
          <Link to="/dashboard" className="an-back-link">
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
          <span className="an-crumb-separator">/</span>
          <span className="an-crumb-current">{shortCode}</span>
        </div>

        {/* Object Header: Link Details and Direct Actions */}
        <header className="an-header">
          <div>
            <h1 className="an-title">{shortCode}</h1>
            <a href={data?.url?.originalUrl} target="_blank" rel="noreferrer" className="an-dest-link">
              {data?.url?.originalUrl}
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="an-header-actions">
            <button type="button" onClick={handleCopy} className="an-action-btn">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button type="button" onClick={() => setQrOpen(true)} className="an-action-btn">
              <QrCode size={14} />
              <span>QR Code</span>
            </button>
            <button type="button" onClick={handleExportCsv} className="an-action-btn">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Typographic KPIs */}
        <section className="dash-kpi-row">
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Total Clicks</span>
            <span className="dash-kpi-val">{data?.totalClicks || 0}</span>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Top Referring Source</span>
            <span className="dash-kpi-val">{data?.referrerBreakdown?.[0]?.referrer || 'Direct'}</span>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Primary Country</span>
            <span className="dash-kpi-val">{data?.countryBreakdown?.[0]?.country || 'ID'}</span>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Dominant Device</span>
            <span className="dash-kpi-val">{data?.deviceBreakdown?.[0]?.device || 'Desktop'}</span>
          </div>
        </section>

        {/* Clean Line Chart */}
        <section className="an-section">
          <div className="an-section-head">
            <h2 className="an-section-title">Clickstream Activity Over Time</h2>
          </div>
          <CleanClickLineChart trendData={data?.clicksTrend} />
        </section>

        {/* 2 x 2 Share Tables */}
        <section className="an-grid-2x2">
          <ShareTable
            title="Geographic Origin"
            rows={data?.countryBreakdown}
            total={data?.totalClicks}
            isStandard={isStandard}
          />
          <ShareTable
            title="Referring Channels"
            rows={data?.referrerBreakdown}
            total={data?.totalClicks}
            isStandard={isStandard}
          />
          <ShareTable
            title="Device Intelligence"
            rows={data?.deviceBreakdown}
            total={data?.totalClicks}
            isStandard={isStandard}
          />
          <ShareTable
            title="Client Browsers"
            rows={data?.browserBreakdown}
            total={data?.totalClicks}
            isStandard={isStandard}
          />
        </section>

        {qrOpen && (
          <QrCodeModal
            isOpen={qrOpen}
            onClose={() => setQrOpen(false)}
            shortUrl={shortUrl}
            shortCode={shortCode}
          />
        )}
      </main>
    </div>
  );
}
