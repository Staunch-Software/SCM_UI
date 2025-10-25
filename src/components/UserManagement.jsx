import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Edit, Trash2, Lock, Unlock,
  Shield, RefreshCw, Search, CheckCircle, XCircle, Key
} from 'lucide-react';


import '../styles/UserManagement.css';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal'
import PermissionsModal from './PermissionsModal'
import '../styles/PermissionsModal.css';
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

  // Roles can be hardcoded or fetched from the API
  const roles = [
    'Administrator',
    'Supply Chain Manager',
    'Procurement Officer',
    'Inventory Manager'
  ];

  // --- DATA FETCHING ---

  // Fetch statistics from the backend
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await userAPI.getUserStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  // Fetch the initial list of users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const userList = await userAPI.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
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
        console.error('No access token found');
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';
      ws = new WebSocket(`${wsUrl}/api/admin/ws/user-updates?token=${token}`);

      // Connection timeout
      connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket connection timeout');
          ws.close();
        }
      }, 5000);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        clearTimeout(connectionTimeout);
        reconnectAttempts = 0;

        // Start ping/pong keepalive
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

        // Only reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms...`);

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
          console.log('📨 Real-time update:', data.type);

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

    // Initial connection
    connectWebSocket();

    // Cleanup
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

  // 3. Apply filters whenever the source data or filter criteria change
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
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
      alert('User created successfully!');
      // No manual refetch needed! The WebSocket will push the update.
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
      // No manual refetch needed!
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
      // No manual refetch needed!
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
      // We just need to update the is_active field
      await userAPI.updateUser(user.user_id, { is_active: !user.is_active });
      alert(`User ${action}d successfully.`);
      // No manual refetch needed!
    } catch (error) {
      console.error(`Error toggling user status:`, error);
      alert(error.response?.data?.detail || 'Failed to update user status.');
    }
  };

  const handleResetPassword = async (user) => {
  if (!window.confirm(
    `Reset password for ${user.name}?\n\n` +
    `A temporary password will be sent to ${user.email}.\n` +
    `The user will be required to change it on next login.`
  )) {
    return;
  }
  
  try {
    const response = await userAPI.resetPassword(user.user_id);
    alert(
      ` Password Reset Successful!\n\n` +
      `${response.message}\n\n` +
      `The user must change the password on their next login.`
    );
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
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info"><p className="stat-label">Total Users</p><p className="stat-value">{statistics.total_users}</p></div>
              <Users size={32} className="stat-icon icon-blue" />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info"><p className="stat-label">Active Users</p><p className="stat-value stat-success">{statistics.active_users}</p></div>
              <CheckCircle size={32} className="stat-icon icon-green" />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info"><p className="stat-label">Inactive Users</p><p className="stat-value stat-danger">{statistics.inactive_users}</p></div>
              <XCircle size={32} className="stat-icon icon-red" />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-info"><p className="stat-label">First Login Pending</p><p className="stat-value stat-warning">{statistics.first_login_pending}</p></div>
              <Key size={32} className="stat-icon icon-orange" />
            </div>
          </div>
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