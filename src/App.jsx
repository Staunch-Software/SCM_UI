// src/App.jsx

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- Core Components ---
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// --- Page Components (Lazy Loaded for Performance) ---
const Dashboard = lazy(() => import('./components/Dashboard'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const PlannedOrdersPage = lazy(() => import('./components/PlannedorderPage'));
// --- NEW: Import the new components ---
const InventoryHub = lazy(() => import('./components/InventoryHub'));
const Product360 = lazy(() => import('./components/Product360'));
const CustomersPage = lazy(() => import('./components/CustomersPage'));
const VendorsPage = lazy(() => import('./components/VendorsPage'));
const VendorMetricsPage = lazy(() => import('./components/VendorMetricsPage'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const LoginPage = lazy(() => import('./Pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./Pages/ResetPasswordPage'));

// --- Styles ---
import './App.css';

// --- Loading Component ---
const PageLoader = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Loading Page...</h2>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="chat" element={<ChatInterface />} />
                <Route path="orders" element={<PlannedOrdersPage />} />

                {/* --- UPDATED INVENTORY ROUTES --- */}
                <Route path="inventory-hub" element={<InventoryHub />} />
                <Route path="products/:productId" element={<Product360 />} />

                <Route path="customers" element={<CustomersPage />} />
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="vendor-metrics" element={<VendorMetricsPage />} />
                <Route path="user-management" element={<UserManagement />} />
              </Route>
            </Route>

            {/* --- 404 Not Found --- */}
            <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}> <h2>404 - Page Not Found</h2> </div>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;