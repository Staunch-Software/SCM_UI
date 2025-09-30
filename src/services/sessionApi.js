const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const sessionApi = {
  async listSessions() {
    const response = await fetch(`${API_BASE_URL}/api/chat-sessions`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  async getSessionMessages(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chat-sessions/${sessionId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chat-sessions/${sessionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete session');
    return response.json();
  }
};