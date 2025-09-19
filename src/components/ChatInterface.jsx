import React, { useState } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import { useChat } from '../hooks/useChat';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  const initialMessages = [
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m SCM, an AI assistant for supply chain management. How can I help you today?',
      timestamp: new Date()
    }
  ];

  const { messages, isTyping, sendMessage, clearMessages } = useChat(initialMessages);

  return (
    <div className="chat-interface">
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-content">
            <h1 className="chat-title">SCM Assistant</h1>
          </div>
        </div>

        <MessageList messages={messages} isTyping={isTyping} />
        
        <InputArea onSendMessage={sendMessage} isTyping={isTyping} />
      </div>
    </div>
  );
};

export default ChatInterface;