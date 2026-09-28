import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, X, Sparkles } from 'lucide-react';
import './PricingPage.css';

const PLANS = [
  {
    key: 'STANDARD',
    name: 'Free',
    price: '$0',
    tagline: 'For personal testing',
    color: '#94a3b8',
    cta: 'Current Plan',
    ctaStyle: 'gray',
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 'Paid',
    tagline: 'For creators & growth',
    color: '#6366f1',
    highlight: true,
    cta: 'Upgrade to Pro',
    ctaStyle: 'pro',
    targetRole: 'PRO',
  },
  {
    key: 'PREMIUM',
    name: 'Premium',
    price: 'Paid',
    tagline: 'Maximum volume & power',
    color: '#a855f7',
    cta: 'Upgrade to Premium',
    ctaStyle: 'premium',
    targetRole: 'PREMIUM',
  },
];

const FEATURES_TABLE = [
  {
    category: 'Quotas & Usage',
    items: [
      { label: 'Monthly Short Links', free: '25 URLs / mo', pro: '150 URLs / mo', premium: '1,000 URLs / mo' },
      { label: 'Monthly Click Tracking', free: '1,000 clicks', pro: '5,000 clicks', premium: '100,000 clicks (100k)' },
    ],
  },
  {
    category: 'Link Customization & Management',
    items: [
      { label: 'Custom Alias', free: true, pro: true, premium: true },
      { label: 'Rename Alias (Keeps Analytics)', free: true, pro: true, premium: true },
      { label: 'Edit Destination URL', free: false, pro: true, premium: true },
      { label: 'Delete Short Links', free: false, pro: true, premium: true },
      { label: 'Link Expiry Date', free: false, pro: true, premium: true },
    ],
  },
  {
    category: 'Analytics & Automation',
    items: [
      { label: 'Analytics Depth', free: 'Basic (Total & Daily)', pro: 'Full (Geo, Device, Browser)', premium: 'Full (Geo, Device, Browser)' },
      { label: 'Custom Fallback URL (on expired)', free: false, pro: false, premium: true },
    ],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const currentRole = user?.role || 'STANDARD';

  const renderValue = (val) => {
    if (typeof val === 'boolean') {
      return val ? (
        <span className="table-check"><Check size={18} /></span>
      ) : (
        <span className="table-cross"><X size={18} /></span>
      );
    }
    return <span className="table-text-val">{val}</span>;
  };

  return (
    <div className="pricing">
      <div className="pricing-hero">
        <h1 className="pricing-title">Compare Plans & Features</h1>
        <p className="pricing-subtitle">
          Choose the plan that fits your link shortening and analytics scale.
        </p>
      </div>

      <div className="pricing-table-wrapper">
        <table className="pricing-table">
          <thead>
            <tr>
              <th className="th-features">Plan Overview</th>
              {PLANS.map((plan) => {
                const isCurrent = currentRole === plan.key;
                return (
                  <th key={plan.key} className={`th-plan ${plan.highlight ? 'th-highlight' : ''}`}>
                    {plan.highlight && (
                      <div className="table-popular-tag">
                        <Sparkles size={12} /> Most Popular
                      </div>
                    )}
                    <div className="table-plan-name" style={{ color: plan.color }}>{plan.name}</div>
                    <div className="table-plan-price">{plan.price}</div>
                    <div className="table-plan-tagline">{plan.tagline}</div>
                    <div className="table-plan-cta">
                      {isCurrent ? (
                        <span className="cta-current-badge">✓ Current plan</span>
                      ) : !user ? (
                        <Link to="/register" className={`table-cta-btn cta-${plan.ctaStyle}`}>
                          Get Started
                        </Link>
                      ) : plan.targetRole ? (
                        <Link
                          to="/dashboard"
                          state={{ upgradeRole: plan.targetRole }}
                          className={`table-cta-btn cta-${plan.ctaStyle}`}
                        >
                          {plan.cta}
                        </Link>
                      ) : (
                        <span className="cta-current-badge">✓ Current plan</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FEATURES_TABLE.map((section, sIdx) => (
              <Fragment key={sIdx}>
                <tr className="table-section-row">
                  <td colSpan={4}>{section.category}</td>
                </tr>
                {section.items.map((item, iIdx) => (
                  <tr key={iIdx} className="table-data-row">
                    <td className="td-feature-name">{item.label}</td>
                    <td className="td-val">{renderValue(item.free)}</td>
                    <td className="td-val td-highlight">{renderValue(item.pro)}</td>
                    <td className="td-val">{renderValue(item.premium)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {!user && (
        <p className="pricing-note">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      )}
    </div>
  );
}
