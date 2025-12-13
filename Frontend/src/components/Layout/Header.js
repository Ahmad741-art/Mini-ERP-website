import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administratör',
      lager: 'Lageransvarig',
      ekonomi: 'Ekonomiansvarig'
    };
    return labels[role] || role;
  };

  return (
    <div className="header">
      <div className="header-left">
        <h2>Mini-ERP Light</h2>
      </div>
      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            {getInitials(user?.name || 'U')}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{getRoleLabel(user?.role)}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logga ut
        </button>
      </div>
    </div>
  );
};

export default Header;