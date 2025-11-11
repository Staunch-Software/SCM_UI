// src/components/Product360.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/Product360.css';

const DetailRow = ({ label, value }) => (
  <tr>
    <td>{label}</td>
    <td>{value ?? 'N/A'}</td>
  </tr>
);

const Product360 = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [productId]);

  const renderTabContent = () => {
    if (!product) return null;

    switch (activeTab) {
      case 'summary':
        return (
          <>
            <h3>Core Product Attributes</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="SKU" value={product.sku} />
                <DetailRow label="Product Name" value={product.product_name} />
                <DetailRow label="Description" value={product.itemDescription} />
                <DetailRow label="Item Type" value={product.itemType} />
                <DetailRow label="Procurement Type" value={product.procurementType} />
                <DetailRow label="Item Status" value={product.itemStatus} />
                <DetailRow label="UOM" value={product.uom} />
              </tbody>
            </table>
            <h3>Planning & Location Details</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="Planner/Buyer Code" value={product.PlannerCode || product.buyerCode} />
                <DetailRow label="Organization (Org)" value={product.org} />
                <DetailRow label="Location" value={product.location} />
              </tbody>
            </table>
            <h3>Current Inventory Levels</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="On Hand (Total)" value={product.onHand} />
                <DetailRow label="On Hand Nettable" value={product.onHandNettable} />
                <DetailRow label="On Hand Non-Nettable" value={product.onHandNonNettable} />
                <DetailRow label="ATP (Available to Promise)" value={product.atp} />
                <DetailRow label="Days in Stock" value={`${product.daysInStock} days`} />
                <DetailRow label="Stock Expiry" value={product.ohExpiry} />
                <DetailRow label="Total Value" value={`$${product.totalValue?.toLocaleString()}`} />
              </tbody>
            </table>
          </>
        );
      case 'demand':
        return (
          <>
            <h3>Demand Metrics Summary</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="Total Demand" value={product.totalDemand} />
                <DetailRow label="Average Monthly Demand" value={product.avgMonthlyDemand} />
                <DetailRow label="Forecast" value={product.forecast} />
                <DetailRow label="Dependent Demand" value={product.dependentDemand} />
                <DetailRow label="Open Sales Order Qty" value={product.salesOrder} />
              </tbody>
            </table>
            <h3>Open Sales Orders (Sales Order List)</h3>
            <table className="p360-table">
              <thead><tr><th>Sales Order</th></tr></thead>
              <tbody>
                {product.salesOrderList?.length > 0 ? product.salesOrderList.map((so, i) => (
                  <tr key={i}><td>{so}</td></tr>
                )) : <tr><td>No open sales orders</td></tr>}
              </tbody>
            </table>
          </>
        );
      case 'supply':
        return (
          <>
            {product.procurementType === 'Make' && (
              <>
                <h3>Work Orders</h3>
                <table className="p360-table">
                  <tbody>
                    <DetailRow label="Required WO Qty" value={product.requiredWoQty} />
                    <DetailRow label="Issued WO Qty" value={product.issuedWoQty} />
                    <DetailRow label="Open WO Qty" value={product.openWoQty} />
                  </tbody>
                </table>
                <h4>Work Order List</h4>
                <table className="p360-table">
                  <thead><tr><th>Work Order</th></tr></thead>
                  <tbody>
                    {product.workOrderList?.length > 0 ? product.workOrderList.map((wo, i) => (
                      <tr key={i}><td>{wo}</td></tr>
                    )) : <tr><td>No open work orders</td></tr>}
                  </tbody>
                </table>
              </>
            )}
            {product.procurementType === 'Buy' && (
              <>
                <h3>Purchase Orders</h3>
                <table className="p360-table">
                  <tbody>
                    <DetailRow label="Open PO Qty" value={product.openPoQty} />
                    <DetailRow label="PO In Receiving" value={product.poInReceiving} />
                  </tbody>
                </table>
                <h4>Purchase Order & Requisition Lists</h4>
                <table className="p360-table">
                  <thead><tr><th>Type</th><th>Reference</th></tr></thead>
                  <tbody>
                    {product.purchaseOrderList?.map((po, i) => <tr key={`po-${i}`}><td>Purchase Order</td><td>{po}</td></tr>)}
                    {product.purchaseRequisitionList?.map((pr, i) => <tr key={`pr-${i}`}><td>Purchase Requisition</td><td>{pr}</td></tr>)}
                    {product.poAcknowledgementList?.map((pa, i) => <tr key={`pa-${i}`}><td>PO Acknowledgement</td><td>{pa}</td></tr>)}
                  </tbody>
                </table>
              </>
            )}
            <h3>Internal & Inbound Supply</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="Internal Requisition" value={product.internalRequisition} />
                <DetailRow label="Transfer Order" value={product.transferOrder} />
                <DetailRow label="Requested Inbound Shipment" value={product.requestedInboundShipment} />
                <DetailRow label="Planned Inbound Shipment" value={product.plannedInboundShipment} />
                <DetailRow label="Intransit Shipments" value={product.intransitShipment} />
                <DetailRow label="Intransit Receipts" value={product.intransitReceipts} />
              </tbody>
            </table>
          </>
        );
      case 'analysis':
        return (
          <>
            <h3>Inventory Health & Status</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="Months Supply" value={`${product.monthsOfInventory} months`} />
                <DetailRow label="Excess" value={`${product.excess} units`} />
                <DetailRow label="Shortage" value={`${product.shortage} units`} />
              </tbody>
            </table>
            <h3>Safety Stock Analysis</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="Safety Stock" value={`${product.safetyStock} units`} />
                <DetailRow label="On Hand to Safety Stock (%)" value={`${product.onHandToSafetyStockPercent?.toFixed(0)}%`} />
              </tbody>
            </table>
            <h3>Consumption & Demand Trends</h3>
            <table className="p360-table">
              <tbody>
                <DetailRow label="Consumption 3M Avg" value={product.consumption3MAvg} />
                <DetailRow label="Consumption 12M Avg" value={product.consumption12MAvg} />
                <DetailRow label="Variance 12M to 3M" value={`${product.variance12MTo3M?.toFixed(1)}%`} />
              </tbody>
            </table>
          </>
        );
      case 'transactions':
        return (
          <>
            <h3>Recent Stock Movements</h3>
            <table className="p360-table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Quantity</th><th>Reference</th><th>Balance</th></tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td className={t.type === 'IN' ? 'trans-in' : 'trans-out'}>{t.type}</td>
                    <td>{t.type === 'IN' ? `+${t.quantity}` : `-${t.quantity}`}</td>
                    <td>{t.reference}</td>
                    <td>{t.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="p360-loading">Loading Product Details...</div>;
  if (error) return <div className="p360-error">Error: {error}</div>;
  if (!product) return <div className="p360-error">Product not found.</div>;

  return (
    <div className="product-360-page">
      <div className="p360-header">
        <Link to="/inventory-hub" className="back-link">← Back to Inventory Hub</Link>
        <div className="header-main-info">
          <h2>{product.product_name}</h2>
          <span className="p360-sku">{product.sku}</span>
        </div>
      </div>

      <div className="p360-metrics-strip">
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
      </div>

      <nav className="p360-tabs">
        <button onClick={() => setActiveTab('summary')} className={activeTab === 'summary' ? 'active' : ''}>Summary</button>
        <button onClick={() => setActiveTab('demand')} className={activeTab === 'demand' ? 'active' : ''}>Demand</button>
        <button onClick={() => setActiveTab('supply')} className={activeTab === 'supply' ? 'active' : ''}>Supply</button>
        <button onClick={() => setActiveTab('analysis')} className={activeTab === 'analysis' ? 'active' : ''}>Analysis & Health</button>
        {/* <button onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? 'active' : ''}>Transactions</button> */}
      </nav>

      <main className="p360-tab-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Product360;