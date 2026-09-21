import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getAnalytics } from '../api/url';
import { useAuth } from '../context/AuthContext';
import './AnalyticsPage.css';

function UpgradeBanner({ feature, requiredPlan }) {
  return (
    <div className="upgrade-banner">
      <span className="upgrade-banner-icon">🔒</span>
      <div>
        <p className="upgrade-banner-title">{feature} is not available on your current plan</p>
        <p className="upgrade-banner-desc">
          Upgrade to <strong>{requiredPlan}</strong> to unlock this insight.
        </p>
      </div>
      <Link to="/pricing" className="upgrade-banner-btn">Upgrade →</Link>
    </div>
  );
}

export default function AnalyticsPage() {
  const { shortCode } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  const role = user?.role || 'STANDARD';
  const isStandard = role === 'STANDARD';

  useEffect(() => {
    getAnalytics(shortCode).then((res) => setData(res.data));
  }, [shortCode]);

  if (!data) return <div className="analytics-loading">Loading analytics...</div>;

  return (
    <div className="analytics">
      {/* Header */}
      <div className="analytics-header">
        <Link to="/dashboard" className="analytics-back">← Back to Dashboard</Link>
        <h2 className="analytics-title">Analytics — <span className="analytics-code">/{data.shortCode}</span></h2>
        <p className="analytics-original">{data.originalUrl}</p>
      </div>

      {/* Stats */}
      <div className="analytics-stats">
        <div className="stat-card">
          <span className="stat-value">{data.totalClicks.toLocaleString()}</span>
          <span className="stat-label">Total Clicks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{new Date(data.createdAt).toLocaleDateString()}</span>
          <span className="stat-label">Created</span>
        </div>
        {data.expiredAt && (
          <div className="stat-card">
            <span className="stat-value">{new Date(data.expiredAt).toLocaleDateString()}</span>
            <span className="stat-label">Expires</span>
          </div>
        )}
      </div>

      {/* Clicks per Day */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Clicks per Day</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.clicksByDay}>
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
            <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Device Breakdown */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Device Breakdown</h3>
        {isStandard ? (
          <UpgradeBanner feature="Device breakdown" requiredPlan="Pro" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.deviceBreakdown}>
              <XAxis dataKey="deviceType" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Browser Breakdown */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Browser Breakdown</h3>
        {isStandard ? (
          <UpgradeBanner feature="Browser breakdown" requiredPlan="Pro" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.browserBreakdown}>
              <XAxis dataKey="browser" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Country Breakdown */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Top Countries</h3>
        {isStandard ? (
          <UpgradeBanner feature="Location analytics" requiredPlan="Pro" />
        ) : (
          <ul className="analytics-list">
            {(data.countryBreakdown || []).slice(0, 10).map((c) => (
              <li key={c.country} className="analytics-list-item">
                <span>{c.country}</span>
                <span className="analytics-count">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top Referrers */}
      <div className="analytics-card">
        <h3 className="analytics-card-title">Top Referrers</h3>
        {isStandard ? (
          <UpgradeBanner feature="Referrer analytics" requiredPlan="Pro" />
        ) : (
          <ul className="analytics-list">
            {(data.topReferrers || []).slice(0, 10).map((r) => (
              <li key={r.referrer} className="analytics-list-item">
                <span>{r.referrer}</span>
                <span className="analytics-count">{r.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}