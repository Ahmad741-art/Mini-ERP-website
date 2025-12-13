import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './Orders.css';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const { subscribe } = useSocket();

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time updates
    const unsubscribe = subscribe('order:created', handleOrderUpdate);
    const unsubscribe2 = subscribe('order:updated', handleOrderUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribe2) unsubscribe2();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (customerFilter) params.customer = customerFilter;

      const response = await orderAPI.getAll(params);
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Fel vid hämtning av ordrar');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prevOrders => {
      const index = prevOrders.findIndex(o => o._id === updatedOrder._id);
      if (index !== -1) {
        const newOrders = [...prevOrders];
        newOrders[index] = updatedOrder;
        return newOrders;
      } else {
        return [updatedOrder, ...prevOrders];
      }
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, customerFilter]);

  const getStatusLabel = (status) => {
    const labels = {
      not_ready: 'Ej klar',
      ready_to_pick: 'Klar för plock',
      picked: 'Plockad',
      invoiced: 'Fakturerad',
      cancelled: 'Avbruten'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(amount);
  };

  const getStats = () => {
    const total = orders.length;
    const notReady = orders.filter(o => o.status === 'not_ready').length;
    const readyToPick = orders.filter(o => o.status === 'ready_to_pick').length;
    const picked = orders.filter(o => o.status === 'picked').length;
    const invoiced = orders.filter(o => o.status === 'invoiced').length;

    return { total, notReady, readyToPick, picked, invoiced };
  };

  const stats = getStats();

  if (loading && orders.length === 0) {
    return <div className="loading-state">Laddar ordrar...</div>;
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Ordrar</h1>
      </div>

      {error && <div className="error-state">{error}</div>}

      <div className="orders-stats">
        <div className="stat-card">
          <h3>Totalt</h3>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Ej klar</h3>
          <div className="value">{stats.notReady}</div>
        </div>
        <div className="stat-card">
          <h3>Klar för plock</h3>
          <div className="value">{stats.readyToPick}</div>
        </div>
        <div className="stat-card">
          <h3>Plockad</h3>
          <div className="value">{stats.picked}</div>
        </div>
        <div className="stat-card">
          <h3>Fakturerad</h3>
          <div className="value">{stats.invoiced}</div>
        </div>
      </div>

      <div className="orders-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Alla statusar</option>
              <option value="not_ready">Ej klar</option>
              <option value="ready_to_pick">Klar för plock</option>
              <option value="picked">Plockad</option>
              <option value="invoiced">Fakturerad</option>
              <option value="cancelled">Avbruten</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Kund</label>
            <input
              type="text"
              placeholder="Sök kund..."
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="orders-table-container">
        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>Inga ordrar hittades</h3>
            <p>Prova att ändra filterinställningarna</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Ordernummer</th>
                <th>Kund</th>
                <th>Status</th>
                <th>Belopp</th>
                <th>Skapad</th>
                <th>Rader</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>
                    <span className="order-number">{order.orderNumber}</span>
                  </td>
                  <td>
                    <div className="order-customer">{order.customer.name}</div>
                    <div className="order-date">{order.customer.email}</div>
                  </td>
                  <td>
                    <span className={`order-status ${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <span className="order-amount">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </td>
                  <td>
                    <span className="order-date">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>
                  <td>{order.orderLines?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrderList;