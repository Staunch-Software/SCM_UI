import React, { useState, useEffect } from "react";
import "../styles/VendorsPage.css";

const VendorsPage = ({ setCurrentPage }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState("");

  // Fetch all vendors with all metrics
  useEffect(() => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/api/vendors/all-metrics")
      .then((res) => res.json())
      .then((data) => {
        setVendors(data);
        if (data.length > 0) setSelectedVendor(data[0].vendor_name); // default first vendor
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching vendors:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading">⏳ Loading vendors...</p>;
  if (!vendors.length) return <p className="no-data">⚠️ No vendor records found.</p>;

  const vendor = vendors.find((v) => v.vendor_name === selectedVendor);

  // 🔹 Helper for color-coding scores
  const getScoreClass = (value) => {
    if (value === undefined || value === null || value === "N/A") return "";
    const num = parseFloat(value * 100); // convert 0.75 → 75
    if (isNaN(num)) return "";
    if (num >= 80) return "score-high";   // Safe
    if (num >= 50) return "score-medium"; // Medium
    return "score-low";                   // Danger
  };

  // 🔹 Format value as percentage
  const formatPercent = (value) => {
    if (value === undefined || value === null) return "N/A";
    return (parseFloat(value) * 100).toFixed(1) + "%";
  };

  return (
    <div className="vendors-page">
      {/* Back Button */}
      <button className="back-btn" onClick={() => setCurrentPage("dashboard")}>
        ⬅ Back to Dashboard
      </button>

      {/* Header */}
      <div className="vendors-header">
        <h1 className="title">🏭 Vendor Metrics</h1>

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
      <div style={{ marginBottom: "20px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <span><span className="score-high status-dot"></span> Safe (&ge; 80%)</span>
        <span><span className="score-medium status-dot"></span> Medium (50–79%)</span>
        <span><span className="score-low status-dot"></span> Danger (&lt; 50%)</span>
      </div>

      {/* Metrics Display */}
      {vendor && (
        <div className="vendor-card">
          <h2 className="vendor-name">{vendor.vendor_name}</h2>

          <div className="metrics-grid">
            <div className="metric-box">
              <h3>📊 Rank</h3>
              <p>{vendor.rank !== undefined ? vendor.rank : "N/A"}</p>
            </div>
            <div className="metric-box">
              <h3>🚚 Delivery Accuracy</h3>
              <p className={getScoreClass(vendor.delivery)}>{formatPercent(vendor.delivery)}</p>
            </div>
            <div className="metric-box">
              <h3>✅ Quality</h3>
              <p className={getScoreClass(vendor.quality)}>{formatPercent(vendor.quality)}</p>
            </div>
            <div className="metric-box">
              <h3>⚡ Efficiency</h3>
              <p className={getScoreClass(vendor.efficiency)}>{formatPercent(vendor.efficiency)}</p>
            </div>
            <div className="metric-box">
              <h3>💰 Cost</h3>
              <p className={getScoreClass(vendor.cost)}>{formatPercent(vendor.cost)}</p>
            </div>
            <div className="metric-box">
              <h3>⚠️ Risk</h3>
              <p className={getScoreClass(vendor.risk)}>{formatPercent(vendor.risk)}</p>
            </div>
            <div className="metric-box">
              <h3>🤝 Relationship</h3>
              <p className={getScoreClass(vendor.relationship)}>{formatPercent(vendor.relationship)}</p>
            </div>
            <div className="metric-box">
              <h3>🌱 Sustainability</h3>
              <p className={getScoreClass(vendor.sustainability)}>{formatPercent(vendor.sustainability)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsPage;
