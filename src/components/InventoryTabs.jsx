import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Package, ShoppingCart, Factory, 
  Truck, BarChart3, Target, Calendar, RefreshCw, Download
} from 'lucide-react';
import '../styles./InventoryTabs.css';

const InventoryTabs = ({ onProductClick }) => {
  const [activeTab, setActiveTab] = useState('demand');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [safetyStockPeriod, setSafetyStockPeriod] = useState('');
  const [forecastPeriod, setForecastPeriod] = useState('');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://odooerp.staunchtec.com/api/inventory-analysis');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setInventory(data);
      
      // Set initial periods
      const now = new Date();
      const currentMonth = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const currentYear = now.getFullYear();
      setSafetyStockPeriod(`${currentMonth} ${currentYear}`);
      setForecastPeriod(`${currentMonth} ${currentYear}`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSafetyStockPeriod = async (fromMonth, fromYear, toMonth, toYear) => {
    try {
      const response = await fetch(`https://odooerp.staunchtec.com/api/safety-stock-data/${fromYear}/${fromMonth}/${toYear}/${toMonth}`);
      if (!response.ok) throw new Error('Failed to fetch safety stock');
      const data = await response.json();
      
      setInventory(prev =>
        prev.map(item => ({
          ...item,
          safetyStock: data.averages[item.product_id] || 0
        }))
      );
      
      const shortMonth = (m) => m.slice(0, 3).toUpperCase();
      const isSame = fromMonth === toMonth && fromYear === toYear;
      setSafetyStockPeriod(
        isSame 
          ? `${shortMonth(fromMonth)} ${fromYear}`
          : `${shortMonth(fromMonth)} ${fromYear} - ${shortMonth(toMonth)} ${toYear}`
      );
    } catch (error) {
      console.error('Error updating safety stock:', error);
    }
  };

  const updateForecastPeriod = async (fromMonth, fromYear, toMonth, toYear) => {
    try {
      const response = await fetch(`https://odooerp.staunchtec.com/api/forecast-data/${fromYear}/${fromMonth}/${toYear}/${toMonth}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      const data = await response.json();
      
      setInventory(prev =>
        prev.map(item => ({
          ...item,
          forecast: data.averages[item.product_id] || 0
        }))
      );
      
      const shortMonth = (m) => m.slice(0, 3).toUpperCase();
      const isSame = fromMonth === toMonth && fromYear === toYear;
      setForecastPeriod(
        isSame 
          ? `${shortMonth(fromMonth)} ${fromYear}`
          : `${shortMonth(fromMonth)} ${fromYear} - ${shortMonth(toMonth)} ${toYear}`
      );
    } catch (error) {
      console.error('Error updating forecast:', error);
    }
  };

  if (loading) {
    return (
      <div className="tabs-loading">
        <div className="spinner"></div>
        <p>Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="inventory-tabs-container">
      <nav className="tabs-nav">
        <button
          className={`tab-button ${activeTab === 'demand' ? 'active' : ''}`}
          onClick={() => setActiveTab('demand')}
        >
          <BarChart3 size={18} />
          <span>Demand Planning</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'supply' ? 'active' : ''}`}
          onClick={() => setActiveTab('supply')}
        >
          <Truck size={18} />
          <span>Supply Planning</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <Target size={18} />
          <span>Inventory Analysis</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'forecasting' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecasting')}
        >
          <Calendar size={18} />
          <span>Forecasting & Safety Stock</span>
        </button>
      </nav>

      <div className="tab-content">
        {activeTab === 'demand' && (
          <DemandPlanning 
            inventory={inventory} 
            onProductClick={onProductClick}
            forecastPeriod={forecastPeriod}
            safetyStockPeriod={safetyStockPeriod}
            onUpdateForecast={updateForecastPeriod}
            onUpdateSafety={updateSafetyStockPeriod}
            setShowForecastModal={setShowForecastModal}
            setShowSafetyModal={setShowSafetyModal}
          />
        )}
        {activeTab === 'supply' && (
          <SupplyPlanning inventory={inventory} onProductClick={onProductClick} />
        )}
        {activeTab === 'analysis' && (
          <InventoryAnalysis inventory={inventory} onProductClick={onProductClick} />
        )}
        {activeTab === 'forecasting' && (
          <ForecastingTab 
            inventory={inventory} 
            onProductClick={onProductClick}
            forecastPeriod={forecastPeriod}
            safetyStockPeriod={safetyStockPeriod}
            onUpdateForecast={updateForecastPeriod}
            onUpdateSafety={updateSafetyStockPeriod}
          />
        )}
      </div>

      {/* Modals would go here if needed */}
    </div>
  );
};

/* ========================================
   DEMAND PLANNING TAB
   ======================================== */
const DemandPlanning = ({ inventory, onProductClick, forecastPeriod, safetyStockPeriod }) => {
  const demandMetrics = {
    avgDemand: inventory.reduce((sum, item) => sum + (item.avgMonthlyDemand || 0), 0),
    totalForecast: inventory.reduce((sum, item) => sum + (item.forecast || 0), 0),
    salesOrders: inventory.reduce((sum, item) => sum + (item.salesOrder || 0), 0),
    dependentDemand: inventory.reduce((sum, item) => sum + (item.dependentDemand || 0), 0)
  };

  return (
    <div className="tab-panel">
      <div className="metrics-row">
        <MetricCard title="Avg Demand/Month" value={demandMetrics.avgDemand.toLocaleString()} icon={<BarChart3 />} />
        <MetricCard title="Total Forecast (30 Days)" value={demandMetrics.totalForecast.toLocaleString()} icon={<TrendingUp />} />
        <MetricCard title="Sales Orders (Open)" value={demandMetrics.salesOrders.toLocaleString()} icon={<ShoppingCart />} />
        <MetricCard title="Dependent Demand" value={demandMetrics.dependentDemand.toLocaleString()} icon={<Package />} />
      </div>

      <div className="data-table-wrapper">
        <div className="table-toolbar">
          <h3>Demand Planning - All Products</h3>
          <div className="toolbar-actions">
            <button className="btn-secondary">
              <Download size={16} />
              Export
            </button>
            <button className="btn-primary">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="planning-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Avg Demand/Mo</th>
                <th>Forecast ({forecastPeriod})</th>
                <th>Safety Stock ({safetyStockPeriod})</th>
                <th>Sales Order</th>
                <th>Dependent Demand</th>
                <th>Total Demand</th>
                <th>On Hand</th>
                <th>Months Inventory</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const monthsInventory = item.avgMonthlyDemand > 0 
                  ? (item.onHand / item.avgMonthlyDemand).toFixed(1)
                  : 0;

                return (
                  <tr key={item.product_id} onClick={() => onProductClick(item.product_id)}>
                    <td className="col-sku">{item.sku}</td>
                    <td className="col-name">{item.product_name}</td>
                    <td>
                      <span className={`badge badge-type-${item.itemType.toLowerCase().replace(' ', '-')}`}>
                        {item.itemType}
                      </span>
                    </td>
                    <td>{item.avgMonthlyDemand || 0}</td>
                    <td className="font-bold">{item.forecast || 0}</td>
                    <td>{item.safetyStock || 0}</td>
                    <td>{item.salesOrder || 0}</td>
                    <td>{item.dependentDemand || 0}</td>
                    <td className="font-bold">{item.totalDemand || 0}</td>
                    <td>{item.onHand || 0}</td>
                    <td>
                      <span className={`supply-badge ${monthsInventory > 6 ? 'excess' : monthsInventory > 3 ? 'warning' : 'healthy'}`}>
                        {monthsInventory}M
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ========================================
   SUPPLY PLANNING TAB
   ======================================== */
const SupplyPlanning = ({ inventory, onProductClick }) => {
  const supplyMetrics = {
    workOrders: inventory.reduce((sum, item) => sum + (item.workOrderCount || 0), 0),
    workOrderQty: inventory.reduce((sum, item) => sum + (item.workOrderQty || 0), 0),
    purchaseOrders: inventory.reduce((sum, item) => sum + (item.purchaseOrderCount || 0), 0),
    purchaseOrderQty: inventory.reduce((sum, item) => sum + (item.purchaseOrderQty || 0), 0)
  };

  return (
    <div className="tab-panel">
      <div className="metrics-row">
        <MetricCard title="Work Orders" value={supplyMetrics.workOrders} icon={<Factory />} />
        <MetricCard title="WO Quantity" value={supplyMetrics.workOrderQty.toLocaleString()} icon={<Package />} />
        <MetricCard title="Purchase Orders" value={supplyMetrics.purchaseOrders} icon={<ShoppingCart />} />
        <MetricCard title="PO Quantity" value={supplyMetrics.purchaseOrderQty.toLocaleString()} icon={<Truck />} />
      </div>

      <div className="data-table-wrapper">
        <div className="table-toolbar">
          <h3>Supply Planning - All Products</h3>
          <div className="toolbar-actions">
            <button className="btn-secondary">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="planning-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Procurement</th>
                <th>On Hand</th>
                <th>WO Count</th>
                <th>WO Qty</th>
                <th>PO Count</th>
                <th>PO Qty</th>
                <th>Total Supply</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.product_id} onClick={() => onProductClick(item.product_id)}>
                  <td className="col-sku">{item.sku}</td>
                  <td className="col-name">{item.product_name}</td>
                  <td>
                    <span className={`badge badge-type-${item.itemType.toLowerCase().replace(' ', '-')}`}>
                      {item.itemType}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-procurement-${item.procurementType.toLowerCase()}`}>
                      {item.procurementType}
                    </span>
                  </td>
                  <td className="font-bold">{item.onHand || 0}</td>
                  <td>{item.workOrderCount || 0}</td>
                  <td>{item.workOrderQty || 0}</td>
                  <td>{item.purchaseOrderCount || 0}</td>
                  <td>{item.purchaseOrderQty || 0}</td>
                  <td className="font-bold">{(item.workOrderQty || 0) + (item.purchaseOrderQty || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ========================================
   INVENTORY ANALYSIS TAB
   ======================================== */
const InventoryAnalysis = ({ inventory, onProductClick }) => {
  const excessItems = inventory.filter(item => item.excess > 0);
  const shortageItems = inventory.filter(item => item.shortage > 0);
  const totalExcessValue = excessItems.reduce((sum, item) => sum + (item.excess * item.costPerUnit), 0);
  const totalShortageValue = shortageItems.reduce((sum, item) => sum + (item.shortage * item.costPerUnit), 0);

  return (
    <div className="tab-panel">
      <div className="metrics-row">
        <MetricCard title="Excess Items" value={excessItems.length} icon={<AlertTriangle />} />
        <MetricCard title="Excess Value" value={`$${totalExcessValue.toLocaleString()}`} icon={<TrendingDown />} />
        <MetricCard title="Shortage Items" value={shortageItems.length} icon={<AlertTriangle />} />
        <MetricCard title="Shortage Value" value={`$${totalShortageValue.toLocaleString()}`} icon={<TrendingUp />} />
      </div>

      <div className="data-table-wrapper">
        <div className="table-toolbar">
          <h3>Excess Stock Analysis</h3>
        </div>
        <div className="table-scroll">
          <table className="planning-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>On Hand</th>
                <th>Excess Qty</th>
                <th>Cost/Unit</th>
                <th>Excess Value</th>
                <th>Days in Stock</th>
              </tr>
            </thead>
            <tbody>
              {excessItems.map(item => (
                <tr key={item.product_id} onClick={() => onProductClick(item.product_id)}>
                  <td className="col-sku">{item.sku}</td>
                  <td className="col-name">{item.product_name}</td>
                  <td>{item.onHand}</td>
                  <td className="text-warning font-bold">{item.excess}</td>
                  <td>${item.costPerUnit.toFixed(2)}</td>
                  <td className="text-warning font-bold">${(item.excess * item.costPerUnit).toLocaleString()}</td>
                  <td>{item.daysInStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="data-table-wrapper" style={{ marginTop: '24px' }}>
        <div className="table-toolbar">
          <h3>Shortage Analysis</h3>
        </div>
        <div className="table-scroll">
          <table className="planning-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>On Hand</th>
                <th>Shortage Qty</th>
                <th>Cost/Unit</th>
                <th>Shortage Value</th>
                <th>Safety Stock</th>
              </tr>
            </thead>
            <tbody>
              {shortageItems.map(item => (
                <tr key={item.product_id} onClick={() => onProductClick(item.product_id)}>
                  <td className="col-sku">{item.sku}</td>
                  <td className="col-name">{item.product_name}</td>
                  <td>{item.onHand}</td>
                  <td className="text-danger font-bold">{item.shortage}</td>
                  <td>${item.costPerUnit.toFixed(2)}</td>
                  <td className="text-danger font-bold">${(item.shortage * item.costPerUnit).toLocaleString()}</td>
                  <td>{item.safetyStock || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ========================================
   FORECASTING TAB
   ======================================== */
const ForecastingTab = ({ inventory, onProductClick, forecastPeriod, safetyStockPeriod }) => {
  return (
    <div className="tab-panel">
      <div className="forecast-header">
        <h2>Forecasting & Safety Stock Management</h2>
      </div>

      <div className="data-table-wrapper">
        <div className="table-toolbar">
          <h3>All Products - Forecast & Safety Stock</h3>
          <div className="toolbar-actions">
            <button className="btn-secondary">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="planning-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>On Hand</th>
                <th>Avg Demand</th>
                <th>Forecast ({forecastPeriod})</th>
                <th>Safety Stock ({safetyStockPeriod})</th>
                <th>Total Demand</th>
                <th>Excess</th>
                <th>Shortage</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.product_id} onClick={() => onProductClick(item.product_id)}>
                  <td className="col-sku">{item.sku}</td>
                  <td className="col-name">{item.product_name}</td>
                  <td>
                    <span className={`badge badge-type-${item.itemType.toLowerCase().replace(' ', '-')}`}>
                      {item.itemType}
                    </span>
                  </td>
                  <td className="font-bold">{item.onHand || 0}</td>
                  <td>{item.avgMonthlyDemand || 0}</td>
                  <td className="font-bold">{item.forecast || 0}</td>
                  <td className="font-bold">{item.safetyStock || 0}</td>
                  <td>{item.totalDemand || 0}</td>
                  <td className={item.excess > 0 ? 'text-warning font-bold' : ''}>
                    {item.excess > 0 ? item.excess : '-'}
                  </td>
                  <td className={item.shortage > 0 ? 'text-danger font-bold' : ''}>
                    {item.shortage > 0 ? item.shortage : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon }) => (
  <div className="metric-card">
    <div className="metric-icon">{icon}</div>
    <div className="metric-content">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
    </div>
  </div>
);

export default InventoryTabs;