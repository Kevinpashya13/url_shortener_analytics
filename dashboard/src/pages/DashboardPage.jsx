import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createShortUrl, getMyUrls } from '../api/url';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [urls, setUrls] = useState([]);
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [error, setError] = useState('');
  const { logout } = useAuth();

  const fetchUrls = async () => {
    const res = await getMyUrls();
    setUrls(res.data);
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createShortUrl(originalUrl, customAlias || null, null);
      setOriginalUrl('');
      setCustomAlias('');
      fetchUrls(); // refresh list setelah bikin baru
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create short URL');
    }
  };

  return (
    <div>
      <button onClick={logout}>Logout</button>
      <h2>My Short URLs</h2>

      <form onSubmit={handleCreate}>
        <input
          type="url"
          placeholder="https://example.com/long-url"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Custom alias (optional)"
          value={customAlias}
          onChange={(e) => setCustomAlias(e.target.value)}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Shorten</button>
      </form>

      <ul>
        {urls.map((url) => (
          <li key={url.shortCode}>
            <a href={`http://localhost:3000/${url.shortCode}`} target="_blank" rel="noreferrer">
              /{url.shortCode}
            </a>
            {' -> '}{url.originalUrl}
            {' | '}Klik: {url.clickCount}
            {' | '}
            <Link to={`/analytics/${url.shortCode}`}>Lihat Analytics</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}