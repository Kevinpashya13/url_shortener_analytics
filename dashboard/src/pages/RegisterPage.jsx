import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image } from 'lucide-react';
import { registerUser } from '../api/auth';
import './AuthPage.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await registerUser(email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
                className="auth-input"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right: image placeholder */}
      <div className="auth-image-side">
        {<img src="../../public/register.svg" alt="" className="auth-image-fill" />}
      </div>
    </div>
  );
}
