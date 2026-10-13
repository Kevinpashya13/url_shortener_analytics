import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, BarChart2, Link2, Clock, ShieldCheck, Lock, 
  Copy, Check, ExternalLink, ArrowRight, Sparkles, QrCode,
  Globe, Monitor, Compass, Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createShortUrl } from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import QrCodeModal from '../components/QrCodeModal';

import featureAnalyticsImg from '../assets/feature-analytics.jpg';
import featureQrcodeImg from '../assets/feature-qrcode.jpg';
import featureBrandingImg from '../assets/feature-branding.jpg';

import './LandingPage.css';

export default function LandingPage() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  
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
      {/* ── Hero Section (Aligned with Pricing Page) ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <Sparkles size={14} className="hero-eyebrow-icon" />
          <span>Next-Gen Link Management</span>
        </div>

        <h1 className="hero-title">
          Shorten links with <br />
          <span className="hero-accent">precision &amp; speed</span>
        </h1>

        <p className="hero-subtitle">
          Clean URLs, high-resolution QR codes, instant feedback, and deep real-time click telemetry.
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

                  <button 
                    type="button" 
                    className="instant-icon-btn"
                    title="View QR Code"
                    onClick={() => setQrModalOpen(true)}
                  >
                    <QrCode size={16} />
                  </button>

                  <Link 
                    to={`/analytics/${result.shortCode}`} 
                    className="instant-icon-btn"
                    title="View Analytics"
                  >
                    <BarChart2 size={16} />
                  </Link>
                </div>
              </div>

              <QrCodeModal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                url={result.shortUrl}
                shortCode={result.shortCode}
              />
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

      {/* ── Visual Feature Showcases (With Real Software Images) ── */}
      <section className="visual-features-section">
        <div className="section-header">
          <span className="section-tag">ENGINEERED FOR SCALE</span>
          <h2 className="section-title">Everything you need to control your traffic</h2>
          <p className="section-sub">
            Built from the ground up with bijective Base62 encoding, in-memory Redis caching, and real-time clickstream telemetry.
          </p>
        </div>

        <div className="showcases-list">
          {/* Showcase 1: Real-time Analytics */}
          <div className="showcase-card">
            <div className="showcase-info">
              <div className="showcase-badge">
                <BarChart2 size={15} />
                <span>REAL-TIME TELEMETRY</span>
              </div>
              <h3 className="showcase-heading">Deep clickstream intelligence &amp; audience breakdown</h3>
              <p className="showcase-desc">
                Know exactly who clicks your links, where they are located, and which devices and operating systems they use. Monitor traffic spikes in real time.
              </p>
              <div className="showcase-bullets">
                <div className="showcase-bullet-item">
                  <Globe size={18} className="showcase-bullet-icon" />
                  <span><strong>Geographic Country Distribution</strong> mapped to regional ISO codes</span>
                </div>
                <div className="showcase-bullet-item">
                  <Monitor size={18} className="showcase-bullet-icon" />
                  <span><strong>Device &amp; Browser Intelligence</strong> separating desktop, tablet, and mobile</span>
                </div>
                <div className="showcase-bullet-item">
                  <Compass size={18} className="showcase-bullet-icon" />
                  <span><strong>Referrer Attribution</strong> tracking direct traffic, social networks, and search</span>
                </div>
              </div>
              <Link to="/features" className="showcase-cta-link">
                Explore Analytics Specs <ArrowRight size={15} />
              </Link>
            </div>
            <div className="showcase-media">
              <img 
                src={featureAnalyticsImg} 
                alt="Real-time Analytics Dashboard Preview" 
                className="showcase-img"
              />
            </div>
          </div>

          {/* Showcase 2: QR Code Generator (Reversed layout) */}
          <div className="showcase-card reverse">
            <div className="showcase-info">
              <div className="showcase-badge cream">
                <QrCode size={15} />
                <span>OFFLINE TO ONLINE</span>
              </div>
              <h3 className="showcase-heading">Instant high-resolution QR codes ready for print</h3>
              <p className="showcase-desc">
                Bridge physical print media to digital destinations in one click. Every shortened link generates a scannable high-DPI QR code that you can download as a PNG file.
              </p>
              <div className="showcase-bullets">
                <div className="showcase-bullet-item">
                  <Zap size={18} className="showcase-bullet-icon" />
                  <span><strong>One-Click Download</strong> with crisp 2000px high-resolution PNG format</span>
                </div>
                <div className="showcase-bullet-item">
                  <Check size={18} className="showcase-bullet-icon" />
                  <span><strong>Print-Ready Contrast</strong> ideal for packaging, flyers, restaurant menus &amp; badges</span>
                </div>
                <div className="showcase-bullet-item">
                  <BarChart2 size={18} className="showcase-bullet-icon" />
                  <span><strong>Unified Telemetry</strong> logging every physical scan into your dashboard stats</span>
                </div>
              </div>
              <Link to="/pricing" className="showcase-cta-link">
                Get QR Code Generator <ArrowRight size={15} />
              </Link>
            </div>
            <div className="showcase-media">
              <img 
                src={featureQrcodeImg} 
                alt="High-Resolution QR Code Studio Preview" 
                className="showcase-img"
              />
            </div>
          </div>

          {/* Showcase 3: Custom Branding & UTM Campaigns */}
          <div className="showcase-card">
            <div className="showcase-info">
              <div className="showcase-badge">
                <Sliders size={15} />
                <span>BRAND &amp; CAMPAIGN CONTROL</span>
              </div>
              <h3 className="showcase-heading">Custom brand aliases, expiration timers &amp; UTM tags</h3>
              <p className="showcase-desc">
                Boost click-through rates with memorable branded vanity slugs. Maintain full control with automatic expiration dates and smart fallback destination routing.
              </p>
              <div className="showcase-bullets">
                <div className="showcase-bullet-item">
                  <Link2 size={18} className="showcase-bullet-icon" />
                  <span><strong>Memorable Branded Aliases</strong> (e.g. s.id/your-brand-launch)</span>
                </div>
                <div className="showcase-bullet-item">
                  <Clock size={18} className="showcase-bullet-icon" />
                  <span><strong>Automatic Link Expiration</strong> for time-sensitive promos &amp; flash sales</span>
                </div>
                <div className="showcase-bullet-item">
                  <ShieldCheck size={18} className="showcase-bullet-icon" />
                  <span><strong>Smart Fallback URLs</strong> rerouting expired visitors seamlessly</span>
                </div>
              </div>
              <Link to="/dashboard" className="showcase-cta-link">
                Start Shortening Links <ArrowRight size={15} />
              </Link>
            </div>
            <div className="showcase-media">
              <img 
                src={featureBrandingImg} 
                alt="Branded Aliases and UTM Builder Preview" 
                className="showcase-img"
              />
            </div>
          </div>
        </div>

        {/* Supplementary Quick Perks Grid */}
        <div className="perks-summary-grid">
          <div className="perk-card">
            <div className="perk-icon-wrap">
              <Zap size={20} />
            </div>
            <h4 className="perk-title">Redis Cache-Aside</h4>
            <p className="perk-desc">Sub-millisecond redirect lookups powered by in-memory Redis key-value cache.</p>
          </div>
          <div className="perk-card">
            <div className="perk-icon-wrap">
              <Sparkles size={20} />
            </div>
            <h4 className="perk-title">Bijective Base62</h4>
            <p className="perk-desc">Zero collision probability. Guaranteed mathematical uniqueness across every slug.</p>
          </div>
          <div className="perk-card">
            <div className="perk-icon-wrap">
              <ShieldCheck size={20} />
            </div>
            <h4 className="perk-title">Token Bucket Limiter</h4>
            <p className="perk-desc">Enterprise tier protection preventing spam, crawl storms, and abuse.</p>
          </div>
          <div className="perk-card">
            <div className="perk-icon-wrap">
              <Lock size={20} />
            </div>
            <h4 className="perk-title">Encrypted &amp; Sanitized</h4>
            <p className="perk-desc">Automatic URL protocol sanitation, malware blocking, and HTTPS enforcement.</p>
          </div>
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
            <Link to="/pricing" className="cta-btn secondary">
              View Plans &amp; Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
