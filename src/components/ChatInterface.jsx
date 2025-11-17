import React, { useState } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';
import ChatHistorySidebar from './ChatHistorySidebar';
import PurchaseOrderDrawer from './PurchaseOrderDrawer';
import WorkOrderDrawer from './WorkOrderDrawer';
import SalesOrderDrawer from './SalesOrderDrawer';
import { useChatStore } from '../stores/chatStore';
import '../styles/ChatInterface.css';
import '../styles/ChatDrawer.css';
import { useEffect } from 'react';

const ChatInterface = () => {
  const { messages, isTyping, sendMessage, stopGeneration, sessionId, loadSession, createNewSession, sessionTitle } = useChatStore();
  
  const [drawerState, setDrawerState] = useState({
    isOpen: false,
    type: null,
    orderId: null
  });

  const handleOpenDrawer = (type, orderId) => {
    setDrawerState({ isOpen: true, type, orderId });
  };

  const handleCloseDrawer = () => {
    setDrawerState({ isOpen: false, type: null, orderId: null });
  };
  useEffect(() => {
  handleCloseDrawer();
}, [sessionId]);

  return (
    <div className={`chat-interface ${drawerState.isOpen ? 'drawer-open' : ''}`}>
      <ChatHistorySidebar
        currentSessionId={sessionId}
        onSelectSession={loadSession}
        onNewChat={createNewSession}
        isCollapsed={drawerState.isOpen}
      />
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-content">
            <h1 className="chat-title">{sessionTitle || "SCM Assistant"}</h1>
          </div>
        </div>
        <MessageList messages={messages} isTyping={isTyping} onOpenDrawer={handleOpenDrawer}/>
        <InputArea onSendMessage={sendMessage} isTyping={isTyping} onStopGeneration={stopGeneration}/>
      </div>
    {/* Order Drawers */}
      {drawerState.type === 'purchase_order' && (
        <PurchaseOrderDrawer
          isOpen={drawerState.isOpen}
          onClose={handleCloseDrawer}
          orderId={drawerState.orderId}
        />
      )}
      {drawerState.type === 'work_order' && (
        <WorkOrderDrawer
          isOpen={drawerState.isOpen}
          onClose={handleCloseDrawer}
          orderId={drawerState.orderId}
        />
      )}
      {drawerState.type === 'sales_order' && (
        <SalesOrderDrawer
          isOpen={drawerState.isOpen}
          onClose={handleCloseDrawer}
          orderId={drawerState.orderId}
        />
      )}
    </div>
  );
};

export default ChatInterface;