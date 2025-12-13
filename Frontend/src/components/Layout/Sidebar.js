import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Sidebar = () => {
  const { user } = useAuth();
  const { connected } = useSocket();

  const navItems = [
    {
      path: '/orders',
      label: 'Ordrar',
      icon: '📦',
      roles: ['admin', 'lager', 'ekonomi']
    },
    {
      path: '/stock',
      label: 'Lager',
      icon: '📊',
      roles: ['admin', 'lager']
    },
    {
      path: '/picking',
      label: 'Plockning',
      icon: '✓',
      roles: ['admin', 'lager']
    },
    {
      path: '/invoices',
      label: 'Fakturor',
      icon: '💰',
      roles: ['admin', 'ekonomi']
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>Mini-ERP</h1>
        <p>Lager & Order Dashboard</p>
      </div>
      
      <nav>
        <ul className="sidebar-nav">
          {filteredNavItems.map(item => (
            <li key={item.path} className="nav-item">
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="status-indicator">
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
        {connected ? 'Ansluten' : 'Frånkopplad'}
      </div>
    </div>
  );
};

export default Sidebar;