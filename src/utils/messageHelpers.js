export const generateId = () => {
  return Date.now() + Math.random();
};

export const createMessage = (content, type = 'user') => {
  return {
    id: generateId(),
    type,
    content,
    timestamp: new Date()
  };
};

export const getAIResponse = () => {
  const responses = [
    "I understand your question. Let me help you with that.",
    "That's an interesting point. Here's what I think about it.",
    "I'd be happy to assist you with this. Let me break it down.",
    "Thanks for asking! Here's my perspective on this topic.",
    "That's a great question. I can provide some insights on this.",
    "I see what you're getting at. Let me explain this concept.",
    "This is a complex topic, but I'll do my best to clarify it for you.",
    "Based on my understanding, here's what I would suggest:"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};