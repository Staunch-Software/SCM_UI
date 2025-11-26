import React, { useState, useEffect } from "react";
import "../styles/PurchaseOrderDrawer.css";
import apiClient from "../services/apiclient";

const WorkOrderDrawer = ({ isOpen, onClose, orderId }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showActionsId, setShowActionsId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    product_id: null,
    quantity_to_produce: "",
    start_date: "",
    end_date: ""
  });
  const [updateError, setUpdateError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // NEW: Product fetching for create mode
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

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
    if (isOpen) {
      if (orderId) {
        fetchOrderDetails();
      } else {
        // Create mode
        setOrderData(null);
        setEditedData({
          product_id: null,
          quantity_to_produce: "",
          start_date: "",
          end_date: ""
        });
        fetchProducts(); // Fetch products for dropdown
      }
      setIsEditing(false);
      setUpdateError(null);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/api/work-order-details?mo_id=${encodeURIComponent(orderId)}`);
      setOrderData(data);

      setEditedData({
        quantity_to_produce: data.quantity_to_produce || "",
        start_date: formatDateForInput(data.start_date),
        end_date: formatDateForInput(data.end_date)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await apiClient.get(`/api/products-search?procurement_type=Make`);
      setProducts(data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split(" ")[0];
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "N/A";
    return dateStr.split(" ")[0];
  };

  const isStatusDone = orderData?.status?.toLowerCase() === "done";

  const handleEditChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    setUpdateError(null);
  };

  const validateUpdate = () => {
    const qty = parseFloat(editedData.quantity_to_produce);
    if (isNaN(qty) || qty <= 0) {
      setUpdateError("Quantity must be a positive number");
      return false;
    }

    if (editedData.start_date && editedData.end_date) {
      const start = new Date(editedData.start_date);
      const end = new Date(editedData.end_date);
      if (end < start) {
        setUpdateError("End date must be after or equal to start date");
        return false;
      }
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateUpdate()) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      const response = await apiClient.patch(`/api/work-order-details?mo_id=${encodeURIComponent(orderId)}`, editedData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update work order");
      }

      onClose();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateMO = async () => {
    if (!editedData.product_id) {
      setUpdateError("Please select a product");
      return;
    }
    if (!validateUpdate()) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      await apiClient.post(`/api/manufacturing-order`, editedData);


      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.detail || "Failed to create work order");
      // }

      onClose();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const toggleActions = (id) => {
    setShowActionsId(showActionsId === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`drawer-container ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">
            {orderId ? `Work Order ${orderId}` : 'New Work Order'}
          </h2>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="drawer-close-btn">
            ✕
          </button>
        </div>

        <div className="drawer-content">
          {loading && <div className="drawer-loading">Loading order details...</div>}
          {error && <div className="drawer-error">{error}</div>}
          {updateError && <div className="drawer-error">{updateError}</div>}

          {(orderData || !orderId) && (
            <>
              <div className="info-section work-order-info">
                <h3 className="section-title">General Information</h3>
                <div className="info-grid">
                  {orderId && (
                    <>
                      <div className="info-field">
                        <label className="field-label">MO ID</label>
                        <div className="field-value readonly-field">{orderData?.mo_id || "N/A"}</div>
                      </div>
                      <div className="info-field">
                        <label className="field-label">Planned Order ID</label>
                        <div className="field-value readonly-field">{orderData?.planned_order_id || "N/A"}</div>
                      </div>
                    </>
                  )}

                  {!orderId && (
                    <div className="info-field">
                      <label className="field-label">Product *</label>
                      {loadingProducts ? (
                        <div className="field-value readonly-field">Loading products...</div>
                      ) : (
                        <select
                          className="field-value editable-field"
                          value={editedData.product_id || ""}
                          onChange={(e) => handleEditChange("product_id", parseInt(e.target.value))}
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.product_name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {orderId && (
                    <div className="info-field">
                      <label className="field-label">Product</label>
                      <div className="field-value readonly-field">{orderData?.product_name || "N/A"}</div>
                    </div>
                  )}

                  <div className="info-field">
                    <label className="field-label">Quantity to Produce *</label>
                    {orderId && isStatusDone ? (
                      <div className="field-value disabled-field">{orderData?.quantity_to_produce || "N/A"}</div>
                    ) : (
                      <input
                        type="number"
                        className="field-value editable-field"
                        value={editedData.quantity_to_produce}
                        onChange={(e) => handleEditChange("quantity_to_produce", e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    )}
                  </div>

                  <div className="info-field">
                    <label className="field-label">Start Date *</label>
                    {orderId && isStatusDone ? (
                      <div className="field-value disabled-field">{formatDateForDisplay(orderData?.start_date)}</div>
                    ) : (
                      <input
                        type="date"
                        className="field-value editable-field"
                        value={editedData.start_date}
                        onChange={(e) => handleEditChange("start_date", e.target.value)}
                      />
                    )}
                  </div>

                  <div className="info-field">
                    <label className="field-label">End Date *</label>
                    {orderId && isStatusDone ? (
                      <div className="field-value disabled-field">{formatDateForDisplay(orderData?.end_date)}</div>
                    ) : (
                      <input
                        type="date"
                        className="field-value editable-field"
                        value={editedData.end_date}
                        onChange={(e) => handleEditChange("end_date", e.target.value)}
                      />
                    )}
                  </div>

                  {orderId && (
                    <>
                      <div className="info-field">
                        <label className="field-label">Status</label>
                        <div className="field-value readonly-field">{orderData?.status || "N/A"}</div>
                      </div>
                      <div className="info-field">
                        <label className="field-label">Created At</label>
                        <div className="field-value readonly-field">{formatDateForDisplay(orderData?.created_at)}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {orderId && (
                <div className="items-section">
                  <div className="items-header">
                    <h3 className="section-title">Required Components (BOM)</h3>
                  </div>

                  <div className="items-table-container">
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Component Product</th>
                          <th>Required Quantity</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderData?.line_items && orderData.line_items.length > 0 ? (
                          orderData.line_items.map((item, idx) => (
                            <tr key={item.bom_id || idx}>
                              <td>{item.sku}</td>
                              <td>{item.product_name}</td>
                              <td>{item.quantity.toFixed(2)}</td>
                              <td></td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                              No components found in BOM
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="pagination-info">
                    Page 1 of 1 ({orderData?.line_items?.length || 0} total components)
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="drawer-footer">
          <button className="footer-btn cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="footer-btn update-btn"
            onClick={orderId ? handleUpdate : handleCreateMO}
            disabled={updating || (orderId && isStatusDone)}
          >
            {updating ? "Saving..." : (orderId ? "Update" : "Create")}
          </button>
        </div>
      </div>
    </>
  );
};

export default WorkOrderDrawer;