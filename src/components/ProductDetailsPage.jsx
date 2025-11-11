import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import './ProductDetailsPage.css';

const ProductDetailsPage = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('work-orders');

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://odooerp.staunchtec.com/api/product-details/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product details');
      const data = await response.json();
      setProduct(data);
      
      // Set default tab based on item type
      if (data.itemType === 'Finished goods') {
        setActiveTab('work-orders');
      } else if (data.itemType === 'Raw material') {
        setActiveTab('purchase-orders');
      } else if (data.itemType === 'Sub assembly') {
        setActiveTab(data.hasBOM ? 'work-orders' : 'purchase-orders');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  if (!productId) return null;

  const isFinishedGoods = product?.itemType === 'Finished goods';
  const isRawMaterial = product?.itemType === 'Raw material';
  const isSubAssemblyWithBOM = product?.itemType === 'Sub assembly' && product?.hasBOM;
  const isSubAssemblyWithoutBOM = product?.itemType === 'Sub assembly' && !product?.hasBOM;

  const showWorkOrders = isFinishedGoods || isSubAssemblyWithBOM;
  const showPurchaseOrders = isRawMaterial || isSubAssemblyWithoutBOM;
  const showSalesOrders = isFinishedGoods;

  return (
    <div className="product-details-overlay" onClick={onClose}>
      <div className="product-details-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="details-header">
          <div className="header-info">
            <h2>{loading ? 'Loading...' : product?.itemDescription || 'Product Details'}</h2>
            <div className="header-meta">
              {!loading && product && (
                <>
                  <span className="meta-badge">{product.plannerCode || product.buyerCode || 'N/A'}</span>
                  <span>•</span>
                  <span>Org: {product.org || 'N/A'}</span>
                  <span>•</span>
                  <span>UOM: {product.uom || 'N/A'}</span>
                </>
              )}
            </div>
          </div>
          <button className="btn-close-details" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="details-content">
          {loading && (
            <div className="details-loading">
              <div className="loading-spinner"></div>
              <p>Loading product details...</p>
            </div>
          )}

          {error && (
            <div className="details-error">
              <AlertCircle size={48} color="#dc2626" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && product && (
            <>
              {/* Tabs */}
              <div className="details-tabs">
                {showWorkOrders && (
                  <button
                    className={`details-tab ${activeTab === 'work-orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('work-orders')}
                  >
                    Work Orders
                  </button>
                )}
                {showSalesOrders && (
                  <button
                    className={`details-tab ${activeTab === 'sales-orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales-orders')}
                  >
                    Sales Orders
                  </button>
                )}
                {showPurchaseOrders && (
                  <button
                    className={`details-tab ${activeTab === 'purchase-orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('purchase-orders')}
                  >
                    Purchase Orders
                  </button>
                )}
                <button
                  className={`details-tab ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inventory')}
                >
                  Inventory Quantities
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content-area">
                {activeTab === 'work-orders' && showWorkOrders && (
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>FIELD</th>
                        <th>VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Work Orders</td>
                        <td>{product.workOrderList?.join(', ') || 'None'}</td>
                      </tr>
                      <tr>
                        <td>Required WO Qty</td>
                        <td>{product.requiredWoQty || 0}</td>
                      </tr>
                      <tr>
                        <td>Issued WO Qty</td>
                        <td>{product.issuedWoQty || 0}</td>
                      </tr>
                      <tr>
                        <td>Open WO Qty</td>
                        <td>{product.openWoQty || 0}</td>
                      </tr>
                      {isSubAssemblyWithBOM && (
                        <>
                          <tr>
                            <td>Internal Requisition</td>
                            <td>{product.internalRequisition || 0}</td>
                          </tr>
                          <tr>
                            <td>Intransit Shipment</td>
                            <td>{product.intransitShipment || 0}</td>
                          </tr>
                          <tr>
                            <td>Intransit Receipts</td>
                            <td>{product.intransitReceipts || 0}</td>
                          </tr>
                          <tr>
                            <td>Transfer Order</td>
                            <td>{product.transferOrder || 'N/A'}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'sales-orders' && showSalesOrders && (
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>FIELD</th>
                        <th>VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Sales Order Qty</td>
                        <td>{product.salesOrderQty || 0}</td>
                      </tr>
                      <tr>
                        <td>Sales Orders</td>
                        <td>{product.salesOrderList?.join(', ') || 'None'}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {activeTab === 'purchase-orders' && showPurchaseOrders && (
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>FIELD</th>
                        <th>VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Open PO Qty</td>
                        <td>{product.openPoQty || 0}</td>
                      </tr>
                      <tr>
                        <td>Purchase Orders</td>
                        <td>{product.purchaseOrderList?.join(', ') || 'None'}</td>
                      </tr>
                      <tr>
                        <td>Purchase Requisitions</td>
                        <td>{product.purchaseRequisitionList?.join(', ') || 'None'}</td>
                      </tr>
                      <tr>
                        <td>PO In Receiving</td>
                        <td>{product.poInReceiving || 0}</td>
                      </tr>
                      <tr>
                        <td>PO Acknowledgement</td>
                        <td>
                          {Array.isArray(product.poAcknowledgementList) 
                            ? product.poAcknowledgementList.join(', ') 
                            : (product.poAcknowledgementList || 'None')}
                        </td>
                      </tr>
                      <tr>
                        <td>Requested Inbound Shipment</td>
                        <td>{product.requestedInboundShipment || 0}</td>
                      </tr>
                      <tr>
                        <td>Planned Inbound Shipment</td>
                        <td>{product.plannedInboundShipment || 0}</td>
                      </tr>
                      <tr>
                        <td>Intransit Shipment</td>
                        <td>{product.intransitShipment || 0}</td>
                      </tr>
                      <tr>
                        <td>Intransit Receipts</td>
                        <td>{product.intransitReceipts || 0}</td>
                      </tr>
                      <tr>
                        <td>Internal Requisition</td>
                        <td>{product.internalRequisition || 0}</td>
                      </tr>
                      <tr>
                        <td>Transfer Order</td>
                        <td>{product.transferOrder || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {activeTab === 'inventory' && (
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>FIELD</th>
                        <th>VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Consumption 3M Avg</td>
                        <td>{product.consumption3MAvg || 0}</td>
                      </tr>
                      <tr>
                        <td>Consumption 12M Avg</td>
                        <td>{product.consumption12MAvg || 0}</td>
                      </tr>
                      <tr>
                        <td>Variance 12M to 3M</td>
                        <td>{product.variance12MTo3M || 0}</td>
                      </tr>
                      <tr>
                        <td>On Hand Nettable</td>
                        <td>{product.onHandNettable || 0}</td>
                      </tr>
                      <tr>
                        <td>Months Supply (Nettable)</td>
                        <td>{product.monthsSupplyNettable || 0}</td>
                      </tr>
                      <tr>
                        <td>On Hand Non-Nettable</td>
                        <td>{product.onHandNonNettable || 0}</td>
                      </tr>
                      <tr>
                        <td>Months Supply (Non-Nettable)</td>
                        <td>{product.monthsSupplyNonNettable || 0}</td>
                      </tr>
                      <tr>
                        <td>On Hand to Safety Stock %</td>
                        <td>{product.onHandToSafetyStockPercent || 0}%</td>
                      </tr>
                      <tr>
                        <td>OH - Expiry</td>
                        <td>{product.ohExpiry || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td>ATP</td>
                        <td>{product.atp || 0}</td>
                      </tr>
                      {showWorkOrders && (
                        <tr>
                          <td>Open WO Qty</td>
                          <td>{product.openWoQty || 0}</td>
                        </tr>
                      )}
                      {showPurchaseOrders && (
                        <tr>
                          <td>Open PO Qty</td>
                          <td>{product.openPoQty || 0}</td>
                        </tr>
                      )}
                      {showSalesOrders && (
                        <tr>
                          <td>Sales Order Qty</td>
                          <td>{product.salesOrderQty || 0}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;