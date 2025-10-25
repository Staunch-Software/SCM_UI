// src/components/UserProfile.jsx

import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/userService'; 
import '../styles/UserProfile.css';

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get user data
  const user = authAPI.getCurrentUser() || {
    name: 'Guest User',
    email: 'guest@company.com',
    role: 'Guest',
    user_id: 'GUEST'
  };

  // Generate avatar initials
  const getAvatarInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarInitials = getAvatarInitials(user.name);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authAPI.logout();
      navigate('/login');
      console.log('User logged out successfully');
    }
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  const handleUserManagement = () => {
    navigate('/user-management');
    setIsOpen(false);
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  // Check if user is admin
  const isAdmin = authAPI.isAdmin();

  return (
    <div className="user-profile-container" ref={dropdownRef}>
      <button 
        className="user-profile-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <div className="user-avatar">
          {avatarInitials}
        </div>
        <span className="user-name-display">{user.name.split(' ')[0]}</span>
        <ChevronDown size={10} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="user-profile-dropdown">
          {/* User Info Card */}
          <div className="user-info-card">
            <div className="user-profile-avatar-wrapper">
              <div className="user-avatar-large">
                {avatarInitials}
              </div>
              <div className="user-info-text">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
            <div className="user-role-badge">
              {user.role}
            </div>
          </div>

          {/* Menu Section */}
          <div className="user-profile-menu">
            {/* Account Section */}
            <div className="menu-section">
              <div className="menu-section-title">Account</div>
              
              <button className="profile-menu-item" onClick={handleProfile}>
                <div className="menu-item-icon">
                  <User size={16} />
                </div>
                <div className="menu-item-content">
                  <div className="menu-item-title">My Profile</div>
                  <div className="menu-item-subtitle">View and edit profile</div>
                </div>
              </button>

              <button className="profile-menu-item" onClick={handleSettings}>
                <div className="menu-item-icon">
                  <Settings size={16} />
                </div>
                <div className="menu-item-content">
                  <div className="menu-item-title">Settings</div>
                  <div className="menu-item-subtitle">Preferences & privacy</div>
                </div>
              </button>
            </div>

            {/* Admin Section (only for admins) */}
            {isAdmin && (
              <div className="menu-section">
                <div className="menu-section-title">Management</div>
                
                <button className="profile-menu-item" onClick={handleUserManagement}>
                  <div className="menu-item-icon">
                    <Users size={16} />
                  </div>
                  <div className="menu-item-content">
                    <div className="menu-item-title">User Management</div>
                    <div className="menu-item-subtitle">Manage users & roles</div>
                  </div>
                </button>
              </div>
            )}

            {/* Logout */}
            <button className="profile-menu-item logout" onClick={handleLogout}>
              <div className="menu-item-icon">
                <LogOut size={16} />
              </div>
              <div className="menu-item-content">
                <div className="menu-item-title">Logout</div>
                <div className="menu-item-subtitle">Sign out of account</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;