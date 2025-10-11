import { create } from 'zustand';
import { createMessage } from '../utils/messageHelpers'; // Assuming you have this helper

//const API_BASE_URL = 'https://odooerp.staunchtec.com';
const API_BASE_URL = 'http://127.0.0.1:8000';

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
  sessionTitle: "SCM Assistant",
  isTyping: false,

  // Actions
  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  abortController: null,

  sendMessage: async (content) => {
    if (!content.trim()) return;

    // Add user message to the UI immediately
    const userMessage = createMessage(content, 'user');
    get().addMessage(userMessage);
    const controller = new AbortController();
    set({ isTyping: true, abortController: controller });

     const messageContent = content;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          session_id: get().sessionId, // Use the session_id from the store
        }),
         signal: controller.signal,
      });
      
       if (controller.signal.aborted) {
        // throw new DOMException('Aborted', 'AbortError');
        console.log('Aborted after fetch');
        return; 
      }

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (controller.signal.aborted) {
         console.log('Aborted after JSON parse');
        return; // Exit immediately
      }
       
      // const userMessage = createMessage(messageContent, 'user');
      // get().addMessage(userMessage);

      // If this is the first real message, save the new session_id
      if (!get().sessionId) {
        set({ sessionId: data.session_id });
      }

      // Add the agent's response
      const aiMessage = createMessage(data.response, 'assistant');
      get().addMessage(aiMessage);
      if (get().messages.length === 3) { // Welcome + User + AI response
        try {
          const sessionListResponse = await fetch(`${API_BASE_URL}/api/chat-sessions`);
          const sessionsList = await sessionListResponse.json();
          const currentSession = sessionsList.sessions.find(s => s.sessionId === data.session_id);
          if (currentSession?.title) {
            set({ sessionTitle: currentSession.title });
          }
        } catch (error) {
          console.error('Failed to fetch session title:', error);
        }
      }

      if (window.refreshChatHistory) {
        window.refreshChatHistory();
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        // const userMessage = createMessage(messageContent, 'user');
        // get().addMessage(userMessage);
        const stopMessage = createMessage('User interrupted the generation process.', 'assistant');
        get().addMessage(stopMessage);
        console.log('Request aborted - stop message shown');
      } else {
        // On real error, add user message + error message
        // const userMessage = createMessage(messageContent, 'user');
        // get().addMessage(userMessage);
        console.error('Error sending message:', error);
        const errorMessage = createMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        get().addMessage(errorMessage);
      }
    } finally {
      set({ isTyping: false, abortController: null });
    }
  },

  stopGeneration: () => {
    console.log('Stop clicked!'); 
    const { abortController } = get();
    console.log('Controller:', abortController); 
    if (abortController) {
      abortController.abort();
    }
  },

  loadSession: async (sessionId) => {
    try {
      set({ isTyping: true });
      const [messagesResponse, sessionListResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/chat-sessions/${sessionId}/messages`),
        fetch(`${API_BASE_URL}/api/chat-sessions`)
      ]);
      if (!messagesResponse.ok) throw new Error('Failed to load session');

      const data = await messagesResponse.json();
      const sessionsList = await sessionListResponse.json();

      const currentSession = sessionsList.sessions.find(s => s.sessionId === sessionId);
      const sessionTitle = currentSession?.title || "Chat Session";

      // Convert conversation history to message format
      const formattedMessages = data.messages.flatMap(conv => {
        const timestamp = new Date(conv.timestamp);
        console.log('Original timestamp:', conv.timestamp, 'Parsed:', timestamp);
        return [
          createMessage(conv.user, 'user', timestamp),
          createMessage(conv.assistant, 'assistant', timestamp)
        ];
      });

      set({
        messages: formattedMessages,
        sessionId: sessionId,
        sessionTitle: sessionTitle,
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
      sessionTitle: "SCM Assistant",
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
      sessionTitle: "SCM Assistant",
      isTyping: false,
    });
  },
}));