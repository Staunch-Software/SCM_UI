// CreateUserModal.jsx
import React, { useState } from 'react';
import { UserPlus, X, Mail, User, Shield, AlertCircle } from 'lucide-react';
import '../styles/CreateUserModal.css';

const CreateUserModal = ({ onClose, onCreate, roles }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Procurement Officer'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
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
      await onCreate(formData);
      // Modal will be closed by parent component on success
    } catch (error) {
      console.error('Create user error:', error);
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

    // Clear error for this field
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
            <UserPlus size={24} />
            Create New User
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
            {/* Info Box */}
            <div className="info-box">
              <p>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                The system will auto-generate a User ID and secure temporary password.
                Credentials will be sent to the user's email.
              </p>
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

            {/* Email Field */}
            <div className="form-group">
              <label>
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@company.com"
                className={errors.email ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
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
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;