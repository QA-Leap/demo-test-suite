import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import { setToken } from '../auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { token } = await api.login(email.trim(), password);
      setToken(token);
      navigate('/tasks', { replace: true });
    } catch (err) {
      const message =
        err instanceof api.ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit} data-testid="login-form" noValidate>
        <img className="auth-logo" src="/logo-full.png" alt="QA Leap" />
        <h1 className="auth-title">Task Manager</h1>
        <p className="auth-sub">Sign in to manage your QA tasks.</p>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            className="input"
            data-testid="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="demo@qaleap.com"
            autoComplete="username"
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            className="input"
            data-testid="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <div className="alert-error" data-testid="login-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          data-testid="login-submit"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="auth-hint">
          Demo credentials: <code>demo@qaleap.com</code> / <code>Demo123</code>
        </p>
      </form>
    </div>
  );
}
