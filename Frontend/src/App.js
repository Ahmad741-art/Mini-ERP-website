import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import OrderList from './components/Orders/OrderList';
import StockList from './components/Stock/StockList';
import PickingList from './components/Picking/PickingList';
import InvoiceList from './components/Invoices/InvoiceList';
import './App.css';

function App() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <SocketProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/stock" element={<StockList />} />
            <Route path="/picking" element={<PickingList />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </Routes>
        </Layout>
      </Router>
    </SocketProvider>
  );
}

export default App;