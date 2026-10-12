import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Plans', to: '/pricing' },
  { label: 'Analytics', to: '/features' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Otomatis tutup menu saat pindah rute
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* Left: logo + nav links desktop */}
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          <div className="brand-mark">KP</div>
          <span className="brand-name">KPShortLink</span>
        </Link>

        <div className="navbar-nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-item ${location.pathname === link.to ? 'nav-item-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: auth actions desktop */}
      <div className="navbar-actions">
        {user ? (
          <>
            <span className="user-name">{user.email?.split('@')[0]}</span>
            <Link to="/dashboard" className="nav-btn-outline">Dashboard</Link>
            <button onClick={handleLogout} className="nav-btn-ghost">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-item">Sign In</Link>
            <Link to="/register" className="nav-btn-primary">Get Started</Link>
          </>
        )}
      </div>

      {/* Hamburger button (Mobile only) */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-dropdown">
          <div className="mobile-nav-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`mobile-nav-item ${location.pathname === link.to ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mobile-nav-divider" />

          <div className="mobile-nav-actions">
            {user ? (
              <>
                <div className="mobile-user-info">
                  Signed in as <strong>{user.email?.split('@')[0]}</strong>
                </div>
                <Link to="/dashboard" className="mobile-btn-primary">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="mobile-btn-ghost">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-btn-outline">
                  Sign In
                </Link>
                <Link to="/register" className="mobile-btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
