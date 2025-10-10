import React, { useState, useRef } from 'react';
import { Send, Square } from 'lucide-react';
import '../styles/InputArea.css';

const InputArea = ({ onSendMessage, isTyping, onStopGeneration }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    onSendMessage(inputValue);
    setInputValue('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div className="input-area">
      <div className="input-container">
        <div className="input-wrapper">
          <div className="input-field-wrapper">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Message SCM..."
              className="input-field"
              rows={1}
            />
          </div>
          {isTyping ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onStopGeneration();
              }}
              className="send-button stop-button enabled"
              type="button"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`send-button ${inputValue.trim() ? 'enabled' : 'disabled'
                }`}
            >
              <Send size={18} />
            </button>
          )}
        </div>
        {/* <div className="input-disclaimer">
          SCM can make mistakes. Please verify important information.
        </div> */}
      </div>
    </div>
  );
};

export default InputArea;