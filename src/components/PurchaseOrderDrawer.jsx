// PurchaseOrderDrawer.jsx - REPLACE ENTIRE FILE
import React, { useState, useEffect } from "react";
import "../styles/PurchaseOrderDrawer.css";
import "../styles/SalesOrderModal.css";

const PurchaseOrderDrawer = ({ isOpen, onClose, orderId }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showActionsId, setShowActionsId] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  
  // Add/Edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Suppliers state
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  // Editable header fields
  const [editedHeader, setEditedHeader] = useState({
    supplier_id: null,
    expected_arrival_date: ""
  });
  
  // Form state for line items
  const [formData, setFormData] = useState({
    product_id: null,
    product_name: "",
    sku: "",
    quantity: 1,
    unit_price: 0
  });
  
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [headerError, setHeaderError] = useState(null);
  const [updatingHeader, setUpdatingHeader] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
      checkEditability();
      fetchSuppliers();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-order-details/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order details");
      const data = await response.json();
      setOrderData(data);
      
      // Initialize editable header fields
      setEditedHeader({
        supplier_id: data.supplier_id || null,
        expected_arrival_date: formatDateForInput(data.expected_arrival_date)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEditability = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-order-editable/${orderId}`);
      if (!response.ok) throw new Error("Failed to check editability");
      const data = await response.json();
      setIsEditable(data.editable);
    } catch (err) {
      console.error("Error checking editability:", err);
      setIsEditable(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/suppliers-approved`);
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      const data = await response.json();
      setSuppliers(data.suppliers);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const searchProducts = async (query) => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/products-search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Failed to search products");
      const data = await response.json();
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

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split(" ")[0];
  };

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
    if (showAddModal && formData.unit_price <= 0) {
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
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-order-line?po_id=${encodeURIComponent(orderId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: formData.product_id,
          quantity: parseFloat(formData.quantity),
          unit_price: parseFloat(formData.unit_price)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to add line");
      }
      
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
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-order-line/${editingLine.po_item_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: parseFloat(formData.quantity)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update line");
      }
      
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
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-order-line/${lineId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete line");
      }
      
      await fetchOrderDetails();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateHeader = async () => {
    setUpdatingHeader(true);
    setHeaderError(null);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/purchase-order-header/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedHeader)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update purchase order");
      }
      
      onClose();
    } catch (err) {
      setHeaderError(err.message);
    } finally {
      setUpdatingHeader(false);
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
          <h2 className="drawer-title">Purchase Order {orderId}</h2>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="drawer-close-btn">
            ✕
          </button>
        </div>

        <div className="drawer-content">
          {loading && <div className="drawer-loading">Loading order details...</div>}
          {error && <div className="drawer-error">{error}</div>}
          {headerError && <div className="drawer-error">{headerError}</div>}

          {orderData && (
            <>
              {/* General Information */}
              <div className="info-section">
                <h3 className="section-title">General Information</h3>
                <div className="info-grid">
                  {/* Supplier - Editable */}
                  <div className="info-field">
                    <label className="field-label">Supplier *</label>
                    {isEditable ? (
                      <select
                        className="field-value editable-field"
                        value={editedHeader.supplier_id || ""}
                        onChange={(e) => setEditedHeader({...editedHeader, supplier_id: parseInt(e.target.value)})}
                        disabled={loadingSuppliers}
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => (
                          <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="field-value readonly-field">{orderData.supplier_name || "N/A"}</div>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">PO ID</label>
                    <div className="field-value readonly-field">{orderData.po_id || "N/A"}</div>
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">Order Date</label>
                    <div className="field-value readonly-field">{formatDateForInput(orderData.order_date) || "N/A"}</div>
                  </div>
                  
                  {/* Expected Arrival - Editable */}
                  <div className="info-field">
                    <label className="field-label">Expected Arrival *</label>
                    {isEditable ? (
                      <input
                        type="date"
                        className="field-value editable-field"
                        value={editedHeader.expected_arrival_date}
                        onChange={(e) => setEditedHeader({...editedHeader, expected_arrival_date: e.target.value})}
                      />
                    ) : (
                      <div className="field-value readonly-field">{formatDateForInput(orderData.expected_arrival_date) || "N/A"}</div>
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">Status</label>
                    <div className="field-value readonly-field">{orderData.status || "N/A"}</div>
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">Actual Arrival Date</label>
                    <div className="field-value readonly-field">{formatDateForInput(orderData.actual_arrival_date) || "N/A"}</div>
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">Created Date</label>
                    <div className="field-value readonly-field">{orderData.created_at || "Just now"}</div>
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">Approved By</label>
                    <div className="field-value readonly-field">{orderData.approved_by || "N/A"}</div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="items-section">
                <div className="items-header">
                  <h3 className="section-title">Order Items</h3>
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
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.line_items && orderData.line_items.length > 0 ? (
                        orderData.line_items.map((item, idx) => (
                          <tr key={item.po_item_id || idx}>
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
                                    onClick={() => toggleActions(item.po_item_id)}
                                  >
                                    ⋮
                                  </button>
                                  {showActionsId === item.po_item_id && (
                                    <div className="actions-menu">
                                      <button className="action-item" onClick={() => handleEditLine(item)}>
                                        Edit item
                                      </button>
                                      <button className="action-item" onClick={() => handleDeleteLine(item.po_item_id)}>
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
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
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
            </>
          )}
        </div>

        <div className="drawer-footer">
          <button className="footer-btn cancel-btn" onClick={onClose}>Cancel</button>
          {isEditable && (
            <button 
              className="footer-btn update-btn" 
              onClick={handleUpdateHeader}
              disabled={updatingHeader}
            >
              {updatingHeader ? "Updating..." : "Update"}
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              {formError && <div className="drawer-error" style={{marginBottom: '1rem'}}>{formError}</div>}
              
              {/* Product Selection - Only for Add */}
              {showAddModal && (
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
                      {loadingProducts && <div style={{padding: '1rem', textAlign: 'center'}}>Loading...</div>}
                      <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px', marginTop: '0.5rem'}}>
                        {products.map(p => (
                          <div
                            key={p.product_id}
                            style={{padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9'}}
                            onClick={() => handleProductSelect(p)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7fafc'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            <div style={{fontWeight: 600}}>{p.product_name}</div>
                            <div style={{fontSize: '0.875rem', color: '#718096'}}>
                              {p.sku} • ${p.unit_price.toFixed(2)} • Stock: {p.stock}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="field-value" style={{cursor: 'pointer'}} onClick={() => setShowProductSearch(true)}>
                      {formData.product_name || "Click to select product"}
                    </div>
                  )}
                </div>
              )}

              {/* Product Name - Read-only for Edit */}
              {showEditModal && (
                <div className="form-field">
                  <label>Product</label>
                  <div className="field-value readonly-field">{formData.product_name}</div>
                </div>
              )}

              {/* SKU (Read-only) */}
              <div className="form-field">
                <label>SKU</label>
                <div className="field-value readonly-field">{formData.sku || "N/A"}</div>
              </div>

              {/* Quantity - Editable */}
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

              {/* Unit Price - Only editable for Add */}
              <div className="form-field">
                <label>Unit Price *</label>
                {showAddModal ? (
                  <input
                    type="number"
                    className="field-value editable-field"
                    value={formData.unit_price}
                    onChange={(e) => handleFormChange('unit_price', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <div className="field-value readonly-field">${formData.unit_price.toFixed(2)}</div>
                )}
              </div>

              {/* Total (Calculated) */}
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

export default PurchaseOrderDrawer;