import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, BarChart2, Link2, Clock, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const FEATURES = [
  {
    Icon: Zap,
    title: 'Instant Shortening',
    desc: 'Generate a short link in milliseconds. No signup required to try.',
  },
  {
    Icon: BarChart2,
    title: 'Click Analytics',
    desc: 'Track every click — see daily trends, devices, locations, and referrers.',
  },
  {
    Icon: Link2,
    title: 'Custom Aliases',
    desc: 'Create branded links with your own keywords. Available on Pro and above.',
  },
  {
    Icon: Clock,
    title: 'Link Expiry',
    desc: 'Set an exact date and time for your link to stop working.',
  },
  {
    Icon: ShieldCheck,
    title: 'Custom Fallback',
    desc: 'When a link expires, redirect visitors to your own page instead of a 404.',
  },
  {
    Icon: Lock,
    title: 'Secure by Default',
    desc: 'Every link is served over HTTPS. Your data stays private.',
  },
];

export default function LandingPage() {
  const [inputUrl, setInputUrl] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleShorten = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/get-started', { state: { pendingUrl: inputUrl } });
      return;
    }
    navigate('/dashboard', { state: { pendingUrl: inputUrl } });
  };

  return (
    <div className="landing">

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          Shorten, share, and<br />
          <span className="hero-accent">understand your links</span>
        </h1>
        <p className="hero-subtitle">
          Create clean short links in seconds. Track who clicks, where they are,
          and what device they use — all from one dashboard.
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
              Shorten for free
            </button>
          </div>
          {!user && (
            <p className="hero-note">
              Free forever &middot; No credit card required &middot;{' '}
              <Link to="/register">Create account</Link>
            </p>
          )}
        </form>
      </section>

      <div className="section-divider" />

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything you need to grow</h2>
          <p className="section-sub">From basic shortening to deep analytics — we have you covered.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div className="feature-card" key={title}>
              <div className="feature-icon-wrap">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <h3 className="feature-name">{title}</h3>
              <p className="feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Pricing teaser */}
      <section className="pricing-teaser">
        <div className="section-header">
          <h2 className="section-title">Pick the plan that fits you</h2>
          <p className="section-sub">Start free. Upgrade when you need more power.</p>
        </div>
        <div className="plan-row">
          <div className="plan-tag standard">Standard &mdash; Free</div>
          <div className="plan-tag pro">Pro &mdash; Paid</div>
          <div className="plan-tag premium">Premium &mdash; Paid</div>
        </div>
        <Link to="/pricing" className="see-plans-btn">See all plans</Link>
      </section>

      {/* CTA — only for guests */}
      {!user && (
        <>
          <div className="section-divider" />
          <section className="cta-section">
            <h2 className="cta-title">Ready to shorten your first link?</h2>
            <p className="cta-sub">Join users who already use this service to track their links.</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-btn primary">Get started free</Link>
              <Link to="/login" className="cta-btn secondary">Sign in</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
