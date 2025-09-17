import React from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { useChat } from '../hooks/useChat';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  const initialMessages = [
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm SCM, an AI assistant for supply chain management. How can I help you today?",
      timestamp: new Date()
    }
  ];
  

  const { messages, isTyping, sendMessage, clearMessages } = useChat(initialMessages);

  return (
    <div className="chat-interface">
      {/* Sticky Header */}
      <div className="chat-header">
        <button className="new-chat-btn" onClick={clearMessages}>
          + New Conversation
        </button>
        <h1 className="premium-text">✨ Welcome to SCM Chatbox ✨</h1>
      </div>

      {/* Scrollable Messages */}
      <div className="chat-main">
        <MessageList messages={messages} isTyping={isTyping} />
      </div>

      {/* Input fixed at bottom */}
      <div className="chat-footer">
        <InputArea onSendMessage={sendMessage} isTyping={isTyping} />
      </div>
    </div>
  );
};

export default ChatInterface;
