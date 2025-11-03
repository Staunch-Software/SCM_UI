import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Edit, Trash2, Lock, Unlock,
  Shield, RefreshCw, Search, CheckCircle, XCircle, Key
} from 'lucide-react';

import '../styles/UserManagement.css';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import PermissionsModal from './PermissionsModal';
import { userAPI } from '../services/userService';

const UserManagement = () => {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const roles = [
    'Administrator',
    'Supply Chain Manager',
    'Procurement Officer',
    'Inventory Manager'
  ];

  // --- DATA FETCHING ---

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await userAPI.getUserStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Don't alert here, as it can be annoying if the session expires.
      // The main fetchUsers alert is enough.
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const userList = await userAPI.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      // This alert is helpful when the initial page load fails.
      alert('Failed to fetch users. Your session may have expired.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [fetchUsers, fetchStatistics]);

  // 2. Real-time updates via WebSocket
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let connectionTimeout = null;
    let pingInterval = null;
    const maxReconnectAttempts = 5;
    let reconnectAttempts = 0;

    const connectWebSocket = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found for WebSocket connection.');
        return;
      }

      // --- THIS IS THE DYNAMIC, PRODUCTION-READY WEBSOCKET URL LOGIC ---
      // 1. Determine the correct protocol (ws:// for http, wss:// for https)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // 2. Use the current page's host. This works for localhost and your production domain.
      const wsHost = window.location.host;

      // 3. Construct the final, dynamic URL. Nginx will proxy this to your backend.
      const wsUrl = `${wsProtocol}//${wsHost}/api/admin/ws/user-updates?token=${token}`;

      console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
      ws = new WebSocket(wsUrl);
      // --- END OF CORRECTED LOGIC ---

      connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket connection timeout');
          ws.close();
        }
      }, 5000);

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully.');
        clearTimeout(connectionTimeout);
        reconnectAttempts = 0;

        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed: ${event.code}`);
        clearTimeout(connectionTimeout);
        if (pingInterval) clearInterval(pingInterval);

        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 Reconnecting WebSocket in ${delay}ms...`);

          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;

        try {
          const data = JSON.parse(event.data);
          console.log('📨 Real-time update received:', data.type);

          setUsers(currentUsers => {
            switch (data.type) {
              case 'user_created':
                return [data.payload, ...currentUsers];
              case 'user_updated':
                return currentUsers.map(user =>
                  user.user_id === data.payload.user_id ? data.payload : user
                );
              case 'user_deleted':
                return currentUsers.filter(user => user.user_id !== data.payload.user_id);
              default:
                return currentUsers;
            }
          });

          fetchStatistics();
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingInterval) clearInterval(pingInterval);

      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;

        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Component unmounted');
        }
      }
    };
  }, [fetchStatistics]);

  // 3. Apply filters
  useEffect(() => {
    let filtered = users;
    const lowercasedTerm = searchTerm.toLowerCase();

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(lowercasedTerm) ||
        user.email.toLowerCase().includes(lowercasedTerm) ||
        user.user_id.toLowerCase().includes(lowercasedTerm)
      );
    }
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user =>
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active)
      );
    }
    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, filterStatus, users]);

  // --- ACTION HANDLERS ---

  const handleCreateUser = async (userData) => {
    try {
      await userAPI.createUser(userData);
      setShowCreateModal(false);
      alert('User created successfully! A welcome email has been sent.');
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.detail || 'Failed to create user.');
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await userAPI.updateUser(userId, updates);
      setShowEditModal(false);
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.detail || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await userAPI.deleteUser(user.user_id);
      alert('User deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }
    try {
      await userAPI.updateUser(user.user_id, { is_active: !user.is_active });
      alert(`User ${action}d successfully.`);
    } catch (error) {
      console.error(`Error toggling user status:`, error);
      alert(error.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(
      `Reset password for ${user.name}?\n\nA temporary password will be sent to ${user.email}.`
    )) {
      return;
    }
    try {
      const response = await userAPI.resetPassword(user.user_id);
      alert(response.message || 'Password reset successfully. An email has been sent to the user.');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(error.response?.data?.detail || 'Failed to reset password.');
    }
  };

  // --- HELPER FUNCTIONS ---
  const getRoleBadgeColor = (role) => {
    const colors = {
      'Administrator': 'badge-purple',
      'Supply Chain Manager': 'badge-blue',
      'Procurement Officer': 'badge-green',
      'Inventory Manager': 'badge-orange'
    };
    return colors[role] || 'badge-gray';
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading User Management...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="um-header">
        <div className="um-header-content">
          <div className="um-title-section">
            <h1 className="um-title"><Users size={32} /> User Management</h1>
            <p className="um-subtitle">Manage users, roles, and permissions in real-time.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <UserPlus size={20} /> Create User
          </button>
        </div>

        {/* Filters */}
        <div className="um-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            {roles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="stats-grid">
          {/* ... statistics cards ... */}
        </div>
      )}

      {/* Users Table */}
      <div className="um-table-container">
        <table className="um-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  <Users size={48} />
                  <p>No users found matching your criteria.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.user_id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">{user.name.split(' ').map(n => n[0]).join('')}</div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                        <div className="user-id">{user.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${getRoleBadgeColor(user.role)}`}>{user.role}</span></td>
                  <td>
                    <div className="status-badges">
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {user.first_login && <span className="badge badge-warning">First Login</span>}
                    </div>
                  </td>
                  <td className="text-muted">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => { setSelectedUser(user); setShowPermissionsModal(true); }} className="btn-icon btn-icon-primary" title="View Permissions"><Shield size={18} /></button>
                      <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }} className="btn-icon btn-icon-blue" title="Edit User"><Edit size={18} /></button>
                      <button onClick={() => handleToggleStatus(user)} className={`btn-icon ${user.is_active ? 'btn-icon-warning' : 'btn-icon-success'}`} title={user.is_active ? 'Deactivate' : 'Activate'}>
                        {user.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                      {/* Re-enabled the reset password button */}
                      {/* <button onClick={() => handleResetPassword(user)} className="btn-icon btn-icon-purple" title="Reset Password"><RefreshCw size={18} /></button> */}
                      <button onClick={() => handleDeleteUser(user)} className="btn-icon btn-icon-danger" title="Delete User"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateUser}
          roles={roles}
        />
      )}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateUser}
          roles={roles}
        />
      )}
      {showPermissionsModal && selectedUser && (
        <PermissionsModal
          user={selectedUser}
          onClose={() => setShowPermissionsModal(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;