// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Core Components ---
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute'; // The gatekeeper component

// --- Page Components ---
// Note: Some of these might be in a /Pages folder, adjust paths as needed.
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import PlannedOrdersPage from './components/PlannedorderPage';
import InventoryPage from './components/InventoryPage';
import CustomersPage from './components/CustomersPage';
import VendorsPage from './components/VendorsPage';
import VendorMetricsPage from './components/VendorMetricsPage';
import UserManagement from './components/UserManagement';
import LoginPage from './Pages/LoginPage';
// We DO NOT import ForgotPasswordPage because it's part of LoginPage.
import ResetPasswordPage from './Pages/ResetPasswordPage'; // This is the page for the email link.

// --- Styles ---
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        {/* These routes are accessible to everyone, even unauthenticated users. */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* The /forgot-password logic is handled within the LoginPage component, so no separate route is needed. */}
        
        {/* This is the route for the link the user receives in their email. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* --- Protected Routes --- */}
        {/* The ProtectedRoute component acts as a gatekeeper for all nested routes. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {/* Redirect from the root path to the dashboard by default */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* All your main application pages are nested here and are now protected */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<ChatInterface />} />
            <Route path="orders" element={<PlannedOrdersPage />} />
            <Route path="inventory-dashboard" element={<InventoryPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="vendor-metrics" element={<VendorMetricsPage />} />
            <Route path="user-management" element={<UserManagement />} />
          </Route>
        </Route>

        {/* --- Catch-all for 404 Not Found --- */}
        <Route path="*" element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>404 - Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;