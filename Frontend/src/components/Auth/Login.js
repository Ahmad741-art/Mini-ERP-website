import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  const quickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Mini-ERP Light</h1>
          <p>Lager & Order Dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@email.se"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        <div className="demo-accounts">
          <h3>Demo-konton</h3>
          
          <div className="demo-account" onClick={() => quickLogin('admin@miniorp.se', 'admin123')} style={{cursor: 'pointer'}}>
            <strong>Admin</strong>
            <div>admin@miniorp.se / admin123</div>
          </div>

          <div className="demo-account" onClick={() => quickLogin('lager@miniorp.se', 'lager123')} style={{cursor: 'pointer'}}>
            <strong>Lager</strong>
            <div>lager@miniorp.se / lager123</div>
          </div>

          <div className="demo-account" onClick={() => quickLogin('ekonomi@miniorp.se', 'ekonomi123')} style={{cursor: 'pointer'}}>
            <strong>Ekonomi</strong>
            <div>ekonomi@miniorp.se / ekonomi123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;