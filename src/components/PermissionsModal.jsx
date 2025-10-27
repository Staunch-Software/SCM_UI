import React, { useState, useEffect } from 'react';
import { Shield, X, Check } from 'lucide-react';
import { userAPI } from '../services/userService';
import '../styles/PermissionsModal.css';

const PermissionsModal = ({ user, onClose }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await userAPI.getUserPermissions(user.user_id);
        setPermissions(data.permissions);
      } catch (err) {
        console.error('Failed to load permissions:', err);
        setError(err.response?.data?.detail || 'Failed to load permissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Shield size={24} />
            User Permissions
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="permissions-user-header">
            <div className="user-avatar">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <span className="badge badge-purple">{user.role}</span>
          </div>

          <div className="permissions-content">
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading Permissions...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p className="error-message">{error}</p>
              </div>
            )}

            {permissions && !loading && !error && (
              <div className="permissions-grid">
                {Object.entries(permissions).map(([moduleName, actions]) => (
                  <div key={moduleName} className="permission-module">
                    <h3 className="module-title">
                      {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                    </h3>
                    <div className="permission-actions">
                      {Array.isArray(actions) && actions.length > 0 ? (
                        actions.map(action => (
                          <span key={action} className="permission-badge">
                            <Check size={14} />
                            {action}
                          </span>
                        ))
                      ) : (
                        <span className="permission-badge-empty">No permissions</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsModal;