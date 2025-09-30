import { create } from 'zustand';
import { createMessage } from '../utils/messageHelpers'; // Assuming you have this helper

const API_BASE_URL = 'https://odooerp.staunchtec.com';

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
      if (window.refreshChatHistory) {
        window.refreshChatHistory();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = createMessage('Sorry, I encountered an error. Please try again.', 'assistant');
      get().addMessage(errorMessage);
    } finally {
      set({ isTyping: false });
    }
  },

  loadSession: async (sessionId) => {
    try {
      set({ isTyping: true });
      const response = await fetch(`${API_BASE_URL}/api/chat-sessions/${sessionId}/messages`);

      if (!response.ok) throw new Error('Failed to load session');

      const data = await response.json();

      // Convert conversation history to message format
      const formattedMessages = data.messages.flatMap(conv => [
        createMessage(conv.user, 'user', new Date(conv.timestamp)),
        createMessage(conv.assistant, 'assistant', new Date(conv.timestamp))
      ]);

      set({
        messages: formattedMessages,
        sessionId: sessionId,
        isTyping: false
      });
    } catch (error) {
      console.error('Failed to load session:', error);
      set({ isTyping: false });
    }
  },

  createNewSession: () => {
    set({
      messages: [
        {
          id: Date.now(),
          type: 'assistant',
          content: "Hello! I'm SCM, an AI assistant for supply chain management. How can I help you today?",
          timestamp: new Date()
        }
      ],
      sessionId: null,
      isTyping: false
    });
  },

  //   // Keep existing clearMessages for compatibility
  //   clearMessages: () => {
  //     get().createNewSession();
  //   },
  // }));

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