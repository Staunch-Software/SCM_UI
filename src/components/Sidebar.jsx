import React from 'react';
import { Plus, User } from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = ({ 
  conversations, 
  currentConversation, 
  onNewChat, 
  onSelectConversation,
  isOpen = true 
}) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button onClick={onNewChat} className="new-chat-btn">
          <Plus size={16} />
          New conversation
        </button>
      </div>
      
      <div className="conversations-list">
        <div className="conversations">
          {conversations.map((conversation, index) => (
            <div
              key={conversation.id || index}
              onClick={() => onSelectConversation(conversation)}
              className={`conversation-item ${
                currentConversation === conversation.id ? 'active' : ''
              }`}
            >
              {conversation.title || `Conversation ${index + 1}`}
            </div>
          ))}
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <User size={16} />
          <span>User Account</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;