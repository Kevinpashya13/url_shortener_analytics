import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { upgradeAccount } from '../api/url';
import { Check } from 'lucide-react';
import './PricingPage.css';

const TIERS = [
  {
    role: 'STANDARD',
    name: 'Standard',
    desc: 'Core routing and vector QR exports for personal projects and small tests.',
    priceMonthly: 0,
    priceAnnual: 0,
    features: [
      '25 shortened links per month',
      '1,000 recorded click sessions',
      'Instant PNG QR Code download',
      'Custom alias support (s.id/name)',
      'Export analytics to CSV'
    ]
  },
  {
    role: 'PRO',
    name: 'Pro',
    desc: 'Branded redirects, referrers, and device breakdown for growing audiences.',
    priceMonthly: 9,
    priceAnnual: 7,
    popular: true,
    features: [
      '150 shortened links per month',
      '5,000 recorded click sessions',
      'Edit destination URL at any time',
      'Device and browser breakdown',
      'Geographic country distribution',
      'Delete unused links from library'
    ]
  },
  {
    role: 'PREMIUM',
    name: 'Premium',
    desc: 'Volume link automation, custom SLA, and smart fallback routing upon expiration.',
    priceMonthly: 29,
    priceAnnual: 24,
    features: [
      '1,000 shortened links per month',
      '100,000 recorded click sessions',
      'Smart fallback routing (No 404s)',
      'Campaign expiration schedules',
      'Priority telemetry indexing',
      'Dedicated support routing'
    ]
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [annual, setAnnual] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const currentRole = user?.role || 'STANDARD';

  const handleUpgrade = async (targetRole) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (targetRole === currentRole) return;

    setUpgrading(true);
    try {
      await upgradeAccount(targetRole);
      showToast(`Account successfully upgraded to ${targetRole}`, 'success');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      showToast(err.response?.data?.error || 'Upgrade failed', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="plan-container">
      {/* ── Headline: Confident 2-line statement ── */}
      <section className="plan-hero">
        <h1 className="plan-title">
          Plans built for scale.<br />
          Transparent at every tier.
        </h1>
        <p className="plan-sub">
          Start free with no credit card required. Upgrade anytime as your traffic and link volume expand.
        </p>

        {/* Flat Cadence Switcher */}
        <div className="plan-cadence-toggle">
          <button
            type="button"
            className={`plan-cadence-btn ${!annual ? 'active' : ''}`}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`plan-cadence-btn ${annual ? 'active' : ''}`}
            onClick={() => setAnnual(true)}
          >
            Annual (Save 20%)
          </button>
        </div>
      </section>

      {/* ── Plans Grid: Flat Surfaces & Clean Steps ── */}
      <section className="plan-grid">
        {TIERS.map((tier) => {
          const isCurrent = currentRole === tier.role;
          const price = annual ? tier.priceAnnual : tier.priceMonthly;

          return (
            <div
              key={tier.role}
              className={`plan-card ${tier.popular ? 'plan-card-featured' : ''}`}
            >
              <div className="plan-card-head">
                <span className="plan-name">{tier.name}</span>
                <p className="plan-desc">{tier.desc}</p>
                <div className="plan-price-row">
                  <span className="plan-currency">$</span>
                  <span className="plan-amount">{price}</span>
                  <span className="plan-period">/ month</span>
                </div>
              </div>

              <div className="plan-action-box">
                <button
                  type="button"
                  className={`plan-btn ${tier.popular ? 'plan-btn-featured' : 'plan-btn-default'}`}
                  disabled={isCurrent || upgrading}
                  onClick={() => handleUpgrade(tier.role)}
                >
                  {isCurrent ? 'Current Plan' : tier.priceMonthly === 0 ? 'Free Tier' : `Upgrade to ${tier.name}`}
                </button>
              </div>

              <ul className="plan-feat-list">
                {tier.features.map((feat, i) => (
                  <li key={i} className="plan-feat-item">
                    <Check size={14} className="plan-feat-icon" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
