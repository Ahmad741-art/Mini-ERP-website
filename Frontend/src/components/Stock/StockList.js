import React, { useState, useEffect } from 'react';
import { articleAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './Stock.css';

const StockList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { subscribe } = useSocket();

  useEffect(() => {
    fetchArticles();

    // Subscribe to real-time stock updates
    const unsubscribe = subscribe('stock:updated', handleStockUpdate);
    const unsubscribe2 = subscribe('article:updated', handleArticleUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribe2) unsubscribe2();
    };
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockOnly) params.lowStock = 'true';
      if (searchQuery) params.search = searchQuery;

      const response = await articleAPI.getAll(params);
      if (response.data.success) {
        setArticles(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Fel vid hämtning av artiklar');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = (data) => {
    // Refresh articles when stock is updated
    fetchArticles();
  };

  const handleArticleUpdate = (updatedArticle) => {
    setArticles(prevArticles => {
      const index = prevArticles.findIndex(a => a._id === updatedArticle._id);
      if (index !== -1) {
        const newArticles = [...prevArticles];
        newArticles[index] = updatedArticle;
        return newArticles;
      }
      return prevArticles;
    });
  };

  useEffect(() => {
    fetchArticles();
  }, [categoryFilter, lowStockOnly, searchQuery]);

  const getStats = () => {
    const totalArticles = articles.length;
    const lowStockArticles = articles.filter(a => a.isLowStock).length;
    const totalValue = articles.reduce((sum, a) => sum + (a.stockQuantity * a.price), 0);
    const totalReserved = articles.reduce((sum, a) => sum + a.reservedQuantity, 0);

    return { totalArticles, lowStockArticles, totalValue, totalReserved };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const stats = getStats();

  if (loading && articles.length === 0) {
    return <div className="loading-state">Laddar lager...</div>;
  }

  return (
    <div className="stock-container">
      <div className="stock-header">
        <h1>Lager</h1>
      </div>

      {error && <div className="error-state">{error}</div>}

      {stats.lowStockArticles > 0 && !lowStockOnly && (
        <div className="low-stock-warning">
          <h3>⚠️ Varning: Låga lagernivåer</h3>
          <p>{stats.lowStockArticles} artikel(ar) har nått eller underskridit minsta lagernivå</p>
        </div>
      )}

      <div className="stock-stats">
        <div className="stat-card">
          <h3>Totalt artiklar</h3>
          <div className="value">{stats.totalArticles}</div>
        </div>
        <div className="stat-card">
          <h3>Lågt lager</h3>
          <div className="value" style={{color: stats.lowStockArticles > 0 ? '#dc3545' : '#28a745'}}>
            {stats.lowStockArticles}
          </div>
        </div>
        <div className="stat-card">
          <h3>Lagervärde</h3>
          <div className="value" style={{fontSize: '24px'}}>
            {formatCurrency(stats.totalValue)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Reserverat</h3>
          <div className="value">{stats.totalReserved}</div>
        </div>
      </div>

      <div className="stock-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label>Sök artikel</label>
            <input
              type="text"
              placeholder="Artikelnummer eller namn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Kategori</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Alla kategorier</option>
              <option value="Möbler">Möbler</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Kontorsmaterial">Kontorsmaterial</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                style={{marginRight: '8px'}}
              />
              Visa endast lågt lager
            </label>
          </div>
        </div>
      </div>

      <div className="stock-table-container">
        {articles.length === 0 ? (
          <div className="empty-state">
            <h3>Inga artiklar hittades</h3>
            <p>Prova att ändra filterinställningarna</p>
          </div>
        ) : (
          <table className="stock-table">
            <thead>
              <tr>
                <th>Artikelnr</th>
                <th>Namn</th>
                <th>Kategori</th>
                <th>Lagersaldo</th>
                <th>Reserverat</th>
                <th>Tillgängligt</th>
                <th>Min nivå</th>
                <th>Pris</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article._id} className={article.isLowStock ? 'low-stock' : ''}>
                  <td>
                    <span className="article-number">{article.articleNumber}</span>
                  </td>
                  <td>
                    <div className="article-name">{article.name}</div>
                  </td>
                  <td>
                    {article.category && (
                      <span className="article-category">{article.category}</span>
                    )}
                  </td>
                  <td>
                    <span className={`stock-quantity ${article.isLowStock ? 'low' : 'normal'}`}>
                      {article.stockQuantity} {article.unit}
                    </span>
                  </td>
                  <td>
                    <span className="stock-reserved">{article.reservedQuantity} {article.unit}</span>
                  </td>
                  <td>
                    <span className="stock-available">{article.availableQuantity} {article.unit}</span>
                  </td>
                  <td>{article.minStockLevel} {article.unit}</td>
                  <td>{formatCurrency(article.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StockList;