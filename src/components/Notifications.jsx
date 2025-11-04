// Notifications.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, X, Settings, AlertCircle, Clock, CheckCircle, FileText, Check } from 'lucide-react';
import '../styles/Notifications.css'; // Ensure you have this CSS file for styling

// This API service should point to your actual backend endpoints.
import { notificationApi } from '../services/notificationApi'; // Make sure this path is correct

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // In a real application, this session ID would come from your authentication context or user state.
  const sessionId = 'inventory_dashboard_session';

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const fetchNotifications = useCallback(async () => {
    if (!sessionId) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationApi.getNotifications(sessionId, 50, false);
      const mappedNotifications = data.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        subtitle: n.message,
        time: getRelativeTime(n.created_at),
        isRead: n.is_read,
        severity: n.severity,
        type: n.type,
        action: n.metadata?.action
      }));
      setNotifications(mappedNotifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) fetchNotifications();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [sessionId, isOpen, fetchNotifications]);

  // Effect for handling the real-time WebSocket connection with authentication
  useEffect(() => {
    if (!sessionId) return;

    // --- CRITICAL FIX for Authentication ---
    // Retrieve the auth token from where you store it (e.g., localStorage, cookies, state management).
    // This is a placeholder; you MUST replace it with your actual token retrieval logic.
    const authToken = localStorage.getItem('user_token');

    if (!authToken) {
      console.error("Authentication token not found. WebSocket connection will not be established.");
      return; // Abort connection if user is not logged in
    }

    // --- CRITICAL FIX for Environment Variable & URL Construction ---
    // This uses the variable from your .env file and appends the session ID and auth token.
    const wsUrl = `${process.env.VITE_WEBSOCKET_URL}/${sessionId}?token=${authToken}`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('WebSocket connection established');
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket connection closed');

    ws.onmessage = (event) => {
      const newNotificationData = JSON.parse(event.data);
      const formattedNotification = {
        id: newNotificationData.id,
        title: newNotificationData.title,
        subtitle: newNotificationData.message,
        time: getRelativeTime(newNotificationData.created_at),
        isRead: newNotificationData.is_read,
        severity: newNotificationData.severity,
        type: newNotificationData.type,
        action: newNotificationData.metadata?.action
      };
      setNotifications(prev => [formattedNotification, ...prev]);
      if (!formattedNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    };

    // Cleanup: close the WebSocket connection when the component unmounts
    return () => ws.close();
  }, [sessionId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
      setUnreadCount(prev => prev + 1);
    }
  };

  const dismissNotification = async (id) => {
    const dismissedNotif = notifications.find(n => n.id === id);
    const originalNotifications = [...notifications];
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (dismissedNotif && !dismissedNotif.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await notificationApi.dismissNotification(id);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      setNotifications(originalNotifications);
      if (dismissedNotif && !dismissedNotif.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!sessionId || unreadCount === 0) return;
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead(sessionId);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  };

  const getNotificationIcon = (severity) => {
    const iconMap = {
      error: <AlertCircle size={20} />,
      warning: <Clock size={20} />,
      success: <CheckCircle size={20} />,
      info: <FileText size={20} />
    };
    return iconMap[severity] || <Bell size={20} />;
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    return n.severity === { critical: 'error', warnings: 'warning', success: 'success' }[activeFilter];
  });

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button className="notification-bell" onClick={() => setIsOpen(!isOpen)} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <div className="header-content">
              <Bell size={20} className="header-icon" />
              <h3 className="notifications-title">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="filters-container">
            {[
              { key: 'all', label: 'All', color: '#3b82f6' },
              { key: 'critical', label: 'Critical', color: '#ef4444' },
              { key: 'warnings', label: 'Warnings', color: '#f59e0b' },
              { key: 'success', label: 'Success', color: '#10b981' }
            ].map(filter => (
              <button key={filter.key} className={`filter-button ${activeFilter === filter.key ? 'active' : ''}`} onClick={() => setActiveFilter(filter.key)}>
                <span className="filter-dot" style={{ backgroundColor: filter.color }} />
                {filter.label}
              </button>
            ))}
          </div>

          <div className="notifications-list">
            {isLoading && notifications.length === 0 ? (
              <div className="empty-state"><Bell size={48} className="empty-icon" /><p className="empty-text">Loading notifications...</p></div>
            ) : error ? (
              <div className="empty-state"><AlertCircle size={48} className="error-icon" /><p className="error-text">{error}</p></div>
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-state"><Bell size={48} className="empty-icon" /><p className="empty-text">No notifications yet</p><p className="empty-subtext">You're all caught up!</p></div>
            ) : (
              filteredNotifications.map((notification) => (
                <div key={notification.id} className={`notification-item ${!notification.isRead ? 'unread' : ''}`} onClick={() => !notification.isRead && markAsRead(notification.id)}>
                  <div className="notification-avatar" data-severity={notification.severity}>
                    {getNotificationIcon(notification.severity)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-subtitle">{notification.subtitle}</div>
                    <div className="notification-footer">
                      <span className="notification-time">{notification.time}</span>
                      {notification.action && <button className="action-button">{notification.action}</button>}
                    </div>
                  </div>
                  <button className="close-button" onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }} title="Dismiss">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="notifications-footer">
            <button className="settings-button">
              <Settings size={16} /> <span>Notification Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;