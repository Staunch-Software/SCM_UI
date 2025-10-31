import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import "../styles/ProductDetailsPage.css";

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("work-orders");

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/product-details/${productId}`);
        if (!response.ok) throw new Error("Failed to fetch product details");
        const data = await response.json();
        setProductDetails(data);
        
        // Set default tab based on item type
        if (data.itemType === 'Finished goods') {
          setActiveTab("work-orders");
        } else if (data.itemType === 'Raw material') {
          setActiveTab("purchase-orders");
        } else if (data.itemType === 'Sub assembly') {
          setActiveTab(data.hasBOM ? "work-orders" : "purchase-orders");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  if (loading) {
    return (
      <div className="pdp-container">
        <div className="pdp-loading-container">
          <div className="pdp-loading-spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdp-container">
        <div className="pdp-error-container">
          <AlertCircle size={48} color="#dc2626" />
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="pdp-back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="pdp-container">
        <div className="pdp-error-container">
          <p>Product not found</p>
          <button onClick={() => navigate(-1)} className="pdp-back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isFinishedGoods = productDetails.itemType === 'Finished goods';
  const isRawMaterial = productDetails.itemType === 'Raw material';
  const isSubAssemblyWithBOM = productDetails.itemType === 'Sub assembly' && productDetails.hasBOM;
  const isSubAssemblyWithoutBOM = productDetails.itemType === 'Sub assembly' && !productDetails.hasBOM;

  const showWorkOrders = isFinishedGoods || isSubAssemblyWithBOM;
  const showPurchaseOrders = isRawMaterial || isSubAssemblyWithoutBOM;
  const showSalesOrders = isFinishedGoods;

  return (
    <div className="pdp-container">
      {/* Header */}
      <div className="pdp-header">
        <h1 className="pdp-title">{productDetails.itemDescription || 'Product Details'}</h1>
        <div className="pdp-meta">
          <span><strong>Planner/Buyer Code:</strong> {productDetails.plannerCode || productDetails.buyerCode || 'N/A'}</span>
          <span><strong>Org:</strong> {productDetails.org || 'N/A'}</span>
          <span><strong>UOM:</strong> {productDetails.uom || 'N/A'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="pdp-tabs-container">
        <div className="pdp-tabs-header">
          {showWorkOrders && (
            <button
              className={`pdp-tab-btn ${activeTab === "work-orders" ? "active" : ""}`}
              onClick={() => setActiveTab("work-orders")}
            >
              Work Orders
            </button>
          )}
          {showSalesOrders && (
            <button
              className={`pdp-tab-btn ${activeTab === "sales-orders" ? "active" : ""}`}
              onClick={() => setActiveTab("sales-orders")}
            >
              Sales Orders
            </button>
          )}
          {showPurchaseOrders && (
            <button
              className={`pdp-tab-btn ${activeTab === "purchase-orders" ? "active" : ""}`}
              onClick={() => setActiveTab("purchase-orders")}
            >
              Purchase Orders
            </button>
          )}
          <button
            className={`pdp-tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory Quantities
          </button>
        </div>

        <div className="pdp-tabs-content">
          {/* Work Orders Tab */}
          {activeTab === "work-orders" && showWorkOrders && (
            <div className="pdp-tab-panel">
              <table className="pdp-table">
                <thead>
                  <tr>
                    <th>FIELD</th>
                    <th>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Work Orders</td>
                    <td>{productDetails.workOrderList?.join(', ') || 'None'}</td>
                  </tr>
                  <tr>
                    <td>Required WO Qty</td>
                    <td>{productDetails.requiredWoQty || 0}</td>
                  </tr>
                  <tr>
                    <td>Issued WO Qty</td>
                    <td>{productDetails.issuedWoQty || 0}</td>
                  </tr>
                  <tr>
                    <td>Open WO Qty</td>
                    <td>{productDetails.openWoQty || 0}</td>
                  </tr>
                  {isSubAssemblyWithBOM && (
                    <>
                      <tr>
                        <td>Internal Requisition</td>
                        <td>{productDetails.internalRequisition || 0}</td>
                      </tr>
                      <tr>
                        <td>Intransit Shipment</td>
                        <td>{productDetails.intransitShipment || 0}</td>
                      </tr>
                      <tr>
                        <td>Intransit Receipts</td>
                        <td>{productDetails.intransitReceipts || 0}</td>
                      </tr>
                      <tr>
                        <td>Transfer Order</td>
                        <td>{productDetails.transferOrder || 'N/A'}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sales Orders Tab */}
          {activeTab === "sales-orders" && showSalesOrders && (
            <div className="pdp-tab-panel">
              <table className="pdp-table">
                <thead>
                  <tr>
                    <th>FIELD</th>
                    <th>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sales Order Qty</td>
                    <td>{productDetails.salesOrderQty || 0}</td>
                  </tr>
                  <tr>
                    <td>Sales Orders</td>
                    <td>{productDetails.salesOrderList?.join(', ') || 'None'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Purchase Orders Tab */}
          {activeTab === "purchase-orders" && showPurchaseOrders && (
            <div className="pdp-tab-panel">
              <table className="pdp-table">
                <thead>
                  <tr>
                    <th>FIELD</th>
                    <th>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Open PO Qty</td>
                    <td>{productDetails.openPoQty || 0}</td>
                  </tr>
                  <tr>
                    <td>Purchase Orders</td>
                    <td>{productDetails.purchaseOrderList?.join(', ') || 'None'}</td>
                  </tr>
                  <tr>
                    <td>Purchase Requisitions</td>
                    <td>{productDetails.purchaseRequisitionList?.join(', ') || 'None'}</td>
                  </tr>
                  <tr>
                    <td>PO In Receiving</td>
                    <td>{productDetails.poInReceiving || 0}</td>
                  </tr>
                  <tr>
                    <td>PO Acknowledgement</td>
                    <td>
                      {Array.isArray(productDetails.poAcknowledgementList) 
                        ? productDetails.poAcknowledgementList.join(', ') 
                        : (productDetails.poAcknowledgementList || 'None')}
                    </td>
                  </tr>
                  <tr>
                    <td>Requested Inbound Shipment</td>
                    <td>{productDetails.requestedInboundShipment || 0}</td>
                  </tr>
                  <tr>
                    <td>Planned Inbound Shipment</td>
                    <td>{productDetails.plannedInboundShipment || 0}</td>
                  </tr>
                  <tr>
                    <td>Intransit Shipment</td>
                    <td>{productDetails.intransitShipment || 0}</td>
                  </tr>
                  <tr>
                    <td>Intransit Receipts</td>
                    <td>{productDetails.intransitReceipts || 0}</td>
                  </tr>
                  <tr>
                    <td>Internal Requisition</td>
                    <td>{productDetails.internalRequisition || 0}</td>
                  </tr>
                  <tr>
                    <td>Transfer Order</td>
                    <td>{productDetails.transferOrder || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Inventory Quantities Tab */}
          {activeTab === "inventory" && (
            <div className="pdp-tab-panel">
              <table className="pdp-table">
                <thead>
                  <tr>
                    <th>FIELD</th>
                    <th>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Consumption 3M Avg</td>
                    <td>{productDetails.consumption3MAvg || 0}</td>
                  </tr>
                  <tr>
                    <td>Consumption 12M Avg</td>
                    <td>{productDetails.consumption12MAvg || 0}</td>
                  </tr>
                  <tr>
                    <td>Variance 12M to 3M</td>
                    <td>{productDetails.variance12MTo3M || 0}</td>
                  </tr>
                  <tr>
                    <td>On Hand Nettable</td>
                    <td>{productDetails.onHandNettable || 0}</td>
                  </tr>
                  <tr>
                    <td>Months Supply (Nettable)</td>
                    <td>{productDetails.monthsSupplyNettable || 0}</td>
                  </tr>
                  <tr>
                    <td>On Hand Non-Nettable</td>
                    <td>{productDetails.onHandNonNettable || 0}</td>
                  </tr>
                  <tr>
                    <td>Months Supply (Non-Nettable)</td>
                    <td>{productDetails.monthsSupplyNonNettable || 0}</td>
                  </tr>
                  <tr>
                    <td>On Hand to Safety Stock %</td>
                    <td>{productDetails.onHandToSafetyStockPercent || 0}%</td>
                  </tr>
                  <tr>
                    <td>OH - Expiry</td>
                    <td>{productDetails.ohExpiry || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>ATP</td>
                    <td>{productDetails.atp || 0}</td>
                  </tr>
                  {showWorkOrders && (
                    <tr>
                      <td>Open WO Qty</td>
                      <td>{productDetails.openWoQty || 0}</td>
                    </tr>
                  )}
                  {showPurchaseOrders && (
                    <tr>
                      <td>Open PO Qty</td>
                      <td>{productDetails.openPoQty || 0}</td>
                    </tr>
                  )}
                  {showSalesOrders && (
                    <tr>
                      <td>Sales Order Qty</td>
                      <td>{productDetails.salesOrderQty || 0}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;