import React from "react";
import "../styles/dashboard.css";


const Dashboard = ({ setCurrentPage }) => {
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">🚗 Supply Chain AI Dashboard</h1>
      <p className="dashboard-subtitle">Welcome to our smart SCM assistant ✨</p>

      {/* Header Buttons Row */}
      <div className="dashboard-buttons">
        <button onClick={() => setCurrentPage("orders")} className="nav-btn orders-btn">
          📦 Planned Orders
        </button>
        <button onClick={() => setCurrentPage("inventory")} className="nav-btn inventory-btn">
          📊 Inventory
        </button>
        <button onClick={() => setCurrentPage("customers")} className="nav-btn customers-btn">
          👥 Customers
        </button>
        <button onClick={() => setCurrentPage("vendors")} className="nav-btn vendors-btn">
          🏢 Vendors
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
