import React, { useState, useEffect } from "react";
import "../styles/VendorMetricsPage.css";

const VendorMetricsPage = ({ setCurrentPage }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState("");

  // Fetch all vendors with metrics
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);

        //const response = await fetch("https://odooerp.staunchtec.com/api/vendors/all-metrics");
        const response = await fetch("http://127.0.0.1:8000/api/vendors/all-metrics");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setVendors(Array.isArray(data) ? data : []);
        
        // Check for pre-selected vendor from sessionStorage
        const preSelectedVendor = sessionStorage.getItem('selectedVendor');
        if (preSelectedVendor && data.some(v => v.vendor_name === preSelectedVendor)) {
          setSelectedVendor(preSelectedVendor);
          // Clear from sessionStorage after using
          sessionStorage.removeItem('selectedVendor');
        } else if (data.length > 0) {
          setSelectedVendor(data[0].vendor_name);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching vendors:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const handleBackToSuppliers = () => {
    if (setCurrentPage) {
      setCurrentPage("vendors");
    } else {
      window.location.href = "/vendors";
    }
  };

  if (loading) {
    return (
      <div className="vendor-metrics-page">
        <p className="loading">Loading vendor metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vendor-metrics-page">
        <button className="back-btn" onClick={handleBackToSuppliers}>
          ← Back to Suppliers
        </button>
        <div className="error-message">
          <h2>Error Loading Vendor Metrics</h2>
          <p>Failed to fetch vendor data: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!vendors.length) {
    return (
      <div className="vendor-metrics-page">
        <button className="back-btn" onClick={handleBackToSuppliers}>
          ← Back to Suppliers
        </button>
        <h1 className="title">Vendor Metrics</h1>
        <p className="empty">No vendor metrics found.</p>
      </div>
    );
  }

  const vendor = vendors.find((v) => v.vendor_name === selectedVendor);

  // Helper functions for color-coding scores
  const getScoreClass = (value) => {
    if (value === undefined || value === null || value === "N/A") return "";
    const num = parseFloat(value * 100);
    if (isNaN(num)) return "";
    if (num >= 80) return "score-high";
    if (num >= 50) return "score-medium";
    return "score-low";
  };

  const getRiskScoreClass = (value) => {
    if (value === undefined || value === null || value === "N/A") return "";
    const num = parseFloat(value * 100);
    if (isNaN(num)) return "";
    if (num <= 30) return "score-high";
    if (num <= 60) return "score-medium";
    return "score-low";
  };

  const getDisruptionClass = (count) => {
    if (count === undefined || count === null) return "";
    if (count <= 1) return "score-high";
    if (count <= 3) return "score-medium";
    return "score-low";
  };

  const getResponseClass = (days) => {
    if (days === undefined || days === null) return "";
    if (days <= 2) return "score-high";
    if (days <= 5) return "score-medium";
    return "score-low";
  };

  // Format value functions
  const formatPercent = (value) => {
    if (value === undefined || value === null) return "N/A";
    return (parseFloat(value) * 100).toFixed(1) + "%";
  };

  const formatDays = (value) => {
    if (value === undefined || value === null) return "N/A";
    return parseFloat(value).toFixed(1) + " days";
  };

  const formatYears = (value) => {
    if (value === undefined || value === null) return "N/A";
    return parseFloat(value).toFixed(1) + " years";
  };

  const formatCount = (value) => {
    if (value === undefined || value === null) return "N/A";
    return value.toString();
  };

  const formatBoolean = (value) => {
    if (value === undefined || value === null) return "N/A";
    return value ? "Yes" : "No";
  };

  return (
    <div className="vendor-metrics-page">
      {/* Header */}
      <div className="metrics-header">
        <div className="title-with-back">
          <button className="back-arrow" onClick={handleBackToSuppliers}>
            ←
          </button>
          <h1 className="title">Vendor Metrics</h1>
        </div>
        <div className="vendor-selector">
          <label htmlFor="vendors" className="vendor-label">
            Choose Vendor:
          </label>
          <select
            id="vendors"
            className="vendor-select"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            {vendors.map((v, idx) => (
              <option key={idx} value={v.vendor_name}>
                {v.vendor_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Score Legend */}
      <div className="score-legend">
        <span><span className="score-high status-dot"></span> Safe (≥ 80%)</span>
        <span><span className="score-medium status-dot"></span> Medium (50–79%)</span>
        <span><span className="score-low status-dot"></span> Danger (≤ 50%)</span>
      </div>

      {/* Metrics Display */}
      {vendor && (
        <div className="vendor-card">
          <h2 className="vendor-name">{vendor.vendor_name}</h2>

          <div className="metrics-grid">
            {/* <div className="metric-box">
              <h3>Rank</h3>
              <p>{vendor.rank !== undefined ? vendor.rank : "N/A"}</p>
            </div> */}
            <div className="metric-box">
              <h3>On Time Delivery</h3>
              <p className={getScoreClass(vendor.on_time_delivery_pct)}>{formatPercent(vendor.on_time_delivery_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Delivery Accuracy</h3>
              <p className={getScoreClass(vendor.delivery_accuracy_pct)}>{formatPercent(vendor.delivery_accuracy_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Defect Rate</h3>
              <p className={getRiskScoreClass(vendor.defect_rate_pct)}>{formatPercent(vendor.defect_rate_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Rejection Rate</h3>
              <p className={getRiskScoreClass(vendor.rejection_rate_pct)}>{formatPercent(vendor.rejection_rate_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Return Rate</h3>
              <p className={getRiskScoreClass(vendor.return_rate_pct)}>{formatPercent(vendor.return_rate_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Order Completion Rate</h3>
              <p className={getScoreClass(vendor.order_completion_rate_pct)}>{formatPercent(vendor.order_completion_rate_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Responsiveness</h3>
              <p className={getResponseClass(vendor.responsiveness_days)}>{formatDays(vendor.responsiveness_days)}</p>
            </div>
            <div className="metric-box">
              <h3>Flexibility</h3>
              <p className={getScoreClass(vendor.flexibility_pct)}>{formatPercent(vendor.flexibility_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Price Stability</h3>
              <p className={getScoreClass(vendor.price_stability_pct)}>{formatPercent(vendor.price_stability_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Financial Stability</h3>
              <p className={getScoreClass(vendor.financial_stability_pct)}>{formatPercent(vendor.financial_stability_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Geographic Risk</h3>
              <p className={getRiskScoreClass(vendor.geographic_risk_pct)}>{formatPercent(vendor.geographic_risk_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Sustainability (ESG)</h3>
              <p className={getScoreClass(vendor.sustainability_esg_pct)}>{formatPercent(vendor.sustainability_esg_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>Supply Chain Disruptions</h3>
              <p className={getDisruptionClass(vendor.supply_chain_disruptions_count)}>{formatCount(vendor.supply_chain_disruptions_count)}</p>
            </div>
            <div className="metric-box">
              <h3>Years of Partnership</h3>
              <p>{formatYears(vendor.years_of_partnership)}</p>
            </div>
            <div className="metric-box">
              <h3>Collaboration</h3>
              <p className={getScoreClass(vendor.collaboration_pct)}>{formatPercent(vendor.collaboration_pct)}</p>
            </div>
            <div className="metric-box">
              <h3>ISO 9001 Certified</h3>
              <p className={vendor.iso_9001 ? "score-high" : "score-low"}>{formatBoolean(vendor.iso_9001)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorMetricsPage;