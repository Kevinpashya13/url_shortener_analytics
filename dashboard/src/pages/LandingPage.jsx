import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, BarChart2, Link2, Clock, ShieldCheck, Lock, 
  Copy, Check, ExternalLink, ArrowRight, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createShortUrl } from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import './LandingPage.css';

const FEATURES = [
  {
    Icon: Zap,
    title: 'Instant Shortening',
    desc: 'Generate clean, lightning-fast short links in milliseconds with zero friction.',
  },
  {
    Icon: BarChart2,
    title: 'Real-time Analytics',
    desc: 'Monitor clicks, geolocations, devices, and referral sources in real-time.',
  },
  {
    Icon: Link2,
    title: 'Custom Brand Aliases',
    desc: 'Create memorable branded links that build trust and boost click-through rates.',
  },
  {
    Icon: Clock,
    title: 'Link Expiry Controls',
    desc: 'Set automatic expiration timers for time-sensitive marketing campaigns.',
  },
  {
    Icon: ShieldCheck,
    title: 'Smart Fallback URLs',
    desc: 'Redirect visitors to custom destinations when a campaign link reaches expiration.',
  },
  {
    Icon: Lock,
    title: 'Enterprise-grade Security',
    desc: 'Protected with rate limiting, HTTPS encryption, and spam blacklist verification.',
  },
];

export default function LandingPage() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      // If guest, preserve input and redirect to quick onboarding
      navigate('/get-started', { state: { pendingUrl: inputUrl } });
      return;
    }

    setLoading(true);
    try {
      const res = await createShortUrl(inputUrl);
      const generatedCode = res.data.shortCode;
      setResult({
        shortCode: generatedCode,
        shortUrl: `${API_BASE_URL}/${generatedCode}`,
        originalUrl: res.data.originalUrl,
      });
      setInputUrl('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to shorten URL. Please try again.');
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
    <div className="landing">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <Sparkles size={14} className="hero-eyebrow-icon" />
          <span>Next-Gen Link Management</span>
        </div>

        <h1 className="hero-title">
          Shorten links with <br />
          <span className="hero-accent">precision & speed</span>
        </h1>

        <p className="hero-subtitle">
          Clean URLs, instant feedback, and deep click telemetry.
          Paste your destination below to get started in seconds.
        </p>

        {/* Hero Form Box */}
        <div className="hero-box-container">
          <form className="hero-form" onSubmit={handleShorten}>
            <div className="hero-input-wrap">
              <input
                type="url"
                placeholder="Paste your long link here (e.g., https://example.com/very-long-url)..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                required
                className="hero-input"
              />
              <button type="submit" className="hero-btn" disabled={loading}>
                {loading ? 'Shortening...' : 'Shorten Link'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {error && <div className="hero-error-msg">{error}</div>}

          {/* ── Instant Result & Feedback Card ── */}
          {result && (
            <div className="instant-result-card">
              <div className="instant-result-header">
                <span className="result-label">Your shortened link is ready:</span>
                <span className="result-badge">Instant</span>
              </div>

              <div className="instant-result-body">
                <div className="instant-link-display">
                  <a 
                    href={result.shortUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="instant-link-text"
                  >
                    {result.shortUrl}
                  </a>
                  <span className="instant-dest-text" title={result.originalUrl}>
                    Target: {result.originalUrl}
                  </span>
                </div>

                <div className="instant-actions">
                  <button 
                    type="button" 
                    className={`instant-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <a 
                    href={result.shortUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="instant-icon-btn"
                    title="Open Short Link"
                  >
                    <ExternalLink size={16} />
                  </a>

                  <Link 
                    to={`/analytics/${result.shortCode}`} 
                    className="instant-icon-btn"
                    title="View Analytics"
                  >
                    <BarChart2 size={16} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <p className="hero-note">
              Free 25 links/month &middot; No credit card required &middot;{' '}
              <Link to="/register">Create free account</Link>
            </p>
          )}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Engineered for clarity and control</h2>
          <p className="section-sub">
            Everything you need to deliver high-converting links and monitor audience interaction.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon-wrap">
                <Icon size={20} />
              </div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>

        <div className="features-cta-wrap">
          <Link to="/pricing" className="see-plans-btn">
            Explore All Features & Pricing <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Bottom Call to Action ── */}
      <section className="bottom-cta-section">
        <div className="bottom-cta-card">
          <h2 className="bottom-cta-title">Ready to take control of your links?</h2>
          <p className="bottom-cta-sub">
            Join thousands of creators, founders, and developers optimizing their link performance today.
          </p>
          <div className="bottom-cta-buttons">
            <Link to={user ? "/dashboard" : "/register"} className="cta-btn primary">
              {user ? "Go to Dashboard" : "Get Started for Free"}
            </Link>
            <Link to="/features" className="cta-btn secondary">
              View Feature Specs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
