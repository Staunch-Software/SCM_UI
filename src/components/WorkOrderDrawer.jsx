import React, { useState, useEffect } from "react";
import "../styles/PurchaseOrderDrawer.css";

const WorkOrderDrawer = ({ isOpen, onClose, orderId }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showActionsId, setShowActionsId] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    quantity_to_produce: "",
    start_date: "",
    end_date: ""
  });
  const [updateError, setUpdateError] = useState(null);
  const [updating, setUpdating] = useState(false);

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
      setIsEditing(false);
      setUpdateError(null);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/work-order-details?mo_id=${encodeURIComponent(orderId)}`);
      if (!response.ok) throw new Error("Failed to fetch work order details");
      const data = await response.json();
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
      const response = await fetch(`http://127.0.0.1:8000/api/work-order-details?mo_id=${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData)
      });

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

  const toggleActions = (id) => {
    setShowActionsId(showActionsId === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`drawer-container ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">Work Order {orderId}</h2>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="drawer-close-btn">
            ✕
          </button>
        </div>

        <div className="drawer-content">
          {loading && <div className="drawer-loading">Loading order details...</div>}
          {error && <div className="drawer-error">{error}</div>}
          {updateError && <div className="drawer-error">{updateError}</div>}

          {orderData && (
            <>
              <div className="info-section work-order-info">
                <h3 className="section-title">General Information</h3>
                <div className="info-grid">
                  <div className="info-field">
                    <label className="field-label">MO ID *</label>
                    <div className="field-value readonly-field">{orderData.mo_id || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Planned Order ID</label>
                    <div className="field-value readonly-field">{orderData.planned_order_id || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Product</label>
                    <div className="field-value readonly-field">{orderData.product_name || "N/A"}</div>
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">Quantity to Produce *</label>
                    {isStatusDone ? (
                      <div className="field-value disabled-field">{orderData.quantity_to_produce || "N/A"}</div>
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
                    {isStatusDone ? (
                      <div className="field-value disabled-field">{formatDateForDisplay(orderData.start_date)}</div>
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
                    {isStatusDone ? (
                      <div className="field-value disabled-field">{formatDateForDisplay(orderData.end_date)}</div>
                    ) : (
                      <input
                        type="date"
                        className="field-value editable-field"
                        value={editedData.end_date}
                        onChange={(e) => handleEditChange("end_date", e.target.value)}
                      />
                    )}
                  </div>
                  
                  <div className="info-field">
                    <label className="field-label">Status</label>
                    <div className="field-value readonly-field">{orderData.status || "N/A"}</div>
                  </div>
                  <div className="info-field">
                    <label className="field-label">Created At</label>
                    <div className="field-value readonly-field">{formatDateForDisplay(orderData.created_at)}</div>
                  </div>
                </div>
              </div>

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
                      {orderData.line_items && orderData.line_items.length > 0 ? (
                        orderData.line_items.map((item, idx) => (
                          <tr key={item.bom_id || idx}>
                            <td>{item.sku}</td>
                            <td>{item.product_name}</td>
                            <td>{item.quantity.toFixed(2)}</td>
                            {/* <td>
                              <div className="actions-cell">
                                <button
                                  className="actions-btn"
                                  onClick={() => toggleActions(item.bom_id)}
                                >
                                  ⋮
                                </button>
                                {showActionsId === item.bom_id && (
                                  <div className="actions-menu">
                                    <button className="action-item">View component</button>
                                    <button className="action-item">Check inventory</button>
                                  </div>
                                )}
                              </div>
                            </td> */}
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
                  Page 1 of 1 ({orderData.line_items?.length || 0} total components)
                </div>
              </div>
            </>
          )}
        </div>

        <div className="drawer-footer">
          <button className="footer-btn cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="footer-btn update-btn" 
            onClick={handleUpdate}
            disabled={isStatusDone || updating}
          >
            {updating ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </>
  );
};

export default WorkOrderDrawer;