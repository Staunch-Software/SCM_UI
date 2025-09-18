import { useState, useCallback, useEffect } from 'react';

const generateId = () => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateTitle = (messages) => {
  const firstUserMessage = messages.find(msg => msg.type === 'user');
  if (firstUserMessage && firstUserMessage.content) {
    const content = firstUserMessage.content.trim();
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  }
  return 'New Conversation';
};

const initialMessage = {
  id: 1,
  type: 'assistant',
  content: 'Hello! I\'m SCM, an AI assistant created by Staunch. How can I help you today?',
  timestamp: new Date()
};

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Initialize with first conversation
  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, []);

  const createNewConversation = useCallback(() => {
    const newId = generateId();
    const newConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [initialMessage],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    return newId;
  }, []);

  const switchToConversation = useCallback((conversationId) => {
    setCurrentConversationId(conversationId);
  }, []);

  const updateConversationMessages = useCallback((conversationId, messages) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        const updatedConv = {
          ...conv,
          messages: [...messages],
          updatedAt: new Date()
        };
        
        // Update title if it's still "New Conversation" and we have user messages
        if (conv.title === 'New Conversation' && messages.length > 1) {
          updatedConv.title = generateTitle(messages);
        }
        
        return updatedConv;
      }
      return conv;
    }));
  }, []);

  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== conversationId);
      
      // If we deleted the current conversation, switch to another one or create new
      if (currentConversationId === conversationId) {
        if (filtered.length > 0) {
          setCurrentConversationId(filtered[0].id);
        } else {
          // Will create new conversation on next render
          setCurrentConversationId(null);
        }
      }
      
      return filtered;
    });
  }, [currentConversationId]);

  const getCurrentConversation = useCallback(() => {
    return conversations.find(conv => conv.id === currentConversationId);
  }, [conversations, currentConversationId]);

  const currentMessages = getCurrentConversation()?.messages || [initialMessage];

  return {
    conversations,
    currentConversationId,
    currentMessages,
    createNewConversation,
    switchToConversation,
    updateConversationMessages,
    deleteConversation,
    getCurrentConversation
  };
};