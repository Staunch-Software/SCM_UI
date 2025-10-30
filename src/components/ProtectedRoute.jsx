// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <-- IMPORT THE CUSTOM HOOK

const ProtectedRoute = () => {
  // Get the reliable authentication state from our global context.
  const { isAuthenticated, isLoading } = useAuth();

  // While the context is performing its initial check for a token on app load,
  // we can show a loading indicator. This prevents a flicker where the user
  // is briefly redirected to /login before the app realizes they are already logged in.
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading Application...</h2>
      </div>
    );
  }

  // After the check is complete:
  // If the user is authenticated, render the child route (e.g., the dashboard).
  // The <Outlet /> is a placeholder for the actual page component.
  if (isAuthenticated) {
    return <Outlet />;
  }

  // If the user is not authenticated, redirect them to the login page.
  // The 'replace' prop prevents the user from using the browser's back button
  // to return to the protected page after being redirected.
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;