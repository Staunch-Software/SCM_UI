// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authAPI } from '../services/userService';

const ProtectedRoute = () => {
  const currentUser = authAPI.getCurrentUser();

  // If there is no user in localStorage, redirect to the login page.
  // The 'replace' prop prevents the user from going back to the protected page
  // with the browser's back button.
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If the user is logged in, render the child route content.
  // The <Outlet /> component is a placeholder for the actual page component.
  return <Outlet />;
};

export default ProtectedRoute;