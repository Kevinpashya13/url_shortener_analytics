import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createShortUrl } from '../api/url';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

export default function LandingPage() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [showAlias, setShowAlias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!originalUrl.trim()) return;

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await createShortUrl(
        originalUrl.trim(),
        customAlias.trim() || null,
        null
      );
      setResult(res.data);
      setOriginalUrl('');
      setCustomAlias('');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Custom alias is already taken. Please choose another one.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a minute and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to shorten link. Please ensure the URL is valid.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.shortUrl) return;
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">

          <h1 className="hero-title">
            Shorten Links, Track Performance & Optimize Clicks
          </h1>

          <p className="hero-subtitle">
            Create clean, memorable links in seconds. Track real-time visitor analytics, device types, and geographic location with precision.
          </p>

          {/* Interactive Shortener Form Box */}
          <div className="shortener-card">
            <form onSubmit={handleShorten} className="shortener-form">
              <div className="input-row">
                <input
                  type="url"
                  className="url-input"
                  placeholder="Paste a long link here (e.g., https://example.com/very-long-url)..."
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  required
                />
                <button type="submit" className="btn-shorten" disabled={loading}>
                  {loading ? 'Processing...' : 'Shorten for Free ➔'}
                </button>
              </div>

              {/* Collapsible Custom Alias */}
              <div className="alias-toggle-row">
                {!showAlias ? (
                  <button
                    type="button"
                    className="alias-toggle-btn"
                    onClick={() => setShowAlias(true)}
                  >
                    <span>+</span> Add Custom Alias (Optional)
                  </button>
                ) : (
                  <div className="alias-input-wrapper">
                    <span className="alias-prefix">localhost:3000/</span>
                    <input
                      type="text"
                      className="alias-input"
                      placeholder="custom-alias"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                    />
                    <button
                      type="button"
                      className="alias-toggle-btn"
                      onClick={() => {
                        setShowAlias(false);
                        setCustomAlias('');
                      }}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {error && <div className="error-banner">{error}</div>}
            </form>

            {/* Result Box */}
            {result && (
              <div className="result-card">
                <div className="result-header">
                  <span className="result-badge">🎉 Link Created Successfully!</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Short code: <strong>{result.shortCode}</strong>
                  </span>
                </div>

                <div className="result-body">
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="result-link"
                  >
                    {result.shortUrl}
                  </a>

                  <div className="result-actions">
                    <button onClick={handleCopy} className="btn-copy">
                      {copied ? 'Copied! ✅' : 'Copy Link 📋'}
                    </button>
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-visit"
                    >
                      Open ↗
                    </a>
                  </div>
                </div>

                <div className="result-cta">
                  <span>Original URL: <strong style={{ wordBreak: 'break-all' }}>{result.originalUrl}</strong></span>
                  {!user && (
                    <span>
                      Want to save and manage this link?{' '}
                      <Link to="/register">Create a Free Account</Link>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="hero-footer-note">
            ⚡ Powered by Redis In-Memory Caching for instant, zero-delay redirects.
          </p>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="features-section">
        <div className="section-label">Why Choose Us?</div>
        <h2 className="section-title">Powerful Features for Modern Link Management</h2>
        <p className="section-subtitle">
          Built on a high-performance backend architecture with deep real-time analytics.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper icon-speed">⚡</div>
            <h3 className="feature-heading">Lightning Fast Redirects</h3>
            <p className="feature-desc">
              Link lookups are optimized with in-memory Redis caching, delivering sub-5ms redirect responses.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper icon-analytics">📊</div>
            <h3 className="feature-heading">In-Depth Click Analytics</h3>
            <p className="feature-desc">
              Track total visitors, device breakdown (Desktop/Mobile), browser types, countries, and daily click trends.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper icon-custom">🏷️</div>
            <h3 className="feature-heading">Custom Brand Aliases</h3>
            <p className="feature-desc">
              Create memorable branded short links for your social media campaigns, portfolios, and personal branding.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="cta-banner-section">
        <div className="cta-box">
          <div className="cta-text">
            <h3>Ready to Manage and Track Your Links?</h3>
            <p>Sign up now to access your personal dashboard and unlock full analytics reports.</p>
          </div>
          <div>
            {user ? (
              <Link to="/dashboard" className="cta-btn">
                Go to My Dashboard ➔
              </Link>
            ) : (
              <Link to="/register" className="cta-btn">
                Create Free Account ➔
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Copyright by Kevinpashya13.</p>
      </footer>
    </div>
  );
}
