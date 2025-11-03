// frontend/src/services/notificationApi.js
//const API_BASE_URL =  'http://localhost:8000';
const API_BASE_URL =  'https://20.244.0.96:9000';

export const notificationApi = {
  /**
   * Get notifications for a session
   * @param {string} sessionId - The session ID
   * @param {number} limit - Maximum number of notifications to fetch
   * @param {boolean} unreadOnly - Whether to fetch only unread notifications
   */
  async getNotifications(sessionId, limit = 50, unreadOnly = false) {
    const url = `${API_BASE_URL}/api/notifications/${sessionId}?limit=${limit}&unread_only=${unreadOnly}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - The notification ID
   */
  async markAsRead(notificationId) {
    const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: notificationId })
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },

  /**
   * Mark all notifications as read for a session
   * @param {string} sessionId - The session ID
   */
  async markAllAsRead(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${sessionId}/mark-all-read`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to mark all as read');
    return response.json();
  },

  /**
   * Dismiss/delete a notification
   * @param {string} notificationId - The notification ID
   */
  async dismissNotification(notificationId) {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to dismiss notification');
    return response.json();
  }
};