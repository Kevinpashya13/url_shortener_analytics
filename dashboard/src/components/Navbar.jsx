import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-mark">K</div>
        <span className="brand-name">Kevinpashya13</span>
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
    </nav>
  );
}
