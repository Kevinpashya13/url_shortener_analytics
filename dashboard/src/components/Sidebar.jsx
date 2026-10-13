import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Home, BarChart2, Link as LinkIcon, FileText, Settings, LogOut
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ activeNav = 'dashboard', setActiveNav, linksCount = 0, firstShortCode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const isDashboardPage = location.pathname === '/dashboard';

  const handleNavClick = (tabId) => {
    if (tabId === 'dashboard') {
      if (isDashboardPage && setActiveNav) {
        setActiveNav('dashboard');
      } else {
        navigate('/dashboard', { state: { view: 'dashboard' } });
      }
    } else if (tabId === 'links') {
      if (isDashboardPage && setActiveNav) {
        setActiveNav('links');
      } else {
        navigate('/dashboard', { state: { view: 'links' } });
      }
    } else if (tabId === 'analytics') {
      if (firstShortCode) {
        navigate(`/analytics/${firstShortCode}`);
      } else {
        toast.info('Create a short link first to inspect deep analytics.');
      }
    } else if (tabId === 'reports') {
      toast.info('CSV export report will be available in the next release.');
    } else if (tabId === 'settings') {
      navigate('/pricing');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <LinkIcon size={24} className="sidebar-brand-icon" />
        <span className="sidebar-brand-title">LINKLYTICS</span>
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          <Home size={18} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'links' ? 'active' : ''}`}
          onClick={() => handleNavClick('links')}
        >
          <LinkIcon size={18} />
          <span>Links {linksCount > 0 ? `(${linksCount})` : ''}</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
          onClick={() => handleNavClick('analytics')}
        >
          <BarChart2 size={18} />
          <span>Analytics</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'reports' ? 'active' : ''}`}
          onClick={() => handleNavClick('reports')}
        >
          <FileText size={18} />
          <span>Reports</span>
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Footer Actions */}
      <div className="sidebar-footer">
        <Link to="/" className="sidebar-home-link">
          ← Back to Home
        </Link>
        <button type="button" onClick={handleLogout} className="sidebar-logout-btn">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
