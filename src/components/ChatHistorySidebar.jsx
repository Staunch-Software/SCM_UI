import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Plus } from 'lucide-react';
import { sessionApi } from '../services/sessionApi';
import '../styles/ChatHistorySidebar.css';

const ChatHistorySidebar = ({ currentSessionId, onSelectSession, onNewChat }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();

    // Expose refresh function globally
    window.refreshChatHistory = loadSessions;

    return () => {
      delete window.refreshChatHistory;
    };
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadSessions(); // Refresh when active session changes
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      const data = await sessionApi.listSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    try {
      await sessionApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <div className="chat-history-sidebar">
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="sessions-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">No conversations yet</div>
        ) : (
          sessions.map(session => (
            <div
              key={session.sessionId}
              className={`session-item ${session.sessionId === currentSessionId ? 'active' : ''}`}
              onClick={() => onSelectSession(session.sessionId)}
            >
              <MessageSquare size={16} className="session-icon" />
              <div className="session-content">
                <div className="session-title">{session.title}</div>
                <div className="session-preview">{session.lastMessage || 'No preview available'}</div>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(session.sessionId, e)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistorySidebar;