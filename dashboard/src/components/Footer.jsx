import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowUp, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* ── Top Grid Section ── */}
        <div className="footer-grid">

          {/* Navigation Column 1: Product */}
          <div className="footer-nav-col">
            <h4 className="footer-heading">Product</h4>
            <ul className="footer-link-list">
              <li>
                <Link to="/" className="footer-link">
                  URL Shortener
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  Real-time Analytics
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  QR Code Studio
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  Branded Aliases
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="footer-link">
                  Plans & Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Solutions */}
          <div className="footer-nav-col">
            <h4 className="footer-heading">Solutions</h4>
            <ul className="footer-link-list">
              <li>
                <Link to="/dashboard" className="footer-link">
                  UTM Campaign Builder
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  Link Expiration Controls
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  Smart Fallback URLs
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  Geolocation & Device Telemetry
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  Enterprise Rate Limiting
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Platform */}
          <div className="footer-nav-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-link-list">
              <li>
                <Link to="/dashboard" className="footer-link">
                  Workspace Dashboard
                </Link>
              </li>
              <li>
                <Link to="/get-started" className="footer-link">
                  Instant Onboarding
                </Link>
              </li>
              <li>
                <Link to="/features" className="footer-link">
                  REST API & Specs
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/KevinPashya" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-link external"
                >
                  Developer GitHub <ArrowUpRight size={13} className="external-arrow" />
                </a>
              </li>
              <li>
                <a 
                  href="https://linkedin.com/in/kevinpashya" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-link external"
                >
                  LinkedIn Profile <ArrowUpRight size={13} className="external-arrow" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Mid Separator & Highlights ── */}
        <div className="footer-separator">
          <div className="footer-highlights">
            <div className="footer-highlight-item">
              <ShieldCheck size={16} className="highlight-icon" />
              <span>Token Bucket Rate Limiting &amp; Redis Cache-Aside</span>
            </div>
            <div className="footer-highlight-item">
              <Sparkles size={16} className="highlight-icon" />
              <span>Collision-Free Base62 Bijective Encoding</span>
            </div>
            <div className="footer-highlight-item">
              <Activity size={16} className="highlight-icon" />
              <span>Sub-millisecond Edge Redirect Redirection</span>
            </div>
          </div>

          <button 
            type="button" 
            className="footer-scroll-top-btn" 
            onClick={scrollToTop}
            aria-label="Scroll back to top"
          >
            <span>Back to top</span>
            <ArrowUp size={14} />
          </button>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="footer-bottom-bar">
          <div className="footer-copy-text">
            &copy; {new Date().getFullYear()} <strong>KPShortLink</strong>. Designed &amp; Engineered by Kevin Pashya.
          </div>

          <div className="footer-social-cluster">
            {/* GitHub */}
            <a
              href="https://github.com/KevinPashya"
              target="_blank"
              rel="noreferrer"
              className="social-icon-btn"
              aria-label="GitHub Profile"
              title="GitHub"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="social-icon-btn"
              aria-label="X (Twitter) Profile"
              title="X / Twitter"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/in/kevinpashya"
              target="_blank"
              rel="noreferrer"
              className="social-icon-btn"
              aria-label="LinkedIn Profile"
              title="LinkedIn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
