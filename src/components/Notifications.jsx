import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import '../styles/Notifications.css';

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      user: 'Ramesh',
      action: 'updated the status of',
      project: 'Shipment #SCM-4521',
      time: '1 hour ago',
      isRead: false,
      avatar: 'RA',
      avatarColor: '#f59e0b'
    },
    {
      id: 2,
      user: 'Warehouse Manager',
      action: 'flagged low inventory for',
      project: 'Product SKU-0045',
      time: '3 hours ago',
      isRead: false,
      avatar: 'WM',
      avatarColor: '#ef4444'
    },
    {
      id: 3,
      user: 'Supplier - 0020',
      action: 'requested approval for',
      project: 'Purchase Order #PO-3387',
      time: '1 day ago',
      isRead: false,
      avatar: 'SU',
      avatarColor: '#3b82f6'
    },
    {
      id: 4,
      user: 'Vivek Ganesh',
      action: 'mentioned you in',
      project: 'Supplier Review Meeting',
      time: '2 days ago',
      message: ' Please review the delivery delays from Vendor-BOSCH AUTOMOTIVE. Need your input on next steps.',
      isRead: false,
      avatar: 'VG',
      avatarColor: '#8b5cf6'
    },
    {
      id: 5,
      user: 'System Alert',
      action: 'detected delays in',
      project: 'Route Distribution - North Zone',
      time: '3 days ago',
      isRead: true,
      avatar: 'SA',
      avatarColor: '#10b981'
    }
  ]);

  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
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
            {/* <button className="notification-tab">
              Subscribed
            </button> */}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="notifications-empty">
                <Bell size={48} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-avatar" style={{ background: notification.avatarColor }}>
                    {notification.avatar}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-text">
                      <span className="notification-user">{notification.user}</span>
                      {' '}{notification.action}{' '}
                      <span className="notification-project">{notification.project}</span>
                    </div>
                    {notification.message && (
                      <div className="notification-message">
                        {notification.message}
                      </div>
                    )}
                    <div className="notification-time">{notification.time}</div>
                  </div>

                  <div className="notification-actions">
                    <button 
                      className="notification-action-btn"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      className="notification-action-btn"
                      onClick={() => dismissNotification(notification.id)}
                      title="Dismiss notification"
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