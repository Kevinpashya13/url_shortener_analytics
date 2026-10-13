import { Link, useLocation } from 'react-router-dom';
import { Link2, CheckCircle2 } from 'lucide-react';
import './AuthGatePage.css';

export default function AuthGatePage() {
  const location = useLocation();
  const pendingUrl = location.state?.pendingUrl || '';

  return (
    <div className="authgate">
      <div className="authgate-card">
        <div className="authgate-icon-wrap">
          <Link2 size={32} />
        </div>
        <h1 className="authgate-title">Almost there!</h1>
        <p className="authgate-subtitle">
          Sign in or create a free account to start shortening links and tracking your analytics.
        </p>

        {pendingUrl && (
          <div className="authgate-url-preview">
            <span className="authgate-url-label">Your link:</span>
            <span className="authgate-url-text">{pendingUrl}</span>
          </div>
        )}

        <div className="authgate-actions">
          <Link
            to="/register"
            state={{ pendingUrl }}
            className="authgate-btn primary"
          >
            Create Free Account
          </Link>
          <Link
            to="/login"
            state={{ pendingUrl }}
            className="authgate-btn secondary"
          >
            Sign In
          </Link>
        </div>

        <div className="authgate-perks">
          <div className="authgate-perk">
            <CheckCircle2 size={16} className="authgate-perk-icon" />
            <span>25 free links/month</span>
          </div>
          <div className="authgate-perk">
            <CheckCircle2 size={16} className="authgate-perk-icon" />
            <span>Full clickstream analytics</span>
          </div>
          <div className="authgate-perk">
            <CheckCircle2 size={16} className="authgate-perk-icon" />
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </div>
  );
}

