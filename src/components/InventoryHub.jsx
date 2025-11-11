// src/components/InventoryHub.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import '../styles/InventoryHub.css';

const InventoryHub = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHubData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/api/inventory-hub");
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        setError("Failed to load inventory data. Please ensure the backend is running and accessible.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHubData();
  }, []);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventory;
    const lowercasedFilter = searchTerm.toLowerCase();
    return inventory.filter(item => {
      return (
        item.sku?.toLowerCase().includes(lowercasedFilter) ||
        item.product_name?.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, inventory]);

  const getStatusClass = (status) => {
    if (!status) return '';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('obsolete')) return 'status-critical';
    if (lowerStatus.includes('inactive')) return 'status-warning';
    if (lowerStatus.includes('active')) return 'status-active';
    return '';
  };

  const getHealthClass = (value, thresholds) => {
    if (value === null || value === undefined) return '';
    if (value < thresholds.low) return 'health-critical';
    if (value >= thresholds.low && value < thresholds.high) return 'health-warning';
    return 'health-safe';
  };

  if (loading) return <div className="hub-loading">Loading Inventory Hub...</div>;
  if (error) return <div className="hub-error">{error}</div>;

  return (
    <div className="inventory-hub-page">
      <h1>Inventory Hub</h1>
      
      <div className="hub-kpis">
        <div className="kpi-card">
          <span className="kpi-label">Total Inventory Value</span>
          <span className="kpi-value">$2.4M</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Items with Shortage</span>
          <span className="kpi-value">12</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Items with Excess</span>
          <span className="kpi-value">8</span>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="table-toolbar">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by SKU or Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-scroll">
          <table className="hub-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Status</th>
                <th>On Hand</th>
                <th>Months Supply</th>
                <th>Safety Stock %</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.product_id} onClick={() => navigate(`/products/${item.product_id}`)}>
                  <td>{item.sku}</td>
                  <td>{item.product_name}</td>
                  <td><span className={`status-badge ${getStatusClass(item.itemStatus)}`}>{item.itemStatus}</span></td>
                  <td>{item.onHand}</td>
                  <td className={getHealthClass(item.monthsOfInventory, { low: 1, high: 3 })}>
                    {item.monthsOfInventory}
                  </td>
                  <td className={getHealthClass(item.onHandToSafetyStockPercent, { low: 50, high: 100 })}>
                    {item.onHandToSafetyStockPercent?.toFixed(0)}%
                  </td>
                  <td>${item.totalValue?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryHub;