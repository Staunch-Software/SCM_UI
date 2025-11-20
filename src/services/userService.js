// src/services/userService.js
import apiClient from './apiclient';

// --- AUTHENTICATION API ---
export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.token) {
      localStorage.setItem('accessToken', response.data.token.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      localStorage.setItem('currentTenant', JSON.stringify(response.data.tenant));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentTenant');
  },

  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {
      return null;
    }
  },

  getCurrentTenant: () => {
    try {
      return JSON.parse(localStorage.getItem('currentTenant'));
    } catch (e) {
      return null;
    }
  },

  isAdmin: () => {
    const user = authAPI.getCurrentUser();
    return user?.role === 'Administrator';
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, new_password) => {
    const response = await apiClient.post('/api/auth/reset-password', { token, new_password });
    return response.data;
  },
};

// --- USER MANAGEMENT API ---
export const userAPI = {
  getAllUsers: async () => {
    const response = await apiClient.get('/api/admin/users');
    return response.data;
  },
 
  getUserStatistics: async () => {
    const response = await apiClient.get('/api/admin/users/statistics');
    return response.data;
  },
  createUser: async (userData) => {
    const response = await apiClient.post('/api/admin/users', userData);
    return response.data;
  },
  updateUser: async (userId, updates) => {
    const response = await apiClient.put(`/api/admin/users/${userId}`, updates);
    return response.data;
  },
  getUserPermissions: async (userId) => {
    const response = await apiClient.get(`/api/admin/users/${userId}/permissions`);
    return response.data;
  },
  deleteUser: async (userId) => {
    await apiClient.delete(`/api/admin/users/${userId}`);
  },
  resetPassword: async (userId) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/reset-password`);
    return response.data;
  },
  unlockUser: async (userId) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/unlock`);
    return response.data;
  },
  getRoles: async () => {
    const response = await apiClient.get('/api/roles');
    return response.data;
  },
};