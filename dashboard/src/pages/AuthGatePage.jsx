import { Link, useLocation } from 'react-router-dom';
import './AuthGatePage.css';

export default function AuthGatePage() {
  const location = useLocation();
  const pendingUrl = location.state?.pendingUrl || '';

  return (
    <div className="authgate">
      <div className="authgate-card">
        <div className="authgate-icon">🔗</div>
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
          <div className="authgate-perk">✅ 50 free links/month</div>
          <div className="authgate-perk">✅ Click analytics</div>
          <div className="authgate-perk">✅ No credit card required</div>
        </div>
      </div>
    </div>
  );
}

