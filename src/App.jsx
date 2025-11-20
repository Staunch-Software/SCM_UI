// src/App.jsx

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- Core Components ---
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// --- Page Components (Lazy Loaded for Performance) ---
// --- THE FIX IS HERE: Ensure ALL components used in Routes are imported ---
const Dashboard = lazy(() => import('./components/Dashboard'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const PlannedOrdersPage = lazy(() => import('./components/PlannedorderPage'));
const InventoryHub = lazy(() => import('./components/InventoryHub'));
const Product360 = lazy(() => import('./components/Product360'));
const CustomersPage = lazy(() => import('./components/CustomersPage'));
const VendorsPage = lazy(() => import('./components/VendorsPage'));
const VendorMetricsPage = lazy(() => import('./components/VendorMetricsPage'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const LoginPage = lazy(() => import('./Pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./Pages/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('./components/OnboardingPage'));
const SyncingPage = lazy(() => import('./components/SyncingPage'));

// --- Styles ---
import './App.css';

// --- Loading Component ---
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <h2>Loading Application...</h2>
  </div>
);

// --- Onboarding Route Guard Component ---
const OnboardingGuard = ({ children }) => {
  const { tenant, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (tenant) {
    if (tenant.onboarding_status === 'completed') {
      return children; // Show the main app (Layout)
    } else if (tenant.onboarding_status === 'syncing') {
      return <SyncingPage />; // Show the syncing page
    } else {
      // Status is 'pending_credentials' or 'failed'
      return <OnboardingPage />; // Show the ERP setup page
    }
  }
  
  // If no tenant, the ProtectedRoute will handle redirection to login
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* This route is outside the guard so it can be accessed during the syncing process */}
            <Route path="/syncing-data" element={<SyncingPage />} />

            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoute />}>
              <Route 
                path="/" 
                element={
                  <OnboardingGuard>
                    <Layout />
                  </OnboardingGuard>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="chat" element={<ChatInterface />} />
                <Route path="orders" element={<PlannedOrdersPage />} />
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