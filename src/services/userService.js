// src/services/userService.js
import apiClient from './apiClient';

// --- AUTHENTICATION API ---
export const authAPI = {
  login: async (username, password) => {
    // FastAPI's OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Store token and user data on successful login
    if (response.data.token) {
      localStorage.setItem('accessToken', response.data.token.access_token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {
      return null;
    }
  },

  isAdmin: () => {
    const user = authAPI.getCurrentUser();
    return user?.role === 'Administrator';
  },

  // --- ADD THIS MISSING FUNCTION ---
  forgotPassword: async (email) => {
    // This function makes the POST request to your backend endpoint
    // and sends the email in the request body.
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data; // Returns the success message from the API
  },

  // --- ADD THIS FUNCTION FOR THE NEXT STEP (RESETTING THE PASSWORD) ---
  resetPassword: async (token, new_password) => {
    const response = await apiClient.post('/api/auth/reset-password', { token, new_password });
    return response.data;
  },
};


// --- USER MANAGEMENT API ---
export const userAPI = {
  // GET /api/admin/users
  getAllUsers: async () => {
    const response = await apiClient.get('/api/admin/users');
    return response.data;
  },

  // GET /api/admin/users/statistics
  getUserStatistics: async () => {
    const response = await apiClient.get('/api/admin/users/statistics');
    return response.data;
  },

  // POST /api/admin/users
  createUser: async (userData) => {
    const response = await apiClient.post('/api/admin/users', userData);
    return response.data;
  },

  // PUT /api/admin/users/{user_id}
  updateUser: async (userId, updates) => {
    const response = await apiClient.put(`/api/admin/users/${userId}`, updates);
    return response.data;
  },

  getUserPermissions: async (userId) => {
    const response = await apiClient.get(`/api/admin/users/${userId}/permissions`);
    return response.data;
  },

  // DELETE /api/admin/users/{user_id}
  deleteUser: async (userId) => {
    await apiClient.delete(`/api/admin/users/${userId}`);
  },

  // POST /api/admin/users/{user_id}/reset-password
  resetPassword: async (userId) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/reset-password`);
    return response.data;
  },
  
  // POST /api/admin/users/{user_id}/unlock
  unlockUser: async (userId) => {
    const response = await apiClient.post(`/api/admin/users/${userId}/unlock`);
    return response.data;
  },

  // GET /api/roles
  getRoles: async () => {
    const response = await apiClient.get('/api/roles');
    return response.data;
  },
};