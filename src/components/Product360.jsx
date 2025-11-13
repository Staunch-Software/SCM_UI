import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/Product360.css';

const Product360 = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('product-info');

  // Forecast state
  const [forecastRange, setForecastRange] = useState({ from: 'November', fromYear: '2025', to: 'November', toYear: '2026' });
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Safety Stock state
  const [safetyStockRange, setSafetyStockRange] = useState({ from: 'November', fromYear: '2025', to: 'November', toYear: '2026' });
  const [safetyStockData, setSafetyStockData] = useState([]);
  const [safetyStockLoading, setSafetyStockLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerType, setPickerType] = useState(null);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [salesOrdersData, setSalesOrdersData] = useState([]);
  const [workOrdersData, setWorkOrdersData] = useState([]);  // ADD THIS
  const [purchaseOrdersData, setPurchaseOrdersData] = useState([]);  // ADD THIS

  useEffect(() => {
    if (!productId) return;
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const [detailsRes, transRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/product-details/${productId}`),
          fetch(`http://127.0.0.1:8000/api/transactions/${productId}`)
        ]);
        if (!detailsRes.ok) throw new Error('Failed to fetch product details');
        if (!transRes.ok) throw new Error('Failed to fetch transactions');
        const detailsData = await detailsRes.json();
        const transData = await transRes.json();
        setProduct(detailsData);
        setTransactions(transData);
        const [soRes, woRes, poRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/sales-orders-by-product/${productId}`),
          fetch(`http://127.0.0.1:8000/api/work-orders-by-product/${productId}`),
          fetch(`http://127.0.0.1:8000/api/purchase-orders-by-product/${productId}`)
        ]);
        const soData = await soRes.json();
        const woData = await woRes.json();
        const poData = await poRes.json();
        setSalesOrdersData(soData);
        setWorkOrdersData(woData);
        setPurchaseOrdersData(poData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [productId]);

  useEffect(() => {
    if (activeTab === 'forecast') {
      fetchForecastData();
    }
  }, [activeTab, forecastRange]);

  useEffect(() => {
    if (activeTab === 'safety-stock') {
      fetchSafetyStockData();
    }
  }, [activeTab, safetyStockRange]);

  const fetchForecastData = async () => {
    try {
      setForecastLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/api/forecast-data/${forecastRange.fromYear}/${forecastRange.from}/${forecastRange.toYear}/${forecastRange.to}`);
      const data = await res.json();
      const details = data.details[productId] || {};
      const chartData = Object.keys(details).map(key => ({
        month: key,
        value: details[key] || 0
      }));
      setForecastData(chartData);
    } catch (err) {
      console.error('Error fetching forecast:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchSafetyStockData = async () => {
    try {
      setSafetyStockLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/api/safety-stock-data/${safetyStockRange.fromYear}/${safetyStockRange.from}/${safetyStockRange.toYear}/${safetyStockRange.to}`);
      const data = await res.json();
      const details = data.details[productId] || {};
      const chartData = Object.keys(details).map(key => ({
        month: key,
        value: details[key] || 0
      }));
      setSafetyStockData(chartData);
    } catch (err) {
      console.error('Error fetching safety stock:', err);
    } finally {
      setSafetyStockLoading(false);
    }
  };

  const openDatePicker = (type) => {
    setPickerType(type);
    setShowDatePicker(true);
  };

  const handleDateSelect = (field, value) => {
    if (pickerType === 'forecast') {
      setForecastRange(prev => ({ ...prev, [field]: value }));
    } else {
      setSafetyStockRange(prev => ({ ...prev, [field]: value }));
    }
  };

  if (loading) return <div className="p360-loading">Loading Product Details...</div>;
  if (error) return <div className="p360-error">Error: {error}</div>;
  if (!product) return <div className="p360-error">Product not found.</div>;

  const isFinishedGoods = product.itemType === 'Finished goods';
  const isSubAssemblyWithBOM = product.itemType === 'Sub assembly' && product.hasBOM;
  const isSubAssemblyWithoutBOM = product.itemType === 'Sub assembly' && !product.hasBOM;
  const isRawMaterial = product.itemType === 'Raw material';

  const DetailRow = ({ label, value }) => (
    <tr className="detail-row animated-row">
      <td className="detail-label">{label}:</td>
      <td className="detail-value">{value ?? 'N/A'}</td>
    </tr>
  );

  const renderProductInfo = () => (
    <div className="p360-tab-content">
      <h3>Product Information</h3>
      <table className="p360-table">
        <tbody className="animated-tbody">
          <DetailRow label="SKU" value={product.sku} />
          <DetailRow label="Product Name" value={product.product_name} />
          <DetailRow label="Item Type" value={product.itemType} />
          <DetailRow label="Item Status" value={product.itemStatus} />
          <DetailRow label={isFinishedGoods || isSubAssemblyWithBOM ? "Planner Code" : "Buyer Code"} value={product.plannerCode || product.buyerCode} />
          <DetailRow label="Organization" value={product.org} />
          <DetailRow label="UOM" value={product.uom} />
          <DetailRow label="Location" value={product.location} />
        </tbody>
      </table>
    </div>
  );

  const renderDemand = () => {
    if (isFinishedGoods) {
      return (
        <div className="p360-tab-content">
          <h3>Demand metrics summary</h3>
          <table className="p360-table">
            <tbody className="animated-tbody">
              <DetailRow label="Sales Orders Qty" value={product.salesOrderQty} />
              <DetailRow label="Forecast" value={product.forecast} />
              <DetailRow label="Safety Stock" value={product.safetyStock} />
              <DetailRow label="Total Demand" value={product.totalDemand} />
              <DetailRow label="Avg Monthly Demand" value={product.avgMonthlyDemand} />
            </tbody>
          </table>
          <h3>Sales orders line</h3>
          <table className="p360-table">
            <thead><tr className="animated-row"><th>Orders</th><th>Products</th><th>Order date</th><th>Customers</th></tr></thead>
            <tbody className="animated-tbody">
              {salesOrdersData.map((so, i) => (
                <tr key={i} className="animated-row">
                  <td>{so.sales_order_id}</td>
                  <td>{so.product_name}</td>
                  <td>{so.order_date}</td>
                  <td>{so.customer_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (isSubAssemblyWithBOM) {
      return (
        <div className="p360-tab-content">
          <h3>Demand metrics summary</h3>
          <table className="p360-table">
            <tbody className="animated-tbody">
              <DetailRow label="Forecast" value={product.forecast} />
              <DetailRow label="Safety Stock" value={product.safetyStock} />
              <DetailRow label="Total Demand" value={product.totalDemand} />
              <DetailRow label="Avg Monthly Demand" value={product.avgMonthlyDemand} />
            </tbody>
          </table>
        </div>
      );
    }

    if (isSubAssemblyWithoutBOM || isRawMaterial) {
      return (
        <div className="p360-tab-content">
          <h3>Demand metrics summary</h3>
          <table className="p360-table">
            <tbody className="animated-tbody">
              <DetailRow label="Dependent Demand" value={product.dependentDemand} />
              <DetailRow label="Forecast" value={product.forecast} />
              <DetailRow label="Safety Stock" value={product.safetyStock} />
              <DetailRow label="Total Demand" value={product.totalDemand} />
              <DetailRow label="Avg Monthly Demand" value={product.avgMonthlyDemand} />
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="p360-tab-content">No demand data for this product type.</div>;
  };

  const renderSupply = () => (
    <div className="p360-tab-content">
      {(isFinishedGoods || isSubAssemblyWithBOM) && (
        <>
          <h3>Work Orders</h3>
          <table className="p360-table">
            <tbody className="animated-tbody">
              {/* <DetailRow label="Work Order" value={product.workOrderList?.join(', ') || 'None'} /> */}
              <DetailRow label="Required WO Qty" value={product.requiredWoQty} />
              <DetailRow label="Issued WO Qty" value={product.issuedWoQty} />
              <DetailRow label="Open WO Qty" value={product.openWoQty} />
            </tbody>
          </table>
          <h3>Work Orders Lines</h3>
          <table className="p360-table">
            <thead>
              <tr className="animated-row">
                <th>Orders</th>
                <th>Planned Orders</th>
                <th>Quantity</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="animated-tbody">
              {workOrdersData.map((wo, i) => (
                <tr key={i} className="animated-row">
                  <td>{wo.mo_id}</td>
                  <td>{wo.planned_order_id}</td>
                  <td>{wo.quantity_to_produce}</td>
                  <td>{wo.start_date}</td>
                  <td>{wo.end_date}</td>
                  <td>{wo.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>

      )}

      {(isRawMaterial || isSubAssemblyWithoutBOM) && (
        <>
          <h3>Purchase Orders</h3>
          <table className="p360-table">
            <tbody className="animated-tbody">
              <DetailRow label="Open PO Qty" value={product.openPoQty} />
              {/* <DetailRow label="Purchase Order (PO)" value={product.purchaseOrderList?.join(', ') || 'None'} /> */}
              <DetailRow label="Purchase Requisition (PR)" value={product.purchaseRequisitionList?.join(', ') || 'None'} />
              <DetailRow label="PO In Receiving" value={product.poInReceiving} />
              <DetailRow label="PO Acknowledgement" value={Array.isArray(product.poAcknowledgementList) ? product.poAcknowledgementList.join(', ') : (product.poAcknowledgementList || 'None')} />
            </tbody>
          </table>
          <h3>Purchase Orders Lines</h3>
          <table className="p360-table">
            <thead>
              <tr className="animated-row">
                <th>Orders</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="animated-tbody">
              {purchaseOrdersData.map((po, i) => (
                <tr key={i} className="animated-row">
                  <td>{po.po_id}</td>
                  <td>{po.supplier_name}</td>
                  <td>{po.order_date}</td>
                  <td>{po.expected_arrival_date}</td>
                  <td>{po.quantity}</td>
                  <td>{po.unit_price?.toFixed(2)}</td>
                  <td>{po.total_amount?.toFixed(2)}</td>
                  <td>{po.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Inbound Flow</h3>
          <div className="flow-container">
            <div className="flow-column">
              <h4>Supplier → Warehouse</h4>
              <table className="p360-table">
                <tbody className="animated-tbody">
                  <DetailRow label="Requested Inbound Shipment" value={product.requestedInboundShipment} />
                  <DetailRow label="Planned Inbound Shipment" value={product.plannedInboundShipment} />
                  <DetailRow label="Intransit Shipment" value={product.intransitShipment} />
                  <DetailRow label="Intransit Receipts" value={product.intransitReceipts} />
                </tbody>
              </table>
            </div>
            <div className="flow-column">
              <h4>Warehouse ↔ Warehouse</h4>
              <table className="p360-table">
                <tbody className="animated-tbody">
                  <DetailRow label="Internal Requisition" value={product.internalRequisition} />
                  <DetailRow label="Transfer Order" value={product.transferOrder} />
                  <DetailRow label="Intransit Shipment" value={product.intransitShipment} />
                  <DetailRow label="Intransit Receipts" value={product.intransitReceipts} />
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isSubAssemblyWithBOM && (
        <>
          <h3>Internal Transfers</h3>
          <table className="p360-table">
            <tbody className="animated-tbody">
              <DetailRow label="Internal Requisition" value={product.internalRequisition} />
              <DetailRow label="Intransit Shipment" value={product.intransitShipment} />
              <DetailRow label="Intransit Receipts" value={product.intransitReceipts} />
              <DetailRow label="Transfer Order" value={product.transferOrder} />
            </tbody>
          </table>
        </>
      )}
      <h3>Inventory Metrics</h3>
      <table className="p360-table">
        <tbody className="animated-tbody">
          <DetailRow label="On Hand (Total)" value={product.onHandNettable + product.onHandNonNettable || 0} />
          <DetailRow label="On Hand Nettable" value={product.onHandNettable} />
          <DetailRow label="Month Supply (Nettable)" value={product.monthsSupplyNettable} />
          <DetailRow label="On Hand Non-Nettable" value={product.onHandNonNettable} />
          <DetailRow label="Month Supply (Non-Nettable)" value={product.monthsSupplyNonNettable} />
          <DetailRow label="ATP (Available to Promise)" value={product.atp} />
        </tbody>
      </table>
    </div>
  );

  const renderAnalysesHealth = () => (
    <div className="p360-tab-content">
      <h3>Inventory Health & Status</h3>
      <table className="p360-table">
        <tbody className="animated-tbody">
          <DetailRow label="Months Supply" value={product.monthsOfInventory} />
          <DetailRow label="Excess" value={product.excess} />
          <DetailRow label="Shortage" value={product.shortage} />
          <DetailRow label="Days in Stock" value={product.daysInStock} />
          <DetailRow label="OH - Expiry" value={product.ohExpiry} />
        </tbody>
      </table>

      <h3>Safety Stock Analysis</h3>
      <table className="p360-table">
        <tbody className="animated-tbody">
          <DetailRow label="On Hand to Safety Stock %" value={`${product.onHandToSafetyStockPercent?.toFixed(0)}%`} />
        </tbody>
      </table>

      <h3>Consumption & Demand Analysis</h3>
      <table className="p360-table">
        <tbody className="animated-tbody">
          <DetailRow label="Consumption 3M Avg" value={product.consumption3MAvg} />
          <DetailRow label="Consumption 12M Avg" value={product.consumption12MAvg} />
          <DetailRow label="Variance 12M to 3M %" value={`${product.variance12MTo3M?.toFixed(1)}%`} />
        </tbody>
      </table>
    </div>
  );

  const renderTransactions = () => (
    <div className="p360-tab-content">
      <h3>Recent Stock Movements</h3>
      <table className="p360-table transactions-table">
        <thead>
          <tr className="animated-row">
            <th>Date</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Reference</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody className="animated-tbody">
          {transactions.map((t, i) => (
            <tr key={i} className="animated-row">
              <td>{t.date}</td>
              <td className={t.type === 'IN' ? 'trans-in' : 'trans-out'}>{t.type}</td>
              <td>{t.type === 'IN' ? `+${t.quantity}` : `-${t.quantity}`}</td>
              <td>{t.reference}</td>
              <td>{t.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderForecast = () => {
    const currentRange = forecastRange;
    return (
      <div className="p360-tab-content">
        <div className="date-picker-card">
          <h3>Forecast range</h3>
          <p className="date-picker-subtitle">Select a forecast range</p>
          <div className="date-display" onClick={() => openDatePicker('forecast')}>
            <Calendar size={20} />
            <span>{currentRange.from} {currentRange.fromYear} - {currentRange.to} {currentRange.toYear}</span>
          </div>
        </div>

        {showDatePicker && pickerType === 'forecast' && (
          <div className="date-picker-modal">
            <div className="date-picker-content">
              <div className="picker-section">
                <label>From</label>
                <select value={currentRange.from} onChange={(e) => handleDateSelect('from', e.target.value)}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={currentRange.fromYear} onChange={(e) => handleDateSelect('fromYear', e.target.value)}>
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="picker-section">
                <label>To</label>
                <select value={currentRange.to} onChange={(e) => handleDateSelect('to', e.target.value)}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={currentRange.toYear} onChange={(e) => handleDateSelect('toYear', e.target.value)}>
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={() => setShowDatePicker(false)} className="picker-close">Done</button>
            </div>
          </div>
        )}

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#2563eb" fill="url(#colorForecast)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="data-table-section">
          <h3>Monthly Forecast Values</h3>
          <table className="p360-table">
            <thead>
              <tr className="animated-row">
                <th>Month</th>
                <th>Forecast</th>
              </tr>
            </thead>
            <tbody className="animated-tbody">
              {forecastData.map((item, i) => (
                <tr key={i} className="animated-row">
                  <td>{item.month}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSafetyStock = () => {
    const currentRange = safetyStockRange;
    return (
      <div className="p360-tab-content">
        <div className="date-picker-card">
          <h3>Safety stock range</h3>
          <p className="date-picker-subtitle">Select a safety stock range</p>
          <div className="date-display" onClick={() => openDatePicker('safety-stock')}>
            <Calendar size={20} />
            <span>{currentRange.from} {currentRange.fromYear} - {currentRange.to} {currentRange.toYear}</span>
          </div>
        </div>

        {showDatePicker && pickerType === 'safety-stock' && (
          <div className="date-picker-modal">
            <div className="date-picker-content">
              <div className="picker-section">
                <label>From</label>
                <select value={currentRange.from} onChange={(e) => handleDateSelect('from', e.target.value)}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={currentRange.fromYear} onChange={(e) => handleDateSelect('fromYear', e.target.value)}>
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="picker-section">
                <label>To</label>
                <select value={currentRange.to} onChange={(e) => handleDateSelect('to', e.target.value)}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={currentRange.toYear} onChange={(e) => handleDateSelect('toYear', e.target.value)}>
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={() => setShowDatePicker(false)} className="picker-close">Done</button>
            </div>
          </div>
        )}

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={safetyStockData}>
              <defs>
                <linearGradient id="colorSafetyStock" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#16a34a" fill="url(#colorSafetyStock)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="data-table-section">
          <h3>Monthly Safety Stock Values</h3>
          <table className="p360-table">
            <thead>
              <tr className="animated-row">
                <th>Month</th>
                <th>Safety Stock</th>
              </tr>
            </thead>
            <tbody className="animated-tbody">
              {safetyStockData.map((item, i) => (
                <tr key={i} className="animated-row">
                  <td>{item.month}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="product-360-page">
      <div className="p360-header">
        <Link to="/inventory-hub" className="back-link">←</Link>
        <div className="header-main-info">
          <h2>{product.product_name} - {product.sku}</h2>
          <p className="item-desc">{product.itemDescription || 'N/A'}</p>
        </div>
      </div>

      {/* <div className="p360-metrics-strip">
        <div className="metric-card">
          <div className="metric-title">On Hand</div>
          <div className="metric-value">{product.onHand}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">ATP</div>
          <div className="metric-value">{product.atp}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Days in Stock</div>
          <div className="metric-value">{product.daysInStock}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Months Supply</div>
          <div className="metric-value">{product.monthsOfInventory}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Value</div>
          <div className="metric-value">${product.totalValue?.toLocaleString()}</div>
        </div>
      </div> */}

      <nav className="p360-tabs">
        <button onClick={() => setActiveTab('product-info')} className={activeTab === 'product-info' ? 'active' : ''}>Product Information</button>
        <button onClick={() => setActiveTab('demand')} className={activeTab === 'demand' ? 'active' : ''}>Demand</button>
        <button onClick={() => setActiveTab('supply')} className={activeTab === 'supply' ? 'active' : ''}>Supply</button>
        <button onClick={() => setActiveTab('analyses-health')} className={activeTab === 'analyses-health' ? 'active' : ''}>Analyses & Health</button>
        <button onClick={() => setActiveTab('forecast')} className={activeTab === 'forecast' ? 'active' : ''}>Forecast</button>
        <button onClick={() => setActiveTab('safety-stock')} className={activeTab === 'safety-stock' ? 'active' : ''}>Safety Stock</button>
        <button onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? 'active' : ''}>Transactions</button>
      </nav>

      <main>
        {activeTab === 'product-info' && renderProductInfo()}
        {activeTab === 'demand' && renderDemand()}
        {activeTab === 'supply' && renderSupply()}
        {activeTab === 'analyses-health' && renderAnalysesHealth()}
        {activeTab === 'forecast' && renderForecast()}
        {activeTab === 'safety-stock' && renderSafetyStock()}
        {activeTab === 'transactions' && renderTransactions()}
      </main>
    </div>
  );
};

export default Product360;