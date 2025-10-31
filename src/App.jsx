// src/App.jsx

import React, { Suspense, lazy } from 'react'; // <-- IMPORT Suspense and lazy
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- Core Components ---
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

<<<<<<< HEAD
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
import ProductDetailsPage from './components/ProductDetailsPage';
=======
// --- Page Components (Lazy Loaded for Performance) ---
// Instead of importing components directly, we use React.lazy.
// This tells the browser to only download the JavaScript for a page
// when the user actually navigates to it.
const Dashboard = lazy(() => import('./components/Dashboard'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const PlannedOrdersPage = lazy(() => import('./components/PlannedorderPage'));
const InventoryPage = lazy(() => import('./components/InventoryPage'));
const CustomersPage = lazy(() => import('./components/CustomersPage'));
const VendorsPage = lazy(() => import('./components/VendorsPage'));
const VendorMetricsPage = lazy(() => import('./components/VendorMetricsPage'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const LoginPage = lazy(() => import('./Pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./Pages/ResetPasswordPage'));
>>>>>>> f29a11e023d6ce9cbdd876905d22ab066d5e534c

// --- Styles ---
import './App.css';

// A simple loading component to show while a page's code is being downloaded.
const PageLoader = () => (
  <div style={{ padding: '2rem', textAlign: 'center', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <h2>Loading Page...</h2>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* The Suspense component will show the 'fallback' UI (our PageLoader)
            any time a lazy-loaded component is being fetched over the network. */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

<<<<<<< HEAD
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
            <Route path="/product/:productId" element={<ProductDetailsPage />} />
          </Route>
        </Route>
=======
            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* All these routes now use lazy loading */}
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
>>>>>>> f29a11e023d6ce9cbdd876905d22ab066d5e534c

            {/* --- Catch-all for 404 Not Found --- */}
            <Route path="*" element={
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>404 - Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
              </div>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;