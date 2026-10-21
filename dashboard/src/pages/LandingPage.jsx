import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createShortUrl } from '../api/url';
import { API_BASE_URL } from '../api/axiosInstance';
import QrCodeModal from '../components/QrCodeModal';
import featureAnalyticsImg from '../assets/feature-analytics.jpg';
import featureQrcodeImg from '../assets/feature-qrcode.jpg';
import featureBrandingImg from '../assets/feature-branding.jpg';
import heroImg from '../assets/hero.png';
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

    if (!inputUrl.trim()) return;

    if (!user) {
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
      setError(err.response?.data?.error || 'Failed to shorten URL. Please check destination format.');
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
    <div className="lp-container">
      {/* ── 1. Hero: Confident 2-Line Headline at all widths ── */}
      <section className="lp-hero">
        <div className="lp-hero-layout">
          <div className="lp-hero-copy">
            <h1 className="lp-hero-statement">
              Precision short links.<br />
              Real-time telemetry.
            </h1>
            <p className="lp-hero-desc">
              Low-latency edge redirection, custom branded slugs, and non-invasive device telemetry without tracking cookies.
            </p>
          </div>

          <div className="lp-hero-action-panel">
            {/* The Live Thing: Immediate shortening console */}
            <form className="lp-form" onSubmit={handleShorten}>
              <div className="lp-input-group">
                <input
                  type="url"
                  placeholder="https://your-domain.com/long-campaign-path..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  required
                  className="lp-input"
                />
                <button type="submit" className="lp-btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Shorten'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>

            {error && <div className="lp-error-banner">{error}</div>}

            {result && (
              <div className="lp-result-panel" data-ui="true">
                <div className="lp-result-meta">
                  <span className="lp-result-label">Generated Destination</span>
                  <span className="lp-status-pill">Active</span>
                </div>
                <div className="lp-result-url-row">
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="lp-result-link"
                  >
                    {result.shortUrl}
                  </a>
                  <div className="lp-result-actions">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="lp-action-btn"
                      title="Copy URL"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrModalOpen(true)}
                      className="lp-action-btn"
                      title="Generate QR"
                    >
                      <QrCode size={14} />
                      <span>QR</span>
                    </button>
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="lp-action-btn"
                      title="Open link"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Real Imagery Showcase (Product World) ── */}
      <section className="lp-gallery">
        <div className="lp-gallery-grid">
          <figure className="lp-gallery-figure">
            <img src={featureAnalyticsImg} alt="Real-time telemetry and geo-origin inspector" className="lp-gallery-img" />
            <figcaption className="lp-gallery-caption">Real-Time Telemetry &amp; Geographic Origin</figcaption>
          </figure>
          <figure className="lp-gallery-figure">
            <img src={featureQrcodeImg} alt="High-density vector QR code barcode generator" className="lp-gallery-img" />
            <figcaption className="lp-gallery-caption">High-Density Print-Ready QR Codes</figcaption>
          </figure>
          <figure className="lp-gallery-figure">
            <img src={featureBrandingImg} alt="Custom domain alias and automated fail-safe redirection" className="lp-gallery-img" />
            <figcaption className="lp-gallery-caption">Custom Branded Slugs &amp; Smart Fallback</figcaption>
          </figure>
        </div>
      </section>

      {/* ── 3. Capabilities: Command Set (No costume 01/02 numbering) ── */}
      <section className="lp-capabilities">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Engineered for low latency and telemetry precision.</h2>
        </div>

        <div className="lp-command-list">
          <div className="lp-command-row">
            <span className="lp-command-key">Dynamic Edge Routing</span>
            <span className="lp-command-val">Sub-millisecond HTTP 302/301 redirects through Redis-backed in-memory resolution.</span>
          </div>
          <div className="lp-command-row">
            <span className="lp-command-key">Real-Time Telemetry</span>
            <span className="lp-command-val">Non-invasive User-Agent parsing captures device types, referrers, and ISO country codes.</span>
          </div>
          <div className="lp-command-row">
            <span className="lp-command-key">Automated Fallback Logic</span>
            <span className="lp-command-val">Expired campaign links cleanly redirect to predefined fail-safe destinations without 404 drops.</span>
          </div>
          <div className="lp-command-row">
            <span className="lp-command-key">Print-Ready QR Exports</span>
            <span className="lp-command-val">Direct vector and high-density PNG barcode generation with error correction level M.</span>
          </div>
        </div>
      </section>

      {/* ── 4. Live Product Fragment (data-ui) ── */}
      <section className="lp-interface-stage">
        <div className="lp-mock-window" data-ui="true">
          <div className="lp-mock-header">
            <span className="lp-mock-title">telemetry-cluster // live inspection</span>
            <span className="lp-mock-status">Operational</span>
          </div>
          <div className="lp-mock-grid">
            <div className="lp-mock-metric">
              <span className="lp-metric-name">Average Lookup Latency</span>
              <span className="lp-metric-val">1.2ms</span>
            </div>
            <div className="lp-mock-metric">
              <span className="lp-metric-name">Monthly Redirect Integrity</span>
              <span className="lp-metric-val">99.98%</span>
            </div>
            <div className="lp-mock-metric">
              <span className="lp-metric-name">Active Cache Hit Rate</span>
              <span className="lp-metric-val">94.3%</span>
            </div>
          </div>
          <div className="lp-mock-preview-wrap">
            <img src={heroImg} alt="Cluster latency telemetry monitoring view" className="lp-mock-img" />
          </div>
        </div>
      </section>

      {qrModalOpen && result && (
        <QrCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          shortUrl={result.shortUrl}
          shortCode={result.shortCode}
        />
      )}
    </div>
  );
}
