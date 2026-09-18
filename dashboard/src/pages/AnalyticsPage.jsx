import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAnalytics } from '../api/url';

export default function AnalyticsPage() {
  const { shortCode } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics(shortCode).then((res) => setData(res.data));
  }, [shortCode]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Analytics untuk /{data.shortCode}</h2>
      <p>Total Klik: {data.totalClicks}</p>
      <p>URL Asli: {data.originalUrl}</p>

      <h3>Klik per Hari</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data.clicksByDay}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>

      <h3>Breakdown Device</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.deviceBreakdown}>
          <XAxis dataKey="deviceType" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Top Referrers</h3>
      <ul>
        {data.topReferrers.map((r) => (
          <li key={r.referrer}>{r.referrer}: {r.count} klik</li>
        ))}
      </ul>
    </div>
  );
}