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
      label: 'Orders',
      icon: '📦',
      roles: ['admin', 'lager', 'ekonomi']
    },
    {
      path: '/stock',
      label: 'Inventory',
      icon: '📊',
      roles: ['admin', 'lager']
    },
    {
      path: '/picking',
      label: 'Picking',
      icon: '✓',
      roles: ['admin', 'lager']
    },
    {
      path: '/invoices',
      label: 'Invoices',
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
        <h1>
          Mini<span className="logo-accent">ERP</span>
        </h1>
        <p>Warehouse & Orders</p>
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
        {connected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

export default Sidebar;