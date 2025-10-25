// src/components/EditUserModal.jsx
import React, { useState, useEffect } from 'react';
import { Edit, X, Mail, User, Shield } from 'lucide-react';
import '../styles/EditUserModal.css';

const EditUserModal = ({ user, onClose, onUpdate, roles }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Pre-fill form when the user prop is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Only pass the fields that can be updated
      const updates = {
        name: formData.name,
        role: formData.role,
      };
      await onUpdate(user.user_id, updates);
      // The parent component will close the modal on success
    } catch (error) {
      console.error('Update user error:', error);
      alert('Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear the error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>
            <Edit size={24} />
            Edit User
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* User Info Display */}
            <div className="user-info-display">
              <p><strong>User ID:</strong> {user.user_id}</p>
            </div>

            {/* Name Field */}
            <div className="form-group">
              <label>
                <User size={16} />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={errors.name ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div className="form-group">
              <label>
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                disabled
              />
            </div>

            {/* Role Field */}
            <div className="form-group">
              <label>
                <Shield size={16} />
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={errors.role ? 'input-error' : ''}
                disabled={loading}
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.role && (
                <span className="error-message">{errors.role}</span>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;