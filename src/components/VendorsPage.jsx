import React, { useState, useEffect } from "react";
import "../styles/VendorsPage.css";
import { useNavigate } from "react-router-dom";

const VendorsPage = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [vendors, setVendors] = useState([]); // For metrics
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" or "approved"
  const [showModal, setShowModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    street2: "",
    city: "",
    state_id: "",
    zip: "",
    country_id: "",
    x_studio_supplier_since: ""
  });

  // Fetch suppliers list for table
  const fetchSuppliers = async () => {
    try {
      const response = await fetch("https://odooerp.staunchtec.com/api/vendors/suppliers-list");
      // const response = await fetch("http://127.0.0.1:8000/api/vendors/suppliers-list");

      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  // Fetch vendors for metrics (for navigation purposes only)
  const fetchVendors = async () => {
    try {
      const response = await fetch("https://odooerp.staunchtec.com/api/vendors/all-metrics");
      //const response = await fetch("http://127.0.0.1:8000/api/vendors/all-metrics");
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchVendors()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter suppliers based on approval status
  const filteredSuppliers = suppliers.filter(supplier => {
    if (filter === "approved") {
      return supplier.approved === true;
    }
    return true; // "all" shows everything
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://127.0.0.1:8000/api/vendors/create", {
      //const response = await fetch("https://odooerp.staunchtec.com/api/vendors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setShowSuccessPopup(true);
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          street: "",
          street2: "",
          city: "",
          state_id: "",
          zip: "",
          country_id: "",
          x_studio_supplier_since: ""
        });

        // Refresh suppliers list
        await fetchSuppliers();

        // Hide success popup after 3 seconds
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } else {
        alert("Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("Error creating supplier");
    }
  };

  // Navigate to metrics page with pre-selected vendor
  const handleSupplierClick = (supplierName) => {
    // Find the vendor in the metrics list
    const vendor = vendors.find(v => v.vendor_name === supplierName);
    if (vendor) {
      // Store the selected vendor in sessionStorage or pass it as a prop
      sessionStorage.setItem('selectedVendor', supplierName);
      navigate("/vendor-metrics");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Never') return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="vendors-page">
        <p className="loading">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="vendors-page">
      {/* Header - Title Left, Buttons Right */}
      <div className="vendors-header">
        <div className="header-left">
          <button className="back-arrow" onClick={() => navigate("/dashboard")}>
            ←
          </button>
          <h1 className="title">Suppliers</h1>
        </div>
        
        <div className="header-right">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              ALL
            </button>
            <button 
              className={`filter-btn ${filter === "approved" ? "active" : ""}`}
              onClick={() => setFilter("approved")}
            >
              APPROVED
            </button>
          </div>
          {/* <button 
            className="add-supplier-btn"
            onClick={() => setShowModal(true)}
          >
            ADD SUPPLIER
          </button> */}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>SUPPLIER NAME</th>
              <th>STATUS</th>
              <th>LAST ORDER</th>
              <th>IN PROGRESS</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <button 
                    className="supplier-name-link"
                    onClick={() => handleSupplierClick(supplier.name)}
                  >
                    {supplier.name}
                  </button>
                </td>
                <td>
                  <span className={`status-badge ${supplier.approved ? 'approved' : 'pending'}`}>
                    {supplier.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>{formatDate(supplier.last_order)}</td>
                <td>{supplier.in_progress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Supplier</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="supplier-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Supplier Since</label>
                  <input
                    type="date"
                    name="x_studio_supplier_since"
                    value={formData.x_studio_supplier_since}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Street Address 2</label>
                  <input
                    type="text"
                    name="street2"
                    value={formData.street2}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state_id"
                    value={formData.state_id}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country_id"
                    value={formData.country_id}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-content">
            <span className="success-icon">✓</span>
            Supplier added successfully!
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsPage;