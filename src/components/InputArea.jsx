import React, { useState, useRef } from 'react';
import { Send, Square, Paperclip, X } from 'lucide-react';
import '../styles/InputArea.css';

const InputArea = ({ onSendMessage, isTyping, onStopGeneration }) => {
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleSend = async () => {
    // Don't send if typing or if both input and file are empty
    if (isTyping || (!inputValue.trim() && !file)) return;

    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        await onSendMessage(inputValue || "Process this PDF", base64, file.name);
        setFile(null);
        setInputValue('');
      };
      reader.readAsDataURL(file);
    } else {
      onSendMessage(inputValue);
      setInputValue('');
    }

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
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="input-area">
      <div className="input-container">
        {/* File preview */}
        {file && (
          <div className="file-preview">
            <span>📄 {file.name}</span>
            <button onClick={removeFile} className="remove-file-btn">
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="input-wrapper">
          <div className="input-field-wrapper">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={file ? "Add a message (optional)..." : "Message SCM..."}
              className="input-field"
              rows={1}
            />
          </div>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="attachment-button"
            disabled={isTyping}
            title="Attach PDF"
          >
            <Paperclip size={18} />
          </button>

          {/* Send/Stop button */}
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
              disabled={!inputValue.trim() && !file}
              className={`send-button ${(inputValue.trim() || file) ? 'enabled' : 'disabled'}`}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputArea;