import { useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Check, X, Sparkles, ChevronDown, ChevronUp, 
  ShieldCheck, Zap, Lock, ArrowRight 
} from 'lucide-react';
import './PricingPage.css';

const FAQS = [
  {
    q: 'Can I upgrade or downgrade my plan at any time?',
    a: 'Yes, absolutely. Plan changes take effect immediately in your account with zero downtime or waiting period.',
  },
  {
    q: 'What happens if I reach my monthly link creation quota?',
    a: 'Your existing shortened links will remain fully operational and continue logging click analytics normally. You will only need to upgrade if you wish to generate additional new links during that calendar month.',
  },
  {
    q: 'How do Smart Fallback URLs work on the Premium plan?',
    a: 'When a time-sensitive campaign link reaches its expiration date, visitors are automatically routed to your specified fallback destination rather than encountering a broken page.',
  },
  {
    q: 'Does the Free plan require a credit card?',
    a: 'No credit card or payment details are required. You can sign up and shorten up to 25 links per month completely free forever.',
  },
];

const COMPARISON_DATA = [
  {
    category: 'Quotas & Capacity',
    rows: [
      { feature: 'Monthly Short Links', free: '25 URLs / mo', pro: '150 URLs / mo', premium: '1,000 URLs / mo' },
      { feature: 'Monthly Click Tracking', free: '1,000 clicks', pro: '5,000 clicks', premium: '100,000 clicks' },
    ],
  },
  {
    category: 'Link Features & Customization',
    rows: [
      { feature: 'High-Res QR Code PNG Download', free: true, pro: true, premium: true },
      { feature: 'Custom Branded Alias (s.id/your-brand)', free: true, pro: true, premium: true },
      { feature: 'Rename Alias (Preserves Analytics)', free: true, pro: true, premium: true },
      { feature: 'Edit Target URL Anytime', free: false, pro: true, premium: true },
      { feature: 'Delete Short Links from Library', free: false, pro: true, premium: true },
      { feature: 'Link Expiration Date Controls', free: false, pro: true, premium: true },
      { feature: 'Smart Fallback URL (Upon Expiration)', free: false, pro: false, premium: true },
    ],
  },
  {
    category: 'Analytics Depth & Telemetry',
    rows: [
      { feature: 'Total & Daily Click History Chart', free: true, pro: true, premium: true },
      { feature: 'Geographic Country Breakdown', free: false, pro: true, premium: true },
      { feature: 'Device & Browser Intelligence', free: false, pro: true, premium: true },
      { feature: 'Referrer Sources & UTM Campaign Builder', free: false, pro: true, premium: true },
      { feature: 'Export Analytics to CSV (UTF-8 BOM)', free: true, pro: true, premium: true },
    ],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const currentRole = user?.role || 'STANDARD';
  
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
  const [showTable, setShowTable] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const isAnnual = billingCycle === 'annual';

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const renderCell = (val) => {
    if (typeof val === 'boolean') {
      return val ? (
        <span className="matrix-check"><Check size={18} /></span>
      ) : (
        <span className="matrix-cross"><X size={18} /></span>
      );
    }
    return <span className="matrix-text">{val}</span>;
  };

  return (
    <div className="pricing-page">
      {/* ── Hero Section ── */}
      <section className="pricing-hero">
        <div className="pricing-eyebrow">
          <Sparkles size={14} />
          <span>Transparent &amp; Predictable Pricing</span>
        </div>
        <h1 className="pricing-headline">
          Plans that scale with your <br />
          <span className="pricing-headline-accent">audience &amp; link volume</span>
        </h1>
        <p className="pricing-subtext">
          Start for free with zero commitments. Upgrade anytime for branded aliases, deep clickstream telemetry, and automated fallback redirection.
        </p>

        {/* Billing Switcher Toggle */}
        <div className="pricing-toggle-wrap">
          <div className="pricing-toggle">
            <button
              type="button"
              className={`toggle-btn ${!isAnnual ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`toggle-btn ${isAnnual ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annually
              <span className="discount-pill">Save 25%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 3 Main Pricing Cards ── */}
      <section className="pricing-cards-container">
        <div className="pricing-cards-grid">
          {/* 1. Free Plan */}
          <div className="pricing-card standard">
            <div className="card-header">
              <span className="plan-badge">Starter</span>
              <h3 className="card-plan-name">Free</h3>
              <p className="card-plan-desc">For individual link testing and personal side projects.</p>
              <div className="card-price-wrap">
                <span className="price-currency">$</span>
                <span className="price-number">0</span>
                <span className="price-period">/ forever</span>
              </div>
            </div>

            <div className="card-cta-wrap">
              {currentRole === 'STANDARD' && user ? (
                <button type="button" className="card-btn current" disabled>
                  Current Plan
                </button>
              ) : !user ? (
                <Link to="/register" className="card-btn outline">
                  Get Started Free
                </Link>
              ) : (
                <button type="button" className="card-btn outline" disabled>
                  Included
                </button>
              )}
            </div>

            <div className="card-features-list">
              <span className="features-group-title">Features included:</span>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon" />
                <span><strong>25</strong> short links / month</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon" />
                <span><strong>1,000</strong> click tracking</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon" />
                <span>Instant QR code &amp; PNG download</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon" />
                <span>Custom branded aliases</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon" />
                <span>Export analytics to CSV</span>
              </div>
            </div>
          </div>

          {/* 2. Pro Plan (Featured) */}
          <div className="pricing-card pro featured">
            <div className="featured-banner">
              <Sparkles size={13} />
              <span>MOST POPULAR</span>
            </div>

            <div className="card-header">
              <span className="plan-badge pro">Creators &amp; Growth</span>
              <h3 className="card-plan-name">Pro</h3>
              <p className="card-plan-desc">For creators, marketers, and brands requiring telemetry insights.</p>
              <div className="card-price-wrap">
                <span className="price-currency">$</span>
                <span className="price-number">{isAnnual ? '9' : '12'}</span>
                <span className="price-period">/ month</span>
              </div>
              {isAnnual && <span className="billed-annually-hint">Billed $108 annually</span>}
            </div>

            <div className="card-cta-wrap">
              {currentRole === 'PRO' ? (
                <button type="button" className="card-btn current" disabled>
                  Current Plan
                </button>
              ) : !user ? (
                <Link to="/register" className="card-btn primary-glow">
                  Get Started with Pro <ArrowRight size={15} />
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  state={{ upgradeRole: 'PRO' }}
                  className="card-btn primary-glow"
                >
                  Upgrade to Pro <ArrowRight size={15} />
                </Link>
              )}
            </div>

            <div className="card-features-list">
              <span className="features-group-title">Everything in Free, plus:</span>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon highlight" />
                <span><strong>150</strong> short links / month</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon highlight" />
                <span><strong>5,000</strong> click tracking</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon highlight" />
                <span><strong>Full Telemetry Analytics</strong> (Geo &amp; Device)</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon highlight" />
                <span><strong>Edit target URL</strong> anytime</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon highlight" />
                <span>Link expiration timer controls</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon highlight" />
                <span>Delete &amp; manage link library</span>
              </div>
            </div>
          </div>

          {/* 3. Premium Plan */}
          <div className="pricing-card premium">
            <div className="card-header">
              <span className="plan-badge premium">Scale &amp; Teams</span>
              <h3 className="card-plan-name">Premium</h3>
              <p className="card-plan-desc">For high-traffic operations, marketing campaigns, and agencies.</p>
              <div className="card-price-wrap">
                <span className="price-currency">$</span>
                <span className="price-number">{isAnnual ? '29' : '39'}</span>
                <span className="price-period">/ month</span>
              </div>
              {isAnnual && <span className="billed-annually-hint">Billed $348 annually</span>}
            </div>

            <div className="card-cta-wrap">
              {currentRole === 'PREMIUM' ? (
                <button type="button" className="card-btn current" disabled>
                  Current Plan
                </button>
              ) : !user ? (
                <Link to="/register" className="card-btn purple-btn">
                  Get Started with Premium
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  state={{ upgradeRole: 'PREMIUM' }}
                  className="card-btn purple-btn"
                >
                  Upgrade to Premium
                </Link>
              )}
            </div>

            <div className="card-features-list">
              <span className="features-group-title">Everything in Pro, plus:</span>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon premium" />
                <span><strong>1,000</strong> short links / month</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon premium" />
                <span><strong>100,000 (100k)</strong> click tracking</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon premium" />
                <span><strong>Smart Custom Fallback URL</strong> on expired</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon premium" />
                <span>Automated UTM Campaign Builder</span>
              </div>
              <div className="feature-bullet">
                <Check size={16} className="bullet-icon premium" />
                <span>Priority rate limits &amp; technical support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Collapsible Comparison Matrix ── */}
      <section className="pricing-matrix-section">
        <div className="matrix-toggle-wrap">
          <button
            type="button"
            className="matrix-toggle-btn"
            onClick={() => setShowTable(!showTable)}
          >
            <span>{showTable ? 'Hide Detailed Feature Comparison' : 'Compare All Features & Limits'}</span>
            {showTable ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {showTable && (
          <div className="matrix-table-card">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="th-feat-col">Features &amp; Specifications</th>
                  <th className="th-val-col">Free</th>
                  <th className="th-val-col highlight">Pro</th>
                  <th className="th-val-col">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((group, gIdx) => (
                  <Fragment key={gIdx}>
                    <tr className="matrix-group-row">
                      <td colSpan={4} className="matrix-group-header">
                        {group.category}
                      </td>
                    </tr>
                    {group.rows.map((r, rIdx) => (
                      <tr key={rIdx} className="matrix-row">
                        <td className="matrix-col-name">{r.feature}</td>
                        <td className="matrix-col-val">{renderCell(r.free)}</td>
                        <td className="matrix-col-val highlight">{renderCell(r.pro)}</td>
                        <td className="matrix-col-val">{renderCell(r.premium)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Trust Badges ── */}
      <section className="pricing-trust-section">
        <div className="trust-grid">
          <div className="trust-item">
            <div className="trust-icon-box">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="trust-title">Enterprise Security &amp; Sanitization</h4>
              <p className="trust-desc">Token bucket rate limiting, blacklist verification, and encrypted HTTPS routing.</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="trust-title">Sub-Millisecond Redirections</h4>
              <p className="trust-desc">In-memory Redis cache-aside architecture delivering lightning-fast edge performance.</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <Lock size={20} />
            </div>
            <div>
              <h4 className="trust-title">Zero Lock-In, Flexible Billing</h4>
              <p className="trust-desc">Upgrade instantly or cancel anytime directly from your account settings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="pricing-faq-section">
        <h2 className="faq-main-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(idx)}
                >
                  <span className="faq-q-text">{faq.q}</span>
                  <span className="faq-chevron">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>
                {isOpen && <p className="faq-answer-text">{faq.a}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
