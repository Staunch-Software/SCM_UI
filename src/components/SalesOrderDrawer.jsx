import React, { useState, useEffect } from "react";
import { ChevronDown, Package, Wrench, ShoppingCart } from "lucide-react";
import "../styles/PurchaseOrderDrawer.css";
import "../styles/SalesOrderModal.css";
import apiClient from "../services/apiclient";

const SalesOrderDrawer = ({ isOpen, onClose, orderId }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showActionsId, setShowActionsId] = useState(null);
  const [isEditable, setIsEditable] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    product_id: null,
    product_name: "",
    sku: "",
    quantity: 1,
    unit_price: 0
  });

  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("materials"); // New
  const [relatedOrders, setRelatedOrders] = useState(null); // New
  const [expandedMaterials, setExpandedMaterials] = useState({});
  const [expandedWorkOrders, setExpandedWorkOrders] = useState({});
  const [expandedPurchaseOrders, setExpandedPurchaseOrders] = useState({});

  const toggleMaterialGroup = (idx) => {
    setExpandedMaterials(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleWorkOrder = (idx) => {
    setExpandedWorkOrders(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const togglePurchaseOrder = (idx) => {
    setExpandedPurchaseOrders(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // FIX: Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionsId && !event.target.closest('.actions-cell')) {
        setShowActionsId(null);
      }
    };

    if (showActionsId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsId]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
      checkEditability();
      fetchRelatedOrders();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/api/sales-order-details/${orderId}`);
      setOrderData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEditability = async () => {
    try {
      const { data } = await apiClient.get(`/api/sales-order-editable/${orderId}`);
      setIsEditable(data.editable);
    } catch (err) {
      console.error("Error checking editability:", err);
      setIsEditable(false);
    }
  };

  const fetchRelatedOrders = async () => {
    try {
      const { data } = await apiClient.get(`/api/sales-order-related-orders/${orderId}`);
      setRelatedOrders(data);
    } catch (err) {
      console.error("Error fetching related orders:", err);
      setRelatedOrders({ materials: [], work_orders: [], purchase_orders: [] });
    }
  };

  const searchProducts = async (query) => {
    setLoadingProducts(true);
    try {
      const { data } = await apiClient.get(`/api/products-search?query=${query}`);
      setProducts(data.products);
    } catch (err) {
      console.error("Error searching products:", err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (showProductSearch && productSearch) {
      const timer = setTimeout(() => searchProducts(productSearch), 300);
      return () => clearTimeout(timer);
    }
  }, [productSearch, showProductSearch]);

  const handleAddLine = () => {
    setFormData({
      product_id: null,
      product_name: "",
      sku: "",
      quantity: 1,
      unit_price: 0
    });
    setFormError(null);
    setShowAddModal(true);
    setShowProductSearch(true);
    searchProducts("");
  };

  const handleEditLine = (line) => {
    setEditingLine(line);
    setFormData({
      product_id: line.product_id || null,
      product_name: line.product_name,
      sku: line.sku,
      quantity: line.quantity,
      unit_price: line.unit_price
    });
    setFormError(null);
    setShowEditModal(true);
    setShowActionsId(null);
  };

  const handleProductSelect = (product) => {
    setFormData({
      ...formData,
      product_id: product.product_id,
      product_name: product.product_name,
      sku: product.sku,
      unit_price: product.unit_price
    });
    setShowProductSearch(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const validateForm = () => {
    if (!formData.product_id) {
      setFormError("Please select a product");
      return false;
    }
    if (formData.quantity <= 0) {
      setFormError("Quantity must be positive");
      return false;
    }
    if (formData.unit_price <= 0) {
      setFormError("Unit price must be positive");
      return false;
    }
    return true;
  };

  const handleSubmitAdd = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await apiClient.post(`/api/sales-order-line?so_id=${orderId}`, {
        product_id: formData.product_id,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
      });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || "Failed to add line");
      // }

      setShowAddModal(false);
      await fetchOrderDetails();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await apiClient.patch(`/api/sales-order-line/${editingLine.so_item_id}`, {
        product_id: formData.product_id,
        quantity: parseFloat(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
      });

      setShowEditModal(false);
      await fetchOrderDetails();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLine = async (lineId) => {
    if (!window.confirm("Are you sure you want to delete this line?")) return;

    setShowActionsId(null);

    try {
      const response = await apiClient.delete(`/api/sales-order-line/${lineId}`);

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || "Failed to delete line");
      // }
      await fetchOrderDetails();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const toggleActions = (id) => {
    setShowActionsId(showActionsId === id ? null : id);
  };

  const calculateTotal = () => {
    return (parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`drawer-container ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">Sales Order {orderId}</h2>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="drawer-close-btn">
            ✕
          </button>
        </div>

        <div className="drawer-content">
          {loading && <div className="drawer-loading">Loading order details...</div>}
          {error && <div className="drawer-error">{error}</div>}

          {orderData && (
            <>
              <div className="info-section sales-order-info">
                <h3 className="section-title">General Information</h3>
                <div className="info-grid">
                  <div className="info-field">
                    <label className="field-label">Sales Order ID *</label>
                    <div className="field-value readonly-field">{orderData.sales_order_id || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Customer Name *</label>
                    <div className="field-value readonly-field">{orderData.customer_name || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Order Date *</label>
                    <div className="field-value readonly-field">{orderData.order_date || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Delivery Date</label>
                    <div className="field-value readonly-field">{orderData.delivery_date || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Status</label>
                    <div className="field-value readonly-field">{orderData.status || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Last Update On</label>
                    <div className="field-value readonly-field">{orderData.created_at || "Just now"}</div>
                  </div>
                </div>
              </div>

              <div className="items-section">
                <div className="items-header">
                  <h3 className="section-title">Order Lines</h3>
                  {isEditable && (
                    <button className="add-item-btn" onClick={handleAddLine}>+ Add</button>
                  )}
                </div>

                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.line_items && orderData.line_items.length > 0 ? (
                        orderData.line_items.map((item, idx) => (
                          <tr key={item.so_item_id || idx}>
                            <td>{item.sku}</td>
                            <td>{item.product_name}</td>
                            <td>{item.quantity}</td>
                            <td>${item.unit_price.toFixed(2)}</td>
                            <td>${item.total_amount.toFixed(2)}</td>
                            <td>
                              {isEditable && (
                                <div className="actions-cell">
                                  <button
                                    className="actions-btn"
                                    onClick={() => toggleActions(item.so_item_id)}
                                  >
                                    ⋮
                                  </button>
                                  {showActionsId === item.so_item_id && (
                                    <div className="actions-menu">
                                      <button className="action-item" onClick={() => handleEditLine(item)}>
                                        Edit item
                                      </button>
                                      <button className="action-item" onClick={() => handleDeleteLine(item.so_item_id)}>
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="no-items-message">
                            No line items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-info">
                  Page 1 of 1 ({orderData.line_items?.length || 0} total items)
                </div>
              </div>
              {/* NEW SECTION: Related Orders */}
              {relatedOrders && (
                <div className="related-orders-section">
                  <h3 className="section-title">Related Orders</h3>

                  {/* Tabs */}
                  <div className="tabs-container">
                    <button
                      className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                      onClick={() => setActiveTab('materials')}
                    >
                      <Package size={16} />
                      Materials ({relatedOrders.materials?.length || 0})
                    </button>
                    <button
                      className={`tab-btn ${activeTab === 'work_orders' ? 'active' : ''}`}
                      onClick={() => setActiveTab('work_orders')}
                    >
                      <Wrench size={16} />
                      Work Orders ({relatedOrders.work_orders?.length || 0})
                    </button>
                    <button
                      className={`tab-btn ${activeTab === 'purchase_orders' ? 'active' : ''}`}
                      onClick={() => setActiveTab('purchase_orders')}
                    >
                      <ShoppingCart size={16} />
                      Purchase Orders ({relatedOrders.purchase_orders?.length || 0})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="tab-content">
                    {/* Materials Tab */}
                    {activeTab === 'materials' && (
                      <div className="materials-content">
                        {relatedOrders.materials && relatedOrders.materials.length > 0 ? (
                          relatedOrders.materials.map((material, idx) => (
                            <div key={idx} className="collapsible-card">
                              <h4 className="collapsible-header" onClick={() => toggleMaterialGroup(idx)}>
                                <span>{material.product_name}</span>
                                <ChevronDown
                                  size={20}
                                  className={`collapsible-chevron ${expandedMaterials[idx] ? 'expanded' : ''}`}
                                />
                              </h4>
                              {expandedMaterials[idx] && (
                                <table className="items-table">
                                  <thead>
                                    <tr>
                                      <th>SKU</th>
                                      <th>Component</th>
                                      <th>Quantity</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {material.components && material.components.length > 0 ? (
                                      material.components.map((comp, compIdx) => (
                                        <tr key={compIdx}>
                                          <td>{comp.sku}</td>
                                          <td>{comp.component}</td>
                                          <td>{comp.quantity}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="3" className="no-items-message">
                                          No components found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="no-items-message">
                            No materials found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Work Orders Tab */}
                    {activeTab === 'work_orders' && (
                      <div className="work-orders-content">
                        {relatedOrders.work_orders && relatedOrders.work_orders.length > 0 ? (
                          relatedOrders.work_orders.map((mo, idx) => (
                            <div key={idx} className="collapsible-card">
                              <h4 className="collapsible-header" onClick={() => toggleWorkOrder(idx)}>
                                <span>{mo.mo_id} - {mo.product_name}</span>
                                <ChevronDown
                                  size={20}
                                  className={`collapsible-chevron ${expandedWorkOrders[idx] ? 'expanded' : ''}`}
                                />
                              </h4>

                              {expandedWorkOrders[idx] && (
                                <>
                                  <div className="work-order-details-grid">
                                    <div>
                                      <div className="detail-item-label">SKU</div>
                                      <div className="detail-item-value">{mo.sku}</div>
                                    </div>
                                    <div>
                                      <div className="detail-item-label">Quantity</div>
                                      <div className="detail-item-value">{mo.quantity}</div>
                                    </div>
                                    <div>
                                      <div className="detail-item-label">Due Date</div>
                                      <div className="detail-item-value">{mo.due_date || 'N/A'}</div>
                                    </div>
                                  </div>

                                  {mo.bom_components && mo.bom_components.length > 0 && (
                                    <div>
                                      <h5 className="components-title">
                                        Components Required
                                      </h5>
                                      <table className="items-table">
                                        <thead>
                                          <tr>
                                            <th>SKU</th>
                                            <th>Component</th>
                                            <th>Required Qty</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {mo.bom_components.map((comp, compIdx) => (
                                            <tr key={compIdx}>
                                              <td>{comp.sku}</td>
                                              <td>{comp.product_name}</td>
                                              <td>{comp.quantity_required}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="no-items-message">
                            No work orders found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Purchase Orders Tab */}
                    {activeTab === 'purchase_orders' && (
                      <div className="purchase-orders-content">
                        {relatedOrders.purchase_orders && relatedOrders.purchase_orders.length > 0 ? (
                          relatedOrders.purchase_orders.map((supplier, idx) => (
                            <div key={idx} className="collapsible-card">
                              <h4 className="collapsible-header" onClick={() => togglePurchaseOrder(idx)}>
                                <span>{supplier.supplier_name}</span>
                                <ChevronDown
                                  size={20}
                                  className={`collapsible-chevron ${expandedPurchaseOrders[idx] ? 'expanded' : ''}`}
                                />
                              </h4>

                              {expandedPurchaseOrders[idx] && (
                                <table className="items-table">
                                  <thead>
                                    <tr>
                                      <th>Item</th>
                                      <th>SKU</th>
                                      <th>Quantity</th>
                                      <th>Order Date</th>
                                      <th>Delivery Date</th>
                                      <th>Lead Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {supplier.items.map((item, itemIdx) => (
                                      <tr key={itemIdx}>
                                        <td>{item.product_name}</td>
                                        <td>{item.sku}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.order_date || 'N/A'}</td>
                                        <td>{item.delivery_date || 'N/A'}</td>
                                        <td>{item.lead_time}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="no-items-message">
                            No purchase orders found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="drawer-footer">
          <button className="footer-btn cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setShowProductSearch(false);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showAddModal ? "Add Line Item" : "Edit Line Item"}</h3>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setShowProductSearch(false);
              }}>✕</button>
            </div>

            <div className="modal-body">
              {formError && <div className="drawer-error modal-error">{formError}</div>}

              <div className="form-field">
                <label>Product *</label>
                {showProductSearch ? (
                  <div>
                    <input
                      type="text"
                      className="field-value editable-field"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      autoFocus
                    />
                    {loadingProducts && <div className="product-search-loading">Loading...</div>}
                    <div className="product-search-results">
                      {products.map(p => (
                        <div
                          key={p.product_id}
                          className="product-search-item"
                          onClick={() => handleProductSelect(p)}
                        >
                          <div className="product-search-item-name">{p.product_name}</div>
                          <div className="product-search-item-details">
                            {p.sku} • ${p.unit_price.toFixed(2)} • Stock: {p.stock}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="field-value product-select-placeholder" onClick={() => setShowProductSearch(true)}>
                    {formData.product_name || "Click to select product"}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>SKU</label>
                <div className="field-value readonly-field">{formData.sku || "N/A"}</div>
              </div>

              <div className="form-field">
                <label>Quantity *</label>
                <input
                  type="number"
                  className="field-value editable-field"
                  value={formData.quantity}
                  onChange={(e) => handleFormChange('quantity', e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div className="form-field">
                <label>Unit Price *</label>
                <input
                  type="number"
                  className="field-value editable-field"
                  value={formData.unit_price}
                  onChange={(e) => handleFormChange('unit_price', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-field">
                <label>Total Amount</label>
                <div className="field-value readonly-field">
                  ${calculateTotal()}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="footer-btn cancel-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setShowProductSearch(false);
                }}
              >
                Cancel
              </button>
              <button
                className="footer-btn update-btn"
                onClick={showAddModal ? handleSubmitAdd : handleSubmitEdit}
                disabled={submitting}
              >
                {submitting ? "Saving..." : showAddModal ? "Add Line" : "Update Line"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesOrderDrawer;