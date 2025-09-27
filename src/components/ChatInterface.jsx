import React from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
// 1. Import the new store
import { useChatStore } from '../stores/chatStore';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  // 2. Get state and actions directly from the global store
  const { messages, isTyping, sendMessage } = useChatStore();

  // 3. The component is now much simpler!
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