import { create } from 'zustand';
import { createMessage } from '../utils/messageHelpers'; // Assuming you have this helper

const API_BASE_URL = 'http://localhost:8000';

export const useChatStore = create((set, get) => ({
  // State
  messages: [
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm SCM, an AI assistant for supply chain management. How can I help you today?",
      timestamp: new Date()
    }
  ],
  sessionId: null,
  isTyping: false,

  // Actions
  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  sendMessage: async (content) => {
    if (!content.trim()) return;

    // Add user message to the UI immediately
    const userMessage = createMessage(content, 'user');
    get().addMessage(userMessage);
    set({ isTyping: true });

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          session_id: get().sessionId, // Use the session_id from the store
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      // If this is the first real message, save the new session_id
      if (!get().sessionId) {
        set({ sessionId: data.session_id });
      }

      // Add the agent's response
      const aiMessage = createMessage(data.response, 'assistant');
      get().addMessage(aiMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = createMessage('Sorry, I encountered an error. Please try again.', 'assistant');
      get().addMessage(errorMessage);
    } finally {
      set({ isTyping: false });
    }
  },

  clearMessages: () => {
    set({
      messages: [
        {
          id: 1,
          type: 'assistant',
          content: "Hello! I'm SCM, an AI assistant. How can I help you today?",
          timestamp: new Date()
        }
      ],
      sessionId: null, // Reset the session ID for a fresh conversation
      isTyping: false,
    });
  },
}));