import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">Made by</span>
        <span>Kevinpashya13</span>
      </Link>

      <div className="navbar-nav">
        <Link to="/" className="nav-pill active">
          URL Shortener
        </Link>
        <Link to={user ? "/dashboard" : "/login"} className="nav-pill">
          Real-Time Analytics
        </Link>
      </div>

      <div className="navbar-actions">
        {user ? (
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <span className="user-badge">
              Hello, <strong>{user.email?.split('@')[0]}</strong>
            </span>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/login" className="nav-link">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary-nav">
              Sign Up Free
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
