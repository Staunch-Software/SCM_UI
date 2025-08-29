import React from 'react';
import { Bot } from 'lucide-react';
import '../styles/TypingIndicator.css';

const TypingIndicator = () => {
  return (
    <div className="typing-indicator message-bubble">
      <div className="message-content">
        <div className="message-avatar assistant">
          <Bot size={16} />
        </div>
        <div className="message-body">
          <div className="message-text assistant">
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;