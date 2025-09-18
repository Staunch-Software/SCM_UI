import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <ChatInterface />
    </div>
  )
}

export default App
import React, { useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import PlannedOrdersPage from "./components/PlannedorderPage";
import InventoryPage from "./components/InventoryPage";
import CustomersPage from "./components/CustomersPage"; // ✅ import added
import ChatInterface from "./components/ChatInterface";
import VendorsPage from "./components/VendorsPage";
import { FaHome, FaComments } from "react-icons/fa";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div
          className={`sidebar-item ${currentPage === "dashboard" ? "active" : ""}`}
          onClick={() => setCurrentPage("dashboard")}
        >
          <FaHome className="sidebar-icon" />
          <span>Main Dashboard</span>
        </div>

        <div
          className={`sidebar-item ${currentPage === "chatbox" ? "active" : ""}`}
          onClick={() => setCurrentPage("chatbox")}
        >
          <FaComments className="sidebar-icon" />
          <span>Chatbox</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {currentPage === "dashboard" && (
          <Dashboard setCurrentPage={setCurrentPage} />
        )}

        {currentPage === "orders" && (
          <PlannedOrdersPage setCurrentPage={setCurrentPage} />
        )}

        {currentPage === "inventory" && (
          <InventoryPage setCurrentPage={setCurrentPage} />
        )}

        {currentPage === "customers" && (
          <CustomersPage setCurrentPage={setCurrentPage} /> 
        )}

        {currentPage === "vendors" && (
          <VendorsPage setCurrentPage={setCurrentPage} />
          )}

        {currentPage === "chatbox" && (
          <div className="chatbox">
            <div className="chatbox-body">
              <ChatInterface />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
