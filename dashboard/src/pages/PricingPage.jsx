import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PricingPage.css';

const PLANS = [
  {
    key: 'STANDARD',
    name: 'Standard',
    price: 'Free',
    tagline: 'Perfect to get started',
    color: '#6b7280',
    features: [
      '50 URLs / month',
      '1,000 click tracks / month',
      'Total clicks + daily chart',
      '—  Custom alias',
      '—  Link expiry',
      '—  Full analytics',
      '—  Custom fallback URL',
    ],
    cta: 'Current free plan',
    ctaStyle: 'gray',
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 'Paid',
    tagline: 'For power users & creators',
    color: '#6366f1',
    highlight: true,
    features: [
      '1,000 URLs / month',
      '5,000 click tracks / month',
      'Full analytics (device, browser, location, referrer)',
      'Custom alias',
      'Link expiry (date & time)',
      '—  Custom fallback URL',
    ],
    cta: 'Upgrade to Pro',
    ctaStyle: 'pro',
    targetRole: 'PRO',
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    price: 'Paid',
    tagline: 'Maximum power & flexibility',
    color: '#a855f7',
    features: [
      '5,000 URLs / month',
      '500,000 click tracks / month',
      'Full analytics — all features',
      'Custom alias',
      'Link expiry (date & time)',
      'Custom fallback URL (expired link redirect)',
    ],
    cta: 'Upgrade to Premium',
    ctaStyle: 'premium',
    targetRole: 'PREMIUM',
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const currentRole = user?.role || null;

  return (
    <div className="pricing">
      <div className="pricing-hero">
        <h1 className="pricing-title">Simple, Transparent Pricing</h1>
        <p className="pricing-subtitle">
          Start for free. Upgrade anytime to unlock powerful features.
        </p>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const isCurrent = currentRole === plan.key;
          return (
            <div
              key={plan.key}
              className={`plan-card ${plan.highlight ? 'plan-highlight' : ''}`}
              style={{ '--plan-color': plan.color }}
            >
              {plan.highlight && <div className="plan-popular">Most Popular</div>}
              <div className="plan-header">
                <h2 className="plan-name" style={{ color: plan.color }}>{plan.name}</h2>
                <p className="plan-price">{plan.price}</p>
                <p className="plan-tagline">{plan.tagline}</p>
              </div>

              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f} className={`plan-feature ${f.startsWith('—') ? 'plan-feature-locked' : ''}`}>
                    {f.startsWith('—') ? (
                      <>
                        <span className="feat-icon locked">✕</span>
                        <span>{f.slice(2)}</span>
                      </>
                    ) : (
                      <>
                        <span className="feat-icon">✓</span>
                        <span>{f}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <div className="plan-cta">
                {isCurrent ? (
                  <span className="cta-current">✓ Your current plan</span>
                ) : !user ? (
                  <Link to="/register" className={`cta-btn cta-${plan.ctaStyle}`}>
                    {plan.cta}
                  </Link>
                ) : plan.targetRole ? (
                  <Link
                    to="/dashboard"
                    state={{ upgradeRole: plan.targetRole }}
                    className={`cta-btn cta-${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <span className="cta-current">✓ Your current plan</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!user && (
        <p className="pricing-note">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      )}
    </div>
  );
}

