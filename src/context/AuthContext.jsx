// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/userService';
import apiClient from '../services/apiclient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const currentUser = authAPI.getCurrentUser();
    if (token && currentUser) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authAPI.login(username, password);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token.access_token}`;
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    authAPI.logout();
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = { user, isAuthenticated, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};