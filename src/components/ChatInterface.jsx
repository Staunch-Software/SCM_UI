import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { useChat } from '../hooks/useChat';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Current conversation' },
    // { id: 2, title: 'Previous chat example' },
    // { id: 3, title: 'Another conversation' }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState(1);
  
  const initialMessages = [
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m SCM, an AI assistant for supply chain management. How can I help you today?',
      timestamp: new Date()
    }
  ];

  const { messages, isTyping, sendMessage, clearMessages } = useChat(initialMessages);

  const handleNewChat = () => {
    console.log('Starting new chat...');
    
    // Just clear the current messages to start fresh
    clearMessages();
    
    // Reset to a default state (you can keep current conversation ID or reset it)
    // setCurrentConversationId(null); // Optional: if you want no conversation selected
    
    // Close sidebar on mobile
    setSidebarOpen(false);
  };

  const handleSelectConversation = (conversation) => {
    console.log('Selected conversation:', conversation);
    
    // Set as current conversation
    setCurrentConversationId(conversation.id);
    
    // Clear current messages and load conversation messages
    // Note: In a real app, you'd load messages from storage/database
    clearMessages();
    
    // For now, just add the initial message for any conversation
    // In a real implementation, you'd fetch the conversation's message history
    
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="chat-interface">
      <Sidebar 
        conversations={conversations}
        currentConversation={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        isOpen={sidebarOpen}
      />

      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-content">
            <button 
              onClick={toggleSidebar}
              className="mobile-menu-btn md-flex"
            >
              <Menu size={20} />
            </button>
            <h1 className="chat-title">SCM</h1>
          </div>
        </div>

        <MessageList messages={messages} isTyping={isTyping} />
        
        <InputArea onSendMessage={sendMessage} isTyping={isTyping} />
      </div>
    </div>
  );
};

export default ChatInterface;