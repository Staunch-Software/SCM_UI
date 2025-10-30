// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/userService';
import apiClient from '../services/apiclient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Important for initial load

  useEffect(() => {
    // This effect runs once when the app first loads.
    // It checks if a token and user already exist in localStorage.
    const token = localStorage.getItem('accessToken');
    const currentUser = authAPI.getCurrentUser();

    if (token && currentUser) {
      // If they exist, we assume the user is logged in.
      // We set the default Authorization header for all future API calls.
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    // We're done checking, so we can stop showing a loading state.
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    // This function handles the login logic.
    const data = await authAPI.login(username, password);
    
    // authAPI.login already saved to localStorage.
    // Now, we set the default header for the current session.
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token.access_token}`;
    
    // Finally, we update our global state.
    setUser(data.user);
    setIsAuthenticated(true);
    return data; // Return data in case the caller needs it
  };

  const logout = () => {
    // This function handles logout.
    authAPI.logout(); // Clears localStorage
    
    // Remove the default Authorization header.
    delete apiClient.defaults.headers.common['Authorization'];
    
    // Update our global state.
    setUser(null);
    setIsAuthenticated(false);
  };

  // The value provided to all children components.
  const value = { user, isAuthenticated, isLoading, login, logout };

  // We don't render the children until the initial loading check is complete.
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// This is a custom hook that makes it easy to access the context.
export const useAuth = () => {
  return useContext(AuthContext);
};