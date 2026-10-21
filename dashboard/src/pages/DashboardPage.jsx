import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Copy, Check, QrCode, Trash2, ArrowUpRight
} from 'lucide-react';
import {
  getMyUrls, getAccountMe, getAccountAnalyticsOverview,
  createShortUrl, deleteShortUrl
} from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import QrCodeModal from '../components/QrCodeModal';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState(null);
  const [overview, setOverview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR Modal
  const [qrModal, setQrModal] = useState({ isOpen: false, url: '', code: '' });
  const [copiedId, setCopiedId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [urlsRes, meRes, overviewRes] = await Promise.all([
        getMyUrls(),
        getAccountMe(),
        getAccountAnalyticsOverview()
      ]);
      setUrls(urlsRes.data || []);
      setAccountInfo(meRes.data || null);
      setOverview(overviewRes.data || null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to sync dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setSubmitting(true);
    try {
      await createShortUrl(newUrl.trim(), newAlias.trim() || undefined);
      showToast('Link created successfully', 'success');
      setNewUrl('');
      setNewAlias('');
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create link', 'error');
    } finally {
      setSubmitting(false);
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

  const filteredUrls = urls.filter((u) =>
    u.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.originalUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dash-shell">
      <Sidebar />

      <main className="dash-canvas">
        {/* ── Top Bar: Workspace Context & Primary Trigger ── */}
        <header className="dash-header">
          <div>
            <h1 className="dash-scope-title">Workspace</h1>
            <p className="dash-scope-subtitle">
              Plan: <strong>{accountInfo?.role || 'STANDARD'}</strong> · Quota usage: {accountInfo?.currentUrlCount || 0} of {accountInfo?.monthlyUrlQuota || 25} links
            </p>
          </div>

          <button
            type="button"
            className="dash-btn-primary"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={15} />
            <span>Create Link</span>
          </button>
        </header>

        {/* ── KPI Ledger: Pure Typographic Scale (No circular icon boxes) ── */}
        <section className="dash-kpi-row">
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Total Links</span>
            <span className="dash-kpi-val">{urls.length}</span>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Total Clicks Recorded</span>
            <span className="dash-kpi-val">{overview?.totalClicks || 0}</span>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Monthly Link Cap</span>
            <span className="dash-kpi-val">{accountInfo?.monthlyUrlQuota || 25}</span>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">Click Quota Cap</span>
            <span className="dash-kpi-val">{accountInfo?.monthlyClickQuota?.toLocaleString() || '1,000'}</span>
          </div>
        </section>

        {/* ── Table Section: Clean Alignment & Tabular Figures ── */}
        <section className="dash-table-section">
          <div className="dash-filter-row">
            <div className="dash-search-wrap">
              <Search size={14} className="dash-search-icon" />
              <input
                type="text"
                placeholder="Filter by slug or target destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dash-search-input"
              />
            </div>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Short Code</th>
                  <th style={{ width: '42%' }}>Target Destination</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Clicks</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUrls.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="dash-empty-cell">
                      {loading ? 'Reading telemetry records...' : 'No short links recorded in this workspace.'}
                    </td>
                  </tr>
                ) : (
                  filteredUrls.map((item) => {
                    const fullShortUrl = `${API_BASE_URL}/${item.shortCode}`;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="dash-code-col">
                            <span className="dash-code-val">{item.shortCode}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(fullShortUrl, item.id)}
                              className="dash-inline-btn"
                              title="Copy URL"
                            >
                              {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <a
                            href={item.originalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="dash-dest-link"
                          >
                            {item.originalUrl}
                          </a>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          <span className="dash-cell-clicks">{item.clicks || 0}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="dash-actions-col">
                            <Link
                              to={`/analytics/${item.shortCode}`}
                              className="dash-text-btn"
                              title="Inspect Analytics"
                            >
                              Telemetry
                              <ArrowUpRight size={13} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setQrModal({ isOpen: true, url: fullShortUrl, code: item.shortCode })}
                              className="dash-icon-btn"
                              title="QR Code"
                            >
                              <QrCode size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.shortCode)}
                              className="dash-icon-btn dash-icon-delete"
                              title="Delete Link"
                            >
                              <Trash2 size={14} />
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
        </section>

        {/* ── Modal Create Link ── */}
        {createModalOpen && (
          <div className="dash-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
            <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="dash-modal-title">New Short Link</h2>
              <form onSubmit={handleCreate}>
                <div className="dash-field-group">
                  <label className="dash-label">Destination URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/very-long-url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                    className="dash-input"
                  />
                </div>
                <div className="dash-field-group">
                  <label className="dash-label">Custom Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. launch-2026"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    className="dash-input"
                  />
                </div>
                <div className="dash-modal-actions">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="dash-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="dash-btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Generating...' : 'Save Link'}
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
