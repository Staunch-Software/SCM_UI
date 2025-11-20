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

  const completeOnboarding = () => {
    if (tenant) {
      const updatedTenant = { ...tenant, onboarding_complete: true };
      setTenant(updatedTenant);
      localStorage.setItem('currentTenant', JSON.stringify(updatedTenant));
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