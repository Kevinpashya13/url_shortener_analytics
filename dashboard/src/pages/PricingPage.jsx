import { useState, Fragment } from 'react';
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
    category: 'Link Customization & Control',
    items: [
      { label: 'Instant QR Code & PNG Download', free: true, pro: true, premium: true },
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
  const [activeTab, setActiveTab] = useState('PRO');

  const selectedPlan = PLANS.find((p) => p.key === activeTab) || PLANS[1];

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

  const getPlanVal = (item, planKey) => {
    if (planKey === 'STANDARD') return item.free;
    if (planKey === 'PRO') return item.pro;
    return item.premium;
  };

  return (
    <div className="pricing">
      <div className="pricing-hero">
        <h1 className="pricing-title">Compare Plans & Features</h1>
        <p className="pricing-subtitle">
          Choose the plan that fits your link shortening and analytics scale.
        </p>
      </div>

      {/* ── DESKTOP VIEW: Full 4-Column Table (>= 768px) ── */}
      <div className="pricing-table-wrapper desktop-only">
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

      {/* ── MOBILE VIEW: Interactive Tab Switcher (< 768px) ── */}
      <div className="pricing-mobile-view mobile-only">
        <div className="mobile-plan-tabs">
          {PLANS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`mobile-tab-btn ${activeTab === p.key ? 'active' : ''} ${p.highlight ? 'is-highlight' : ''}`}
              onClick={() => setActiveTab(p.key)}
            >
              {p.name}
              {p.highlight && <span className="tab-dot">★</span>}
            </button>
          ))}
        </div>

        <div className="mobile-plan-card">
          <div className="mobile-card-top">
            <div>
              <h2 className="mobile-plan-title" style={{ color: selectedPlan.color }}>{selectedPlan.name} Plan</h2>
              <p className="mobile-plan-sub">{selectedPlan.tagline}</p>
            </div>
            <div className="mobile-plan-price">{selectedPlan.price}</div>
          </div>

          <div className="mobile-card-cta">
            {currentRole === selectedPlan.key ? (
              <span className="cta-current-badge">✓ Current plan</span>
            ) : !user ? (
              <Link to="/register" className={`table-cta-btn cta-${selectedPlan.ctaStyle}`}>
                Get Started
              </Link>
            ) : selectedPlan.targetRole ? (
              <Link
                to="/dashboard"
                state={{ upgradeRole: selectedPlan.targetRole }}
                className={`table-cta-btn cta-${selectedPlan.ctaStyle}`}
              >
                {selectedPlan.cta}
              </Link>
            ) : (
              <span className="cta-current-badge">✓ Current plan</span>
            )}
          </div>

          <div className="mobile-features-list">
            {FEATURES_TABLE.map((section, sIdx) => (
              <div key={sIdx} className="mobile-feature-group">
                <div className="mobile-group-title">{section.category}</div>
                {section.items.map((item, iIdx) => {
                  const val = getPlanVal(item, activeTab);
                  return (
                    <div key={iIdx} className="mobile-feature-item">
                      <span className="mobile-feat-label">{item.label}</span>
                      <span className="mobile-feat-val">{renderValue(val)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!user && (
        <p className="pricing-note">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      )}
    </div>
  );
}
