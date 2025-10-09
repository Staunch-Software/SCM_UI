import React, { useState } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ChatHistorySidebar from './ChatHistorySidebar';
import { useChatStore } from '../stores/chatStore';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  const { messages, isTyping, sendMessage, sessionId, loadSession, createNewSession, sessionTitle } = useChatStore();

  return (
    <div className="chat-interface">
      <ChatHistorySidebar
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={createNewSession}
      />
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-content">
            <h1 className="chat-title">{sessionTitle || "SCM Assistant"}</h1>
          </div>
        </div>
        <MessageList messages={messages} isTyping={isTyping} />
        <InputArea onSendMessage={sendMessage} isTyping={isTyping} />
      </div>
    </div>
  );
};

export default ChatInterface;