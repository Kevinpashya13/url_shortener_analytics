import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const FEATURES = [
  { icon: '⚡', title: 'Instant Shortening', desc: 'Get your short link in milliseconds.' },
  { icon: '📊', title: 'Click Analytics', desc: 'Track clicks, location, device, and more.' },
  { icon: '🔗', title: 'Custom Aliases', desc: 'Branded links with your own keywords (Pro).' },
  { icon: '⏰', title: 'Link Expiry', desc: 'Set an expiry date/time for your links (Pro).' },
  { icon: '🛡️', title: 'Custom Fallback', desc: 'Redirect expired links to your site (Premium).' },
  { icon: '🔒', title: 'Secure & Reliable', desc: 'All links are served over HTTPS.' },
];

export default function LandingPage() {
  const [inputUrl, setInputUrl] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleShorten = (e) => {
    e.preventDefault();
    if (!user) {
      // Not logged in — redirect to auth gate, carry the url as state
      navigate('/get-started', { state: { pendingUrl: inputUrl } });
      return;
    }
    // Logged in — go to dashboard to create the link
    navigate('/dashboard', { state: { pendingUrl: inputUrl } });
  };

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">✨ Fast · Free · Powerful</div>
        <h1 className="hero-title">
          Shorten, Share &<br />
          <span className="hero-accent">Analyze Your Links</span>
        </h1>
        <p className="hero-subtitle">
          Create clean short links in seconds. Track who clicks them, where they're from,
          and what device they use — all in one dashboard.
        </p>

        <form className="hero-form" onSubmit={handleShorten}>
          <div className="hero-input-wrap">
            <input
              type="url"
              placeholder="Paste your long URL here..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              required
              className="hero-input"
            />
            <button type="submit" className="hero-btn">
              Shorten for Free →
            </button>
          </div>
          {!user && (
            <p className="hero-note">
              Free forever · No credit card required ·{' '}
              <Link to="/register">Create account</Link>
            </p>
          )}
        </form>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2 className="features-title">Everything you need to grow</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-name">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="pricing-teaser">
        <div className="pricing-teaser-inner">
          <h2>Pick the plan that fits you</h2>
          <p>Start free, upgrade when you need more power.</p>
          <div className="plan-pills">
            <span className="plan-pill standard">Standard · Free</span>
            <span className="plan-pill pro">Pro · Paid</span>
            <span className="plan-pill premium">Premium · Paid</span>
          </div>
          <Link to="/pricing" className="pricing-link-btn">See all plans →</Link>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="cta-section">
          <h2>Ready to shorten your first link?</h2>
          <p>Join thousands of users already using LinkSnap.</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-btn primary">Get Started Free</Link>
            <Link to="/login" className="cta-btn secondary">Sign In</Link>
          </div>
        </section>
      )}
    </div>
  );
}
