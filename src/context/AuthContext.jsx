// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/userService';
import apiClient from '../services/apiclient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const currentUser = authAPI.getCurrentUser();
    const currentTenant = authAPI.getCurrentTenant();
    
    if (token && currentUser && currentTenant) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(currentUser);
      setTenant(currentTenant);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token.access_token}`;
    setUser(data.user);
    setTenant(data.tenant);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    authAPI.logout();
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setTenant(null);
    setIsAuthenticated(false);
  };

  // --- FIX: Robust LocalStorage Update ---
  const completeOnboarding = () => {
    // We use the current state or fetch from LS if state is stale
    const currentTenant = tenant || authAPI.getCurrentTenant();
    const currentUser = user || authAPI.getCurrentUser();

    if (currentTenant && currentUser) {
      const updatedTenant = { ...currentTenant, onboarding_status: 'completed' };
      const updatedUser = { ...currentUser, onboarding_completed: true };

      // 1. Update State
      setTenant(updatedTenant);
      setUser(updatedUser);

      // 2. Update Local Storage (Critical for page reload)
      localStorage.setItem('currentTenant', JSON.stringify(updatedTenant));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      console.log("AuthContext: Onboarding marked complete in LocalStorage");
    }
  };

  const value = { user, tenant, isAuthenticated, isLoading, login, logout, completeOnboarding };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};