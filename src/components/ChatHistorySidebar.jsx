import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Plus, MoreVertical, Edit2 } from 'lucide-react';
import { sessionApi } from '../services/sessionApi';
import '../styles/ChatHistorySidebar.css';

const ChatHistorySidebar = ({ currentSessionId, onSelectSession, onNewChat }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showMenuId, setShowMenuId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenuId && !event.target.closest('.session-actions')) {
        setShowMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenuId]);

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
      console.log('RAW API RESPONSE:', data);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation();
    setDeleteConfirm(sessionId);
    setShowMenuId(null);
  };

  const confirmDelete = async () => {
    try {
      await sessionApi.deleteSession(deleteConfirm);
      setSessions(prev => prev.filter(s => s.sessionId !== deleteConfirm));
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleRename = async (sessionId) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null); // Close if empty
      return;
    }
    try {
      await sessionApi.updateSessionTitle(sessionId, editTitle.trim());
      setSessions(prev => prev.map(s =>
        s.sessionId === sessionId ? { ...s, title: editTitle.trim() } : s
      ));
    } catch (error) {
      console.error('Failed to rename session:', error);
    } finally {
      setEditingSessionId(null); // Always close after attempt
    }
  };

  const startRename = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.sessionId);
    setEditTitle(session.title);
    setShowMenuId(null);
  };

  const groupSessionsByDate = (sessions) => {
    console.log('RECEIVED SESSIONS:', sessions);
    console.log('Number of sessions:', sessions?.length);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    const groups = { today: [], yesterday: [], week: [], older: [] };

    sessions.forEach(session => {
      if (!session.createdAt) {
        groups.today.push(session);
        return;
      }

      const d = new Date(session.createdAt);
      const sessionDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (sessionDate === today) groups.today.push(session);
      else if (sessionDate === yesterday) groups.yesterday.push(session);
      else if (sessionDate >= weekAgo) groups.week.push(session);
      else groups.older.push(session);
    });

    return [
      { label: 'Today', sessions: groups.today },
      { label: 'Yesterday', sessions: groups.yesterday },
      { label: 'Previous 7 Days', sessions: groups.week },
      { label: 'Older', sessions: groups.older }
    ].filter(g => g.sessions.length > 0);
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
          groupSessionsByDate(sessions).map(group => (
            <div key={group.label} className="session-group">
              <div className="group-label">{group.label}</div>
              {group.sessions.map(session => (
                <div
                  key={session.sessionId}
                  className={`session-item ${session.sessionId === currentSessionId ? 'active' : ''}`}
                  onClick={() => onSelectSession(session.sessionId)}
                >
                  <MessageSquare size={16} className="session-icon" />
                  <div className="session-content">
                    {editingSessionId === session.sessionId ? (
                      <input
                        className="session-title-edit"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(session.sessionId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(session.sessionId);
                          if (e.key === 'Escape') setEditingSessionId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="session-title">{session.title}</div>
                    )}
                    <div className="session-preview">{session.lastMessage || 'No preview available'}</div>
                  </div>
                  <div className="session-actions">
                    <button
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuId(showMenuId === session.sessionId ? null : session.sessionId);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {showMenuId === session.sessionId && (
                      <div className="action-menu">
                        <button onClick={(e) => startRename(session, e)}>
                          <Edit2 size={14} />
                          <span>Rename</span>
                        </button>
                        <button onClick={(e) => handleDelete(session.sessionId, e)}>
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Conversation</h3>
            <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="modal-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistorySidebar;