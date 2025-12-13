import React, { useState, useEffect, useCallback } from 'react';
import { stockAPI, orderAPI } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import './Picking.css';

const PickingList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [focusedLineIndex, setFocusedLineIndex] = useState(0);
  const { subscribe } = useSocket();

  useEffect(() => {
    fetchPickingOrders();

    // Subscribe to real-time updates
    const unsubscribe = subscribe('order:updated', handleOrderUpdate);
    const unsubscribe2 = subscribe('picking:completed', handlePickingComplete);

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribe2) unsubscribe2();
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      const allLines = getAllPickingLines();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedLineIndex(prev => Math.min(prev + 1, allLines.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedLineIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const line = allLines[focusedLineIndex];
        if (line && !line.isPicked) {
          handleCompleteLine(line.orderId, line.lineId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [focusedLineIndex, orders]);

  const getAllPickingLines = () => {
    const lines = [];
    orders.forEach(order => {
      order.orderLines.forEach(line => {
        lines.push({
          orderId: order._id,
          lineId: line._id,
          ...line
        });
      });
    });
    return lines;
  };

  const fetchPickingOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll({ status: 'ready_to_pick' });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Fel vid hämtning av plockordrar');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    if (updatedOrder.status === 'ready_to_pick') {
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
    } else {
      // Remove order if status changed
      setOrders(prevOrders => prevOrders.filter(o => o._id !== updatedOrder._id));
    }
  };

  const handlePickingComplete = (data) => {
    fetchPickingOrders();
  };

  const handleCompleteLine = async (orderId, lineId) => {
    try {
      const response = await stockAPI.completePickingLine(orderId, lineId, {
        pickedQuantity: 1 // This should be the actual quantity picked
      });

      if (response.data.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => {
            if (order._id === orderId) {
              return {
                ...order,
                orderLines: order.orderLines.map(line => 
                  line._id === lineId 
                    ? { ...line, isPicked: true, pickedQuantity: line.quantity }
                    : line
                )
              };
            }
            return order;
          })
        );
        
        // Move focus to next line
        setFocusedLineIndex(prev => prev + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Fel vid plockning');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await orderAPI.updateStatus(orderId, 'picked');
      setOrders(prevOrders => prevOrders.filter(o => o._id !== orderId));
    } catch (err) {
      setError(err.response?.data?.message || 'Fel vid färdigställande av order');
    }
  };

  const getOrderProgress = (order) => {
    const total = order.orderLines.length;
    const picked = order.orderLines.filter(l => l.isPicked).length;
    return { total, picked, percentage: (picked / total) * 100 };
  };

  if (loading && orders.length === 0) {
    return <div className="loading-state">Laddar plockordrar...</div>;
  }

  const totalOrders = orders.length;
  const totalLines = orders.reduce((sum, o) => sum + o.orderLines.length, 0);
  const completedLines = orders.reduce((sum, o) => 
    sum + o.orderLines.filter(l => l.isPicked).length, 0
  );

  let currentLineIndex = 0;

  return (
    <div className="picking-container">
      <div className="picking-header">
        <h1>Plockning</h1>
      </div>

      {error && <div className="error-state">{error}</div>}

      <div className="picking-instructions">
        <h3>Tangentbordsnavigering</h3>
        <p>▲ / ▼ - Navigera mellan rader</p>
        <p>Enter / Space - Markera rad som plockad</p>
      </div>

      <div className="picking-stats">
        <div className="stat-card">
          <h3>Ordrar att plocka</h3>
          <div className="value">{totalOrders}</div>
        </div>
        <div className="stat-card">
          <h3>Totalt rader</h3>
          <div className="value">{totalLines}</div>
        </div>
        <div className="stat-card">
          <h3>Plockade rader</h3>
          <div className="value">{completedLines}</div>
        </div>
        <div className="stat-card">
          <h3>Återstår</h3>
          <div className="value">{totalLines - completedLines}</div>
        </div>
      </div>

      <div className="picking-list">
        {orders.length === 0 ? (
          <div className="empty-state">
            <h3>Inga ordrar att plocka</h3>
            <p>Bra jobbat! Alla ordrar är plockade.</p>
          </div>
        ) : (
          orders.map(order => {
            const progress = getOrderProgress(order);
            const allPicked = progress.picked === progress.total;

            return (
              <div key={order._id} className="picking-order">
                <div className="picking-order-header">
                  <div className="picking-order-info">
                    <h3>
                      Order: <span className="picking-order-customer">{order.orderNumber}</span>
                    </h3>
                    <p>{order.customer.name}</p>
                  </div>
                  <div className="picking-order-stats">
                    <div className="picking-stat">
                      <span className="picking-stat-label">Plockade</span>
                      <span className="picking-stat-value">
                        {progress.picked}/{progress.total}
                      </span>
                    </div>
                    <div className="picking-stat">
                      <span className="picking-stat-label">Framsteg</span>
                      <span className="picking-stat-value">
                        {Math.round(progress.percentage)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="picking-lines">
                  {order.orderLines.map((line, index) => {
                    const isFocused = currentLineIndex === focusedLineIndex;
                    currentLineIndex++;

                    return (
                      <div
                        key={line._id}
                        className={`picking-line ${isFocused ? 'focused' : ''} ${line.isPicked ? 'completed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="picking-checkbox"
                          checked={line.isPicked}
                          onChange={() => !line.isPicked && handleCompleteLine(order._id, line._id)}
                        />
                        <div className="picking-article-info">
                          <h4>{line.articleName}</h4>
                          <span className="picking-article-number">{line.articleNumber}</span>
                        </div>
                        <div className="picking-quantity">
                          {line.quantity}
                          <span className="picking-unit">st</span>
                        </div>
                        <div className="picking-location">-</div>
                        <span className={`picking-status ${line.isPicked ? 'completed' : 'pending'}`}>
                          {line.isPicked ? 'Plockad' : 'Väntar'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {allPicked && (
                  <button
                    className="complete-order-btn"
                    onClick={() => handleCompleteOrder(order._id)}
                  >
                    ✓ Färdigställ order
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PickingList;