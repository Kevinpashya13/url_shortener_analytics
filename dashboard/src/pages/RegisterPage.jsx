import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useToast } from '../context/ToastContext';
import './AuthPage.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password minimal harus 8 karakter.');
      return;
    }

    setLoading(true);

    try {
      await registerUser(email, password);
      toast.success('Pendaftaran berhasil! Silakan masuk ke akun Anda.');
      navigate('/login');
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.error;

      if (status === 409 || serverMessage === 'Email already registered') {
        setError('Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
      } else if (status === 400) {
        setError(serverMessage || 'Email dan password (minimal 8 karakter) wajib diisi.');
      } else if (status === 429) {
        setError('Terlalu banyak percobaan pendaftaran. Silakan coba lagi setelah 15 menit.');
      } else if (!err.response) {
        setError('Tidak dapat terhubung ke server backend. Pastikan server sedang berjalan.');
      } else {
        setError(serverMessage || 'Pendaftaran gagal. Silakan periksa kembali data Anda.');
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
            <div className="auth-brand-mark">K</div>
            <span className="auth-brand-name">Kevinpashya13</span>
          </Link>

          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Start shortening and tracking your links for free.</p>

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
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="auth-input"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Memproses...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right: image side */}
      <div className="auth-image-side">
        <img src="/register.svg" alt="Register illustration" className="auth-image-fill" />
      </div>
    </div>
  );
}
