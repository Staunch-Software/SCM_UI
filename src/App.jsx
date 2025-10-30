// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <-- IMPORT THE PROVIDER

// --- Core Components ---
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute'; // The gatekeeper component

// --- Page Components ---
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import PlannedOrdersPage from './components/PlannedorderPage';
import InventoryPage from './components/InventoryPage';
import CustomersPage from './components/CustomersPage';
import VendorsPage from './components/VendorsPage';
import VendorMetricsPage from './components/VendorMetricsPage';
import UserManagement from './components/UserManagement';
import LoginPage from './Pages/LoginPage';
import ResetPasswordPage from './Pages/ResetPasswordPage';

// --- Styles ---
import './App.css';

const App = () => {
  return (
    // By wrapping everything in AuthProvider, the entire app has access
    // to the authentication state (user, isAuthenticated, etc.).
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* --- Protected Routes --- */}
          {/* The ProtectedRoute component now uses the AuthContext to reliably
              check if the user is logged in before rendering any nested routes. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
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
    </AuthProvider>
  );
};

export default App;