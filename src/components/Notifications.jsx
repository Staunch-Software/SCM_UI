import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import '../styles/Notifications.css';
import { notificationApi } from '../services/notificationApi';
import { useChatStore } from '../stores/chatStore';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  const sessionId = useChatStore((state) => state.sessionId);

  const fetchNotifications = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const data = await notificationApi.getNotifications(sessionId);
      
      const mappedNotifications = data.notifications.map((n) => ({
        id: n.id,
        title: formatNotificationTitle(n),
        subtitle: formatNotificationSubtitle(n),
        time: getRelativeTime(n.created_at),
        isRead: n.is_read,
        avatar: getNotificationAvatar(n.type),
        avatarColor: getNotificationColor(n.severity, n.type),
        metadata: n.metadata,
        type: n.type,
        severity: n.severity
      }));
      
      setNotifications(mappedNotifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchNotifications();
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 10000);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionId]);

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

  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const dismissNotification = async (id) => {
    try {
      await notificationApi.dismissNotification(id);
      const dismissedNotif = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (!dismissedNotif?.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!sessionId) return;
    
    try {
      await notificationApi.markAllAsRead(sessionId);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Format notification title to be single-line and highlight key info
  const formatNotificationTitle = (notification) => {
    const { type, title, message, metadata } = notification;
    
    switch(type) {
      case 'order_created':
        const orderId = metadata?.odoo_id || 'N/A';
        const supplier = metadata?.supplier || metadata?.product || 'Unknown';
        return (
          <>
            <strong>Purchase Order Created</strong> - PO <strong>#{orderId}</strong> for <strong>{supplier}</strong>
          </>
        );
      
      case 'execution_success':
        const count = metadata?.success_count || 1;
        return (
          <>
            <strong>Plan Executed Successfully</strong> - <strong>{count}</strong> order(s) processed
          </>
        );
      
      case 'execution_error':
        const failedCount = metadata?.failed_count || 0;
        return (
          <>
            <strong>Execution Error</strong> - <strong>{failedCount}</strong> order(s) failed
          </>
        );
      
      case 'validation_error':
        return (
          <>
            <strong>Validation Failed</strong> - {message}
          </>
        );
      
      case 'order_failed':
        const failedOrderId = metadata?.order_id || 'N/A';
        return (
          <>
            <strong>Order Creation Failed</strong> - Order <strong>{failedOrderId}</strong>
          </>
        );
      
      default:
        return <><strong>{title}</strong> - {message}</>;
    }
  };

  // Format subtitle with additional context
  const formatNotificationSubtitle = (notification) => {
    const { type, message, metadata } = notification;
    
    switch(type) {
      case 'order_created':
        return null; // No subtitle needed, all info in title
      
      case 'execution_success':
        return metadata?.failed_count > 0 
          ? `${metadata.failed_count} order(s) had errors` 
          : null;
      
      case 'execution_error':
      case 'validation_error':
      case 'order_failed':
        return metadata?.error || message;
      
      default:
        return message;
    }
  };

  const getNotificationAvatar = (type) => {
    const avatarMap = {
      'execution_success': 'SY',
      'execution_error': 'ER',
      'order_created': 'OM',
      'order_failed': 'ER',
      'validation_error': 'VA'
    };
    return avatarMap[type] || 'SY';
  };

  const getNotificationColor = (severity, type) => {
    // Priority 1: Severity-based colors
    if (severity === 'success') return '#10b981'; // Green
    if (severity === 'error') return '#ef4444';   // Red
    if (severity === 'warning') return '#f59e0b'; // Orange
    
    // Priority 2: Type-based colors for variety
    const typeColors = {
      'execution_success': '#10b981',  // Green
      'execution_error': '#ef4444',    // Red
      'order_created': '#8b5cf6',      // Blue
      'order_failed': '#ef4444',       // Red
      'validation_error': '#f59e0b'    // Orange
    };
    
    return typeColors[type] || '#6366f1'; // Purple default
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <div className="notifications-title">
              <Bell size={18} />
              <h3>Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notifications-tabs">
            <button className="notification-tab active">
              Inbox
              {unreadCount > 0 && (
                <span className="tab-badge">{unreadCount}</span>
              )}
            </button>
          </div>

          <div className="notifications-list">
            {isLoading ? (
              <div className="notifications-loading">
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <Bell size={48} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div 
                    className="notification-avatar" 
                    style={{ background: notification.avatarColor }}
                  >
                    {notification.avatar}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    {notification.subtitle && (
                      <div className="notification-subtitle">
                        {notification.subtitle}
                      </div>
                    )}
                    <div className="notification-time">{notification.time}</div>
                  </div>

                  <div className="notification-actions">
                    <button 
                      className="notification-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notification.id);
                      }}
                      title="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notifications-footer">
              <button className="view-all-btn">View all notifications</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;