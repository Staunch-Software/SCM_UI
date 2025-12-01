import React, { useState, useEffect } from "react";
import GaugeComponent from "react-gauge-component";
import "../styles/VendorMetricsPage.css";
import apiClient from "../services/apiclient";

const VendorMetricsPage = ({ setCurrentPage }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState("");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get("/api/vendors/all-metrics");
        const data = response.data;
        
        setVendors(Array.isArray(data) ? data : []);

        const preSelectedVendor = sessionStorage.getItem("selectedVendor");
        if (preSelectedVendor) {
          setSelectedVendor(preSelectedVendor);
          // Do not remove the item, so it persists on refresh
        } else if (data.length > 0) {
          setSelectedVendor(data[0].vendor_name);
        }

      } catch (err) {
        console.error("Error fetching vendors:", err);
        setError(err.message);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const handleBackToSuppliers = () => {
    if (setCurrentPage) setCurrentPage("vendors");
    else window.location.href = "/vendors";
  };

  const getPercentageClass = (percent) => {
    if (percent >= 0.75) return "radial-value-high";
    if (percent >= 0.40) return "radial-value-medium";
    return "radial-value-low";
  };

  if (loading)
    return (
      <div className="vendor-metrics-page">
        <p className="loading">Loading vendor metrics...</p>
      </div>
    );

  if (error)
    return (
      <div className="vendor-metrics-page">
        <button className="back-btn" onClick={handleBackToSuppliers}>
          ← Back to Suppliers
        </button>
        <div className="error-message">
          <h2>Error Loading Vendor Metrics</h2>
          <p>Failed to fetch vendor data: {error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );

  if (!vendors.length && !selectedVendor)
    return (
      <div className="vendor-metrics-page">
        <button className="back-btn" onClick={handleBackToSuppliers}>
          ← Back to Suppliers
        </button>
        <h1 className="title">Vendor Metrics</h1>
        <p className="empty">No vendor metrics found.</p>
      </div>
    );

  const vendor = vendors.find(v => v.vendor_name === selectedVendor);

  // --- FIX 1: Make helper functions null-safe ---
  // Using != null checks for both null and undefined
  const formatDays = value => (value != null ? `${Math.round(value)} days` : "N/A");
  const formatYears = value => (value != null ? `${value.toFixed(1)} years` : "N/A");
  const formatCount = value => (value != null ? value.toString() : "N/A");
  const formatBoolean = value => (value ? "Yes" : "No"); // This is already safe

  const getResponseClass = days => {
    if (days == null) return ""; // Handle null/undefined
    if (days <= 3) return "score-high";
    if (days <= 7) return "score-medium";
    return "score-low";
  };

  const getDisruptionClass = count => {
    if (count == null) return ""; // Handle null/undefined
    if (count <= 4) return "score-high";
    if (count <= 8) return "score-medium";
    return "score-low";
  };

  const getYearsClass = years => {
    if (years == null) return ""; // Handle null/undefined
    if (years >= 5) return "score-high";
    if (years >= 2) return "score-medium";
    return "score-low";
  };

  const getIsoClass = value => (value ? "score-high" : "score-low");

  const renderGauge = (value, min = 0, max = 1, label = "") => {
  if (value == null) return <p className="radial-value">N/A</p>;

  let val = parseFloat(value);

  // ISO 9001 — simple two-color gauge
  if (label === "ISO 9001 Certified") {
    return (
      <div className="radial-meter-container">
        <GaugeComponent
          value={value ? 100 : 0}
          minValue={0}
          maxValue={100}
          type="semicircle"
          arc={{
            colorArray: ["#FF4E50", "#4CAF50"],
            subArcs: [{ limit: 50 }, { limit: 100 }],
            width: 0.3
          }}
          pointer={{
            color: value ? "#4CAF50" : "#FF4E50"
          }}
          labels={{ hideMinMax: true, hideValue: true }}
          style={{ width: "160px", height: "100px" }}
        />
      </div>
    );
  }

  // RESPONSIVENESS / DISRUPTIONS / YEARS (Special logic)
  if (
    label === "Responsiveness" ||
    label === "Supply Chain Disruptions" ||
    label === "Years of Partnership"
  ) {
    let needleColor = "#4CAF50";
    let percentValue = 0;
    let colors = [];

    if (label === "Responsiveness") {
      percentValue = Math.min(val / 10, 1) * 100;
      colors = ["#4CAF50", "#F9D423", "#FF4E50"];
      if (val > 7) needleColor = "#FF4E50";
      else if (val > 3) needleColor = "#F9D423";
    }

    if (label === "Supply Chain Disruptions") {
      percentValue = Math.min(val / 12, 1) * 100;
      colors = ["#4CAF50", "#F9D423", "#FF4E50"];
      if (val > 8) needleColor = "#FF4E50";
      else if (val > 4) needleColor = "#F9D423";
    }

    if (label === "Years of Partnership") {
      percentValue = Math.min(val / 10, 1) * 100;
      colors = ["#FF4E50", "#F9D423", "#4CAF50"];
      if (val < 2) needleColor = "#FF4E50";
      else if (val < 5) needleColor = "#F9D423";
    }

    return (
      <div className="radial-meter-container">
        <GaugeComponent
          value={percentValue}
          minValue={0}
          maxValue={100}
          type="semicircle"
          arc={{
            colorArray: colors,
            subArcs: [{ limit: 33 }, { limit: 66 }, { limit: 100 }],
            width: 0.3
          }}
          pointer={{ color: needleColor }}
          labels={{ hideMinMax: true, hideValue: true }}
          style={{ width: "160px", height: "100px" }}
        />
      </div>
    );
  }

  // DEFAULT % METRICS
  let percentValue = Math.min(Math.max(val, 0), 1) * 100;
  let needleColor = "#4CAF50"; // green default
  if (percentValue < 40) needleColor = "#FF4E50"; // red
  else if (percentValue < 75) needleColor = "#F9D423"; // yellow

  const colorClass = getPercentageClass(percentValue / 100);

  return (
    <div className="radial-meter-container">
      <GaugeComponent
        value={percentValue}
        minValue={0}
        maxValue={100}
        type="semicircle"
        arc={{
          colorArray: ["#FF4E50", "#F9D423", "#4CAF50"],
          subArcs: [{ limit: 40 }, { limit: 75 }, { limit: 100 }],
          width: 0.3
        }}
        pointer={{ color: needleColor }}
        labels={{ hideMinMax: true, hideValue: true }}
        style={{ width: "160px", height: "100px" }}
      />
      <p className={`radial-value ${colorClass}`}>{percentValue.toFixed(1)}%</p>
    </div>
  );
};


  return (
    <div className="vendor-metrics-page">
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
            onChange={e => setSelectedVendor(e.target.value)}
          >
            {vendors.map((v, idx) => (
              <option key={idx} value={v.vendor_name}>
                {v.vendor_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="score-legend">
        <span><span className="score-high status-dot"></span> Safe (≥ 75%)</span>
        <span><span className="score-medium status-dot"></span> Medium (40–74%)</span>
        <span><span className="score-low status-dot"></span> Danger (≤ 39%)</span>
      </div>

      {/* --- FIX 2: Handle case where vendor is not found --- */}
      {!vendor && selectedVendor ? (
        <div className="vendor-card">
          <h2 className="vendor-name">{selectedVendor}</h2>
          <p className="empty">No metrics data found for this vendor.</p>
        </div>
      ) : vendor ? (
        <div className="vendor-card">
          <h2 className="vendor-name">{vendor.vendor_name}</h2>

          <div className="metrics-grid">
            {Object.entries({
              "On Time Delivery": vendor.on_time_delivery_pct,
              "Delivery Accuracy": vendor.delivery_accuracy_pct,
              "Defect Rate": vendor.defect_rate_pct,
              "Rejection Rate": vendor.rejection_rate_pct,
              "Return Rate": vendor.return_rate_pct,
              "Order Completion Rate": vendor.order_completion_rate_pct,
              "Flexibility": vendor.flexibility_pct,
              "Price Stability": vendor.price_stability_pct,
              "Financial Stability": vendor.financial_stability_pct,
              "Geographic Risk": vendor.geographic_risk_pct,
              "Sustainability (ESG)": vendor.sustainability_esg_pct,
              "Collaboration": vendor.collaboration_pct
            }).map(([label, val], idx) => (
              <div key={idx} className="metric-box radial-box">
                <h3>{label}</h3>
                {renderGauge(val, 0, 1, label)}
              </div>
            ))}

            <div className="metric-box radial-box">
              <h3>Responsiveness</h3>
              {renderGauge(vendor.responsiveness_days, 0, 10, "Responsiveness")}
              <p className={getResponseClass(vendor.responsiveness_days)}>
                {formatDays(vendor.responsiveness_days)}
              </p>
            </div>

            <div className="metric-box radial-box">
              <h3>Supply Chain Disruptions</h3>
              {renderGauge(vendor.supply_chain_disruptions_count, 0, 12, "Supply Chain Disruptions")}
              <p className={getDisruptionClass(vendor.supply_chain_disruptions_count)}>
                {formatCount(vendor.supply_chain_disruptions_count)}
              </p>
            </div>

            <div className="metric-box radial-box">
              <h3>Years of Partnership</h3>
              {renderGauge(vendor.years_of_partnership, 0, 10, "Years of Partnership")}
              <p className={getYearsClass(vendor.years_of_partnership)}>
                {formatYears(vendor.years_of_partnership)}
              </p>
            </div>

            <div className="metric-box radial-box">
              <h3>ISO 9001 Certified</h3>
              {renderGauge(vendor.iso_9001 ? 1 : 0, 0, 1, "ISO 9001 Certified")}
              <p className={getIsoClass(vendor.iso_9001)}>
                {formatBoolean(vendor.iso_9001)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default VendorMetricsPage;


// import React, { useState, useEffect } from "react";
// import GaugeChart from "react-gauge-chart";
// import "../styles/VendorMetricsPage.css";

// const VendorMetricsPage = ({ setCurrentPage }) => {
//   const [vendors, setVendors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedVendor, setSelectedVendor] = useState("");

//   useEffect(() => {
//     const fetchVendors = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         //const response = await fetch("https://odooerp.staunchtec.com/api/vendors/all-metrics");
//         const response = await fetch("http://127.0.0.1:8000/api/vendors/all-metrics");
        
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         setVendors(Array.isArray(data) ? data : []);

//         const preSelectedVendor = sessionStorage.getItem("selectedVendor");
//         if (preSelectedVendor && data.some(v => v.vendor_name === preSelectedVendor)) {
//           setSelectedVendor(preSelectedVendor);
//           sessionStorage.removeItem("selectedVendor");
//         } else if (data.length > 0) {
//           setSelectedVendor(data[0].vendor_name);
//         }

//         setLoading(false);
//       } catch (err) {
//         console.error("Error fetching vendors:", err);
//         setError(err.message);
//         setLoading(false);
//       }
//     };

//     fetchVendors();
//   }, []);

//   const handleBackToSuppliers = () => {
//     if (setCurrentPage) setCurrentPage("vendors");
//     else window.location.href = "/vendors";
//   };

//   // ✅ NEW: Helper function to get color class based on percentage
//   const getPercentageClass = (percent) => {
//     if (percent >= 0.75) return "radial-value-high";    // Safe (≥ 75%)
//     if (percent >= 0.40) return "radial-value-medium";  // Medium (40–74%)
//     return "radial-value-low";                          // Danger (≤ 39%)
//   };

//   if (loading)
//     return (
//       <div className="vendor-metrics-page">
//         <p className="loading">Loading vendor metrics...</p>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="vendor-metrics-page">
//         <button className="back-btn" onClick={handleBackToSuppliers}>
//           ← Back to Suppliers
//         </button>
//         <div className="error-message">
//           <h2>Error Loading Vendor Metrics</h2>
//           <p>Failed to fetch vendor data: {error}</p>
//           <button onClick={() => window.location.reload()} className="retry-btn">
//             Retry
//           </button>
//         </div>
//       </div>
//     );

//   if (!vendors.length)
//     return (
//       <div className="vendor-metrics-page">
//         <button className="back-btn" onClick={handleBackToSuppliers}>
//           ← Back to Suppliers
//         </button>
//         <h1 className="title">Vendor Metrics</h1>
//         <p className="empty">No vendor metrics found.</p>
//       </div>
//     );

//   const vendor = vendors.find(v => v.vendor_name === selectedVendor);

//   const getResponseClass = days => {
//     if (days <= 3) return "score-high";
//     if (days <= 7) return "score-medium";
//     return "score-low";
//   };

//   const getDisruptionClass = count => {
//     if (count <= 4) return "score-high";
//     if (count <= 8) return "score-medium";
//     return "score-low";
//   };

//   const getYearsClass = years => {
//     if (years >= 5) return "score-high";
//     if (years >= 2) return "score-medium";
//     return "score-low";
//   };

//   const getIsoClass = value => (value ? "score-high" : "score-low");

//   const formatDays = value => (value !== undefined ? `${Math.round(value)} days` : "N/A");
//   const formatYears = value => (value !== undefined ? `${value.toFixed(1)} years` : "N/A");
//   const formatCount = value => (value !== undefined ? value.toString() : "N/A");
//   const formatBoolean = value => (value ? "Yes" : "No");

//   // ✅ UPDATED: Gauge logic with color-coded radial values
//   const renderGauge = (value, min = 0, max = 1, label = "") => {
//     if (value === undefined || value === null || value === "N/A")
//       return <p className="radial-value">N/A</p>;

//     let val = parseFloat(value);

//     // ISO 9001 Certified (two-color only)
//     if (label === "ISO 9001 Certified") {
//       return (
//         <div className="radial-meter-container">
//           <GaugeChart
//             id={`iso-meter-${Math.random()}`}
//             nrOfLevels={2}
//             arcsLength={[0.5, 0.5]}
//             colors={["#FF4E50", "#4CAF50"]}
//             percent={value ? 1 : 0}
//             arcWidth={0.3}
//             cornerRadius={0}
//             needleColor={value ? "#4CAF50" : "#FF4E50"}
//             needleBaseColor="#333"
//             hideText={true}
//             style={{ width: "160px", height: "100px" }}
//           />
//         </div>
//       );
//     }

//     if (
//       label === "Responsiveness" ||
//       label === "Supply Chain Disruptions" ||
//       label === "Years of Partnership"
//     ) {
//       let needleColor = "#4CAF50";
//       let percentValue = 0;
//       let arcsLength = [0.33, 0.33, 0.34];
//       let colors = [];

//       // Responsiveness: lower is better
//       if (label === "Responsiveness") {
//         if (val <= 3) needleColor = "#4CAF50";
//         else if (val <= 7) needleColor = "#F9D423";
//         else needleColor = "#FF4E50";
//         percentValue = Math.min(val / 10, 1);
//         colors = ["#4CAF50", "#F9D423", "#FF4E50"];
//       }

//       // Supply Chain Disruptions: lower is better
//       else if (label === "Supply Chain Disruptions") {
//         if (val <= 4) needleColor = "#4CAF50";
//         else if (val <= 8) needleColor = "#F9D423";
//         else needleColor = "#FF4E50";
//         percentValue = Math.min(val / 12, 1);
//         colors = ["#4CAF50", "#F9D423", "#FF4E50"];
//       }

      
//       else if (label === "Years of Partnership") {
//         if (val >= 5) needleColor = "#4CAF50";
//         else if (val >= 2) needleColor = "#F9D423";
//         else needleColor = "#FF4E50";
//         percentValue = Math.min(val / 10, 1);
//         colors = ["#FF4E50", "#F9D423", "#4CAF50"];
//       }

//       return (
//         <div className="radial-meter-container">
//           <GaugeChart
//             id={`radial-meter-${Math.random()}`}
//             nrOfLevels={100}
//             arcsLength={arcsLength}
//             colors={colors}
//             percent={percentValue}
//             arcWidth={0.3}
//             cornerRadius={0}
//             animate={true}
//             needleColor={needleColor}
//             needleBaseColor="#333"
//             hideText={true}
//             style={{ width: "160px", height: "100px" }}
//           />
//         </div>
//       );
//     }

//     // Default case for percentage metrics
//     let needleColor = "#4CAF50";
//     let valNorm = Math.min(Math.max(val, 0), 1);
//     if (valNorm < 0.4) needleColor = "#FF4E50";
//     else if (valNorm < 0.75) needleColor = "#F9D423";

//     // ✅ NEW: Apply color class based on percentage
//     const colorClass = getPercentageClass(valNorm);

//     return (
//       <div className="radial-meter-container">
//         <GaugeChart
//           id={`radial-meter-${Math.random()}`}
//           nrOfLevels={100}
//           arcsLength={[0.4, 0.35, 0.25]}
//           colors={["#FF4E50", "#F9D423", "#4CAF50"]}
//           percent={valNorm}
//           arcWidth={0.3}
//           cornerRadius={0}
//           needleColor={needleColor}
//           needleBaseColor="#333"
//           hideText={true}
//           style={{ width: "160px", height: "100px" }}
//         />
//         <p className={`radial-value ${colorClass}`}>{(valNorm * 100).toFixed(1)}%</p>
//       </div>
//     );
//   };

//   return (
//     <div className="vendor-metrics-page">
//       <div className="metrics-header">
//         <div className="title-with-back">
//           <button className="back-arrow" onClick={handleBackToSuppliers}>
//             ←
//           </button>
//           <h1 className="title">Vendor Metrics</h1>
//         </div>
//         <div className="vendor-selector">
//           <label htmlFor="vendors" className="vendor-label">
//             Choose Vendor:
//           </label>
//           <select
//             id="vendors"
//             className="vendor-select"
//             value={selectedVendor}
//             onChange={e => setSelectedVendor(e.target.value)}
//           >
//             {vendors.map((v, idx) => (
//               <option key={idx} value={v.vendor_name}>
//                 {v.vendor_name}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="score-legend">
//         <span><span className="score-high status-dot"></span> Safe (≥ 75%)</span>
//         <span><span className="score-medium status-dot"></span> Medium (40–74%)</span>
//         <span><span className="score-low status-dot"></span> Danger (≤ 39%)</span>
//       </div>

//       {vendor && (
//         <div className="vendor-card">
//           <h2 className="vendor-name">{vendor.vendor_name}</h2>

//           <div className="metrics-grid">
//             {Object.entries({
//               "On Time Delivery": vendor.on_time_delivery_pct,
//               "Delivery Accuracy": vendor.delivery_accuracy_pct,
//               "Defect Rate": vendor.defect_rate_pct,
//               "Rejection Rate": vendor.rejection_rate_pct,
//               "Return Rate": vendor.return_rate_pct,
//               "Order Completion Rate": vendor.order_completion_rate_pct,
//               "Flexibility": vendor.flexibility_pct,
//               "Price Stability": vendor.price_stability_pct,
//               "Financial Stability": vendor.financial_stability_pct,
//               "Geographic Risk": vendor.geographic_risk_pct,
//               "Sustainability (ESG)": vendor.sustainability_esg_pct,
//               "Collaboration": vendor.collaboration_pct
//             }).map(([label, val], idx) => (
//               <div key={idx} className="metric-box radial-box">
//                 <h3>{label}</h3>
//                 {renderGauge(val, 0, 1, label)}
//               </div>
//             ))}

//             <div className="metric-box radial-box">
//               <h3>Responsiveness</h3>
//               {renderGauge(vendor.responsiveness_days, 0, 10, "Responsiveness")}
//               <p className={getResponseClass(vendor.responsiveness_days)}>
//                 {formatDays(vendor.responsiveness_days)}
//               </p>
//             </div>

//             <div className="metric-box radial-box">
//               <h3>Supply Chain Disruptions</h3>
//               {renderGauge(vendor.supply_chain_disruptions_count, 0, 12, "Supply Chain Disruptions")}
//               <p className={getDisruptionClass(vendor.supply_chain_disruptions_count)}>
//                 {formatCount(vendor.supply_chain_disruptions_count)}
//               </p>
//             </div>

//             <div className="metric-box radial-box">
//               <h3>Years of Partnership</h3>
//               {renderGauge(vendor.years_of_partnership, 0, 10, "Years of Partnership")}
//               <p className={getYearsClass(vendor.years_of_partnership)}>
//                 {formatYears(vendor.years_of_partnership)}
//               </p>
//             </div>

//             <div className="metric-box radial-box">
//               <h3>ISO 9001 Certified</h3>
//               {renderGauge(vendor.iso_9001 ? 1 : 0, 0, 1, "ISO 9001 Certified")}
//               <p className={getIsoClass(vendor.iso_9001)}>
//                 {formatBoolean(vendor.iso_9001)}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VendorMetricsPage;