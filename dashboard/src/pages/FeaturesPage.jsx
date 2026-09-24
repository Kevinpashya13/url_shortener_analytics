import { BarChart2, MapPin, Monitor, Globe, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './FeaturesPage.css';

const ANALYTICS_ITEMS = [
  {
    Icon: BarChart2,
    title: 'Total Click Count',
    desc: 'See exactly how many times each link has been clicked, all time.',
    plan: 'All plans',
  },
  {
    Icon: Globe,
    title: 'Daily Click Chart',
    desc: 'Visualize click volume day by day with an interactive line chart.',
    plan: 'All plans',
  },
  {
    Icon: MapPin,
    title: 'Geographic Breakdown',
    desc: 'Discover which countries your visitors are coming from.',
    plan: 'Pro & Premium',
  },
  {
    Icon: Monitor,
    title: 'Device & Browser',
    desc: 'Know exactly what devices and browsers your audience uses.',
    plan: 'Pro & Premium',
  },
  {
    Icon: ExternalLink,
    title: 'Referrer Tracking',
    desc: 'Find out where your traffic originates — search, social, or direct.',
    plan: 'Pro & Premium',
  },
  {
    Icon: Clock,
    title: 'Date Range Filter',
    desc: 'Filter all analytics data by a custom date range for deeper insights.',
    plan: 'Pro & Premium',
  },
];

export default function FeaturesPage() {
  return (
    <div className="fp">
      {/* Hero */}
      <div className="fp-hero">
        <h1 className="fp-title">Know your audience</h1>
        <p className="fp-sub">
          Every short link comes with built-in analytics. Understand who clicks,
          where they come from, and what device they use.
        </p>
      </div>

      <div className="fp-divider" />

      {/* Feature list */}
      <div className="fp-list-wrap">
        <div className="fp-list">
          {ANALYTICS_ITEMS.map(({ Icon, title, desc, plan }) => (
            <div className="fp-item" key={title}>
              <div className="fp-icon-wrap">
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="fp-text">
                <h3 className="fp-item-title">{title}</h3>
                <p className="fp-item-desc">{desc}</p>
              </div>
              <span className={`fp-badge ${plan === 'All plans' ? 'fp-badge-free' : 'fp-badge-pro'}`}>
                {plan}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="fp-divider" />

      {/* CTA */}
      <div className="fp-cta">
        <h2 className="fp-cta-title">Start tracking your links today</h2>
        <p className="fp-cta-sub">Sign up free — no credit card required.</p>
        <div className="fp-cta-buttons">
          <Link to="/register" className="fp-btn primary">Get started free</Link>
          <Link to="/pricing" className="fp-btn secondary">View plans</Link>
        </div>
      </div>
    </div>
  );
}

