import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <div className="layout-sidebar">
        <Sidebar />
      </div>
      <div className="layout-main">
        <div className="layout-header">
          <Header />
        </div>
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;