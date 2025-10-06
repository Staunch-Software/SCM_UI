import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
// Import your page components
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import PlannedOrdersPage from './components/PlannedorderPage';
import InventoryPage from './components/InventoryPage';
import CustomersPage from './components/CustomersPage';
import VendorsPage from './components/VendorsPage';
import VendorMetricsPage from './components/VendorMetricsPage';

import './App.css';

const App = () => {
  return (
    // Now that BrowserRouter is imported, this will work
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<ChatInterface />} />
          <Route path="orders" element={<PlannedOrdersPage />} />
          <Route path="inventory-analysis" element={<InventoryPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="vendor-metrics" element={<VendorMetricsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;