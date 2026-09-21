import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createShortUrl, getMyUrls, getAccountMe, upgradeAccount } from '../api/url';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';


const ROLE_COLORS = {
  STANDARD: '#6b7280',
  PRO: '#6366f1',
  PREMIUM: '#a855f7',
  ADMIN: '#f59e0b',
};

function QuotaBar({ used, limit, label }) {
  const pct = limit === null ? 0 : Math.min((used / limit) * 100, 100);
  const isWarning = pct >= 80;
  return (
    <div className="quota-bar-wrap">
      <div className="quota-bar-label">
        <span>{label}</span>
        <span className={isWarning ? 'quota-warning' : ''}>
          {used} / {limit === null ? '∞' : limit}
        </span>
      </div>
      <div className="quota-bar-track">
        <div
          className={`quota-bar-fill ${isWarning ? 'warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [urls, setUrls] = useState([]);
  const [account, setAccount] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(location.state?.pendingUrl || '');
  const [customAlias, setCustomAlias] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState('');

  const role = user?.role || 'STANDARD';
  const features = account?.features || {};

  const fetchData = async () => {
    const [urlsRes, meRes] = await Promise.all([getMyUrls(), getAccountMe()]);
    setUrls(urlsRes.data);
    setAccount(meRes.data);
  };

  // Handle upgrade flow from PricingPage
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

  const urlsUsed = account?.usage?.urlsThisMonth ?? 0;
  const urlsLimit = account?.usage?.urlsLimit === Infinity ? null : account?.usage?.urlsLimit;
  const clicksUsed = account?.usage?.clicksThisMonth ?? 0;
  const clicksLimit = account?.usage?.clicksLimit === Infinity ? null : account?.usage?.clicksLimit;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h2 className="dash-title">My Dashboard</h2>
          <p className="dash-email">{user?.email}</p>
        </div>
        <div className="dash-header-right">
          <span
            className="role-badge"
            style={{ background: `${ROLE_COLORS[role]}22`, color: ROLE_COLORS[role], borderColor: `${ROLE_COLORS[role]}44` }}
          >
            {role}
          </span>
          <Link to="/pricing" className="upgrade-link">Upgrade Plan →</Link>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Quota */}
      {account && (
        <div className="quota-section">
          <QuotaBar used={urlsUsed} limit={urlsLimit} label="URLs this month" />
          <QuotaBar used={clicksUsed} limit={clicksLimit} label="Clicks tracked this month" />
        </div>
      )}

      {/* Create Form */}
      <div className="dash-card">
        <h3 className="dash-card-title">Shorten a New URL</h3>
        <form onSubmit={handleCreate} className="create-form">
          <input
            type="url"
            placeholder="https://example.com/long-url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
            className="dash-input"
          />

          {/* Custom Alias — PRO+ only */}
          {features.customAlias ? (
            <input
              type="text"
              placeholder="Custom alias (optional)"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              className="dash-input"
            />
          ) : (
            <div className="locked-field">
              <span>Custom Alias</span>
              <Link to="/pricing" className="upgrade-badge">Pro ↑</Link>
            </div>
          )}

          {/* Expiry — PRO+ only */}
          {features.expiry ? (
            <input
              type="datetime-local"
              placeholder="Expiry date/time (optional)"
              value={expiredAt}
              onChange={(e) => setExpiredAt(e.target.value)}
              className="dash-input"
            />
          ) : (
            <div className="locked-field">
              <span>Link Expiry</span>
              <Link to="/pricing" className="upgrade-badge">Pro ↑</Link>
            </div>
          )}

          {/* Fallback URL — PREMIUM only */}
          {features.fallback ? (
            <input
              type="url"
              placeholder="Fallback URL when expired (optional)"
              value={fallbackUrl}
              onChange={(e) => setFallbackUrl(e.target.value)}
              className="dash-input"
            />
          ) : (
            <div className="locked-field">
              <span>Custom Fallback URL</span>
              <Link to="/pricing" className="upgrade-badge premium">Premium ↑</Link>
            </div>
          )}

          {error && <p className="dash-error">{error}</p>}
          {success && <p className="dash-success">{success}</p>}
          <button type="submit" className="dash-btn">Shorten URL</button>
        </form>
      </div>

      {/* URL List */}
      <div className="dash-card">
        <h3 className="dash-card-title">My Links</h3>
        {urls.length === 0 ? (
          <p className="dash-empty">No links yet. Create your first one above!</p>
        ) : (
          <ul className="url-list">
            {urls.map((url) => {
              const shortUrl = `http://localhost:3000/${url.shortCode}`;
              return (
                <li key={url.shortCode} className="url-item">
                  <div className="url-item-main">
                    <a href={shortUrl} target="_blank" rel="noreferrer" className="url-short">
                      /{url.shortCode}
                    </a>
                    <span className="url-original">{url.originalUrl}</span>
                  </div>
                  <div className="url-item-meta">
                    <span className="url-clicks">🖱 {url.clickCount} clicks</span>
                    {url.expiredAt && (
                      <span className="url-expiry">
                        ⏰ {new Date(url.expiredAt).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(shortUrl)}
                    >
                      {copied === shortUrl ? '✓ Copied' : 'Copy'}
                    </button>
                    <Link to={`/analytics/${url.shortCode}`} className="analytics-link">
                      View Analytics →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}