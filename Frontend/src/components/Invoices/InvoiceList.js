import React, { useState, useEffect } from 'react';
import { invoiceAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './Invoices.css';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const { subscribe } = useSocket();

  useEffect(() => {
    fetchInvoices();

    // Subscribe to real-time updates
    const unsubscribe = subscribe('invoice:created', handleInvoiceUpdate);
    const unsubscribe2 = subscribe('invoice:updated', handleInvoiceUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribe2) unsubscribe2();
    };
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (customerFilter) params.customer = customerFilter;

      const response = await invoiceAPI.getAll(params);
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Fel vid hämtning av fakturor');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceUpdate = (updatedInvoice) => {
    setInvoices(prevInvoices => {
      const index = prevInvoices.findIndex(i => i._id === updatedInvoice._id);
      if (index !== -1) {
        const newInvoices = [...prevInvoices];
        newInvoices[index] = updatedInvoice;
        return newInvoices;
      } else {
        return [updatedInvoice, ...prevInvoices];
      }
    });
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, customerFilter]);

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Utkast',
      sent: 'Skickad',
      paid: 'Betald',
      overdue: 'Förfallen',
      cancelled: 'Makulerad'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(amount);
  };

  const getDueDateStatus = (invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return 'normal';
    }

    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 7) return 'soon';
    return 'normal';
  };

  const getStats = () => {
    const total = invoices.length;
    const draft = invoices.filter(i => i.status === 'draft').length;
    const sent = invoices.filter(i => i.status === 'sent').length;
    const paid = invoices.filter(i => i.status === 'paid').length;
    const overdue = invoices.filter(i => i.isOverdue && i.status !== 'paid').length;
    
    const totalValue = invoices
      .filter(i => i.status !== 'cancelled')
      .reduce((sum, i) => sum + i.totalAmount, 0);
    
    const unpaidValue = invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    return { total, draft, sent, paid, overdue, totalValue, unpaidValue };
  };

  const stats = getStats();

  if (loading && invoices.length === 0) {
    return <div className="loading-state">Laddar fakturor...</div>;
  }

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <h1>Fakturor</h1>
      </div>

      {error && <div className="error-state">{error}</div>}

      {stats.overdue > 0 && (
        <div className="overdue-warning">
          <h3>⚠️ Varning: Förfallna fakturor</h3>
          <p>{stats.overdue} faktura(or) har passerat förfallodatum</p>
        </div>
      )}

      <div className="invoices-stats">
        <div className="stat-card">
          <h3>Totalt fakturor</h3>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Utkast</h3>
          <div className="value">{stats.draft}</div>
        </div>
        <div className="stat-card">
          <h3>Skickade</h3>
          <div className="value">{stats.sent}</div>
        </div>
        <div className="stat-card">
          <h3>Betalda</h3>
          <div className="value">{stats.paid}</div>
        </div>
        <div className="stat-card">
          <h3>Förfallna</h3>
          <div className="value" style={{color: stats.overdue > 0 ? '#dc3545' : '#28a745'}}>
            {stats.overdue}
          </div>
        </div>
        <div className="stat-card">
          <h3>Totalt värde</h3>
          <div className="value" style={{fontSize: '20px'}}>
            {formatCurrency(stats.totalValue)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Obetalt värde</h3>
          <div className="value" style={{fontSize: '20px', color: stats.unpaidValue > 0 ? '#dc3545' : '#28a745'}}>
            {formatCurrency(stats.unpaidValue)}
          </div>
        </div>
      </div>

      <div className="invoices-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Alla statusar</option>
              <option value="draft">Utkast</option>
              <option value="sent">Skickad</option>
              <option value="paid">Betald</option>
              <option value="overdue">Förfallen</option>
              <option value="cancelled">Makulerad</option>
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

      <div className="invoices-table-container">
        {invoices.length === 0 ? (
          <div className="empty-state">
            <h3>Inga fakturor hittades</h3>
            <p>Prova att ändra filterinställningarna</p>
          </div>
        ) : (
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Fakturanr</th>
                <th>Kund</th>
                <th>Status</th>
                <th>Belopp</th>
                <th>Fakturadatum</th>
                <th>Förfallodatum</th>
                <th>Ordernr</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => {
                const dueDateStatus = getDueDateStatus(invoice);
                return (
                  <tr 
                    key={invoice._id}
                    className={dueDateStatus === 'overdue' ? 'overdue' : ''}
                  >
                    <td>
                      <span className="invoice-number">{invoice.invoiceNumber}</span>
                    </td>
                    <td>
                      <div className="invoice-customer">{invoice.customer.name}</div>
                      <div className="invoice-date">{invoice.customer.email}</div>
                    </td>
                    <td>
                      <span className={`invoice-status ${invoice.status}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`invoice-amount ${invoice.status === 'paid' ? 'paid' : 'unpaid'}`}>
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </td>
                    <td>
                      <span className="invoice-date">
                        {formatDate(invoice.invoiceDate)}
                      </span>
                    </td>
                    <td>
                      <span className={`due-date ${dueDateStatus}`}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </td>
                    <td>{invoice.orderNumber}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;