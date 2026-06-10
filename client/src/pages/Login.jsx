import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBackend } from '../context/BackendContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const backend = useBackend();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await backend.login(email, password);
        login(response.user, response.token);
      } else {
        const response = await backend.register(email, password, name);
        login(response.user, response.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="panel" style={{ background: 'var(--bg-panel)', borderBottom: '2px solid #ff6600' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#ff6600', fontSize: '16px', letterSpacing: '0.05em' }}>
          🎵 ARRA // AUDIT SYSTEM
        </h1>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Your name"
                style={{ background: 'var(--bg-workspace)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{ background: 'var(--bg-workspace)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ background: 'var(--bg-workspace)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', fontFamily: 'Roboto Mono', color: 'rgba(255, 255, 255, 0.45)' }}>
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                style={{
                  background: 'none',
                  color: '#ff6600',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '11px',
                  fontFamily: 'Roboto Mono'
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                style={{
                  background: 'none',
                  color: '#ff6600',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '11px',
                  fontFamily: 'Roboto Mono'
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
