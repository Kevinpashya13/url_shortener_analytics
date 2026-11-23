import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.error;

      if (status === 401 || serverMessage === 'Invalid email or password') {
        setError('Email atau password yang Anda masukkan salah.');
      } else if (status === 429) {
        setError('Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.');
      } else if (!err.response) {
        setError('Tidak dapat terhubung ke server backend. Pastikan server sedang berjalan.');
      } else {
        setError(serverMessage || 'Gagal masuk. Silakan coba beberapa saat lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left: form */}
      <div className="auth-form-side">
        <div className="auth-form-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-mark">KP</div>
            <span className="auth-brand-name">KPShortLink</span>
          </Link>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account to continue.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Memproses...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>

      {/* Right: image side */}
      <div className="auth-image-side">
        <img src="/login.svg" alt="Login banner" className="auth-image-fill" />
      </div>
    </div>
  );
}