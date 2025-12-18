import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  // Load saved email if "Remember Me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
    } else {
      // Save email if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    }
  };

  const quickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('.login-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>
            Mini<span className="brand-accent">ERP</span>
          </h1>
          <p>Warehouse & Order Management</p>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: '50px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: 'var(--medium-gray)',
                  padding: '4px 8px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: '0.3px',
              fontWeight: 600
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ 
                  marginRight: '8px', 
                  width: 'auto',
                  cursor: 'pointer',
                  accentColor: 'var(--accent-pink)'
                }}
              />
              Remember Me
            </label>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Quick Access Demo Accounts</h3>
          
          <div 
            className="demo-account" 
            onClick={() => quickLogin('admin@miniorp.se', 'admin123')}
          >
            <div>
              <strong>👑 Administrator</strong>
              <div className="credentials">admin@miniorp.se / admin123</div>
            </div>
            <span className="arrow">→</span>
          </div>

          <div 
            className="demo-account" 
            onClick={() => quickLogin('lager@miniorp.se', 'lager123')}
          >
            <div>
              <strong>📦 Warehouse Manager</strong>
              <div className="credentials">lager@miniorp.se / lager123</div>
            </div>
            <span className="arrow">→</span>
          </div>

          <div 
            className="demo-account" 
            onClick={() => quickLogin('ekonomi@miniorp.se', 'ekonomi123')}
          >
            <div>
              <strong>💰 Finance Manager</strong>
              <div className="credentials">ekonomi@miniorp.se / ekonomi123</div>
            </div>
            <span className="arrow">→</span>
          </div>
        </div>

        <div className="login-footer">
          <p>
            Need help? <a href="#support">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;