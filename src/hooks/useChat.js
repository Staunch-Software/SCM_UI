import { useState, useCallback } from 'react';
import { createMessage, getAIResponse } from '../utils/messageHelpers';

const API_BASE_URL =  'https://odooerp.staunchtec.com';

export const useChat = (initialMessages = []) => {
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage = createMessage(content, 'user');
    addMessage(userMessage);

    // Set typing indicator
    setIsTyping(true);

    try {
      // Call your FastAPI backend
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSessionId(data.session_id);
      // Create AI message with the response
      const aiMessage = createMessage(data.response, 'assistant');
      addMessage(aiMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = createMessage(
        'Sorry, I encountered an error while processing your request. Please try again.',
        'assistant'
      );
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }, [addMessage, sessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    addMessage
  };
};