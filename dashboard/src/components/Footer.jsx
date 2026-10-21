import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-layout">
          {/* ── Left: 4 Navigation Columns ── */}
          <div className="footer-columns">
            {/* Column 1: Features */}
            <div className="footer-col">
              <h4 className="footer-heading">Features</h4>
              <ul className="footer-link-list">
                <li><Link to="/" className="footer-link">URL Shortener</Link></li>
                <li><Link to="/features" className="footer-link">Link Management</Link></li>
                <li><Link to="/features" className="footer-link">Branded Aliases</Link></li>
                <li><Link to="/features" className="footer-link">Click Telemetry</Link></li>
                <li><Link to="/features" className="footer-link">QR Code Generator</Link></li>
                <li><Link to="/features" className="footer-link">Short URL API</Link></li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div className="footer-col">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-link-list">
                <li><Link to="/features" className="footer-link">REST API &amp; Specs</Link></li>
                <li><Link to="/features" className="footer-link">Edge Routing Process</Link></li>
                <li><Link to="/features" className="footer-link">UTM Campaign Builder</Link></li>
                <li><Link to="/pricing" className="footer-link">Plans &amp; Pricing</Link></li>
                <li><Link to="/get-started" className="footer-link">Instant Onboarding</Link></li>
              </ul>
            </div>

            {/* Column 3: Contact Us */}
            <div className="footer-col">
              <h4 className="footer-heading">Contact Us</h4>
              <ul className="footer-link-list">
                <li>
                  <a 
                    href="https://github.com/KevinPashya" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="footer-link"
                  >
                    Developer GitHub
                  </a>
                </li>
                <li>
                  <a 
                    href="https://linkedin.com/in/kevinpashya" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="footer-link"
                  >
                    LinkedIn Profile
                  </a>
                </li>
                <li><a href="mailto:support@kpshortlink.com" className="footer-link">Contact Support</a></li>
                <li><a href="mailto:abuse@kpshortlink.com" className="footer-link">Report Abuse</a></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div className="footer-col">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-link-list">
                <li><Link to="/terms" className="footer-link">Terms of Service</Link></li>
                <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="footer-link">Cookie Policy</Link></li>
                <li><Link to="/security" className="footer-link">Security Compliance</Link></li>
                <li><Link to="/privacy" className="footer-link">Privacy Manager</Link></li>
              </ul>
            </div>
          </div>

          {/* ── Right: Socials + Brand Logo + Copyright ── */}
          <div className="footer-brand-side">
            <div className="footer-social-row">
              {/* Facebook */}
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-icon" 
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-icon" 
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a 
                href="https://linkedin.com/in/kevinpashya" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-icon" 
                aria-label="LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              {/* X / Twitter */}
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-icon" 
                aria-label="X (Twitter)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>

            <Link to="/" className="footer-brand-logo">
              KPShortLink
            </Link>

            <div className="footer-copyright">
              <div>&copy; {new Date().getFullYear()} KPShortLink LLC</div>
              <div>All Rights Reserved</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
