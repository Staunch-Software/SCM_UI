import React from 'react';
import { Bot, User } from 'lucide-react';
import { formatTime } from '../utils/dateHelpers';
import '../styles/MessageBubble.css';

// Helper component to render the table
const DataTable = ({ tableData }) => {
  if (!tableData || !tableData.headers || !tableData.rows) {
    return null;
  }
  return (
    <div className="data-table-container">
      <table>
        <thead>
          <tr>
            {tableData.headers.map(header => <th key={header}>{header.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, index) => (
            <tr key={index}>
              {tableData.headers.map(header => <td key={header}>{row[header]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const { type, content, timestamp } = message;
  const isUser = type === 'user';

  const renderAssistantMessage = () => {
    // First, try to parse the content as JSON
    try {
      const parsedContent = JSON.parse(content);
      
      console.log('Parsed content:', parsedContent); // Debug logging
      
      // Check for table display type
      if (parsedContent && parsedContent.display_type === 'table') {
        console.log('Rendering table with data:', parsedContent); // Debug logging
        return (
          <>
            {/* The title now comes directly from our data package */}
            {parsedContent.title && <p>{parsedContent.title}</p>}
            
            {/* We pass the whole object to DataTable, which has the headers and rows */}
            <DataTable tableData={parsedContent} />
          </>
        );
      }

      // Handle other structured JSON responses (like simple errors or summaries)
      if (parsedContent && (parsedContent.result || parsedContent.error || parsedContent.summary)) {
         return <p>{parsedContent.result || parsedContent.error || parsedContent.summary}</p>;
      }

      // If it's valid JSON but not a recognized structure, display as text
      return <p>{content}</p>;

    } catch (e) {
      console.log('JSON parse failed, treating as plain text:', e); // Debug logging
      
      // If JSON.parse fails, we know it's just a plain text string.
      // However, let's also check if it might be malformed JSON that we can fix
      if (content.includes('"display_type": "table"') && content.includes('"headers"')) {
        console.log('Detected malformed table JSON, attempting to fix...'); // Debug logging
        
        // Try to clean up common JSON issues
        let cleanedContent = content.trim();
        
        // Remove any leading/trailing text that isn't JSON
        const jsonStart = cleanedContent.indexOf('{"display_type"');
        const jsonEnd = cleanedContent.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanedContent = cleanedContent.substring(jsonStart, jsonEnd);
          
          try {
            const repairedContent = JSON.parse(cleanedContent);
            if (repairedContent.display_type === 'table') {
              console.log('Successfully repaired JSON table data'); // Debug logging
              return (
                <>
                  {repairedContent.title && <p>{repairedContent.title}</p>}
                  <DataTable tableData={repairedContent} />
                </>
              );
            }
          } catch (repairError) {
            console.log('Could not repair JSON:', repairError); // Debug logging
          }
        }
      }
      
      return <p>{content}</p>;
    }
  };

  return (
    <div className="message-bubble">
      <div className={`message-content ${isUser ? 'user' : ''}`}>
        <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div className={`message-body ${isUser ? 'user' : ''}`}>
          <div className={`message-text ${isUser ? 'user' : 'assistant'}`}>
            {isUser ? <p>{content}</p> : renderAssistantMessage()}
          </div>
          <div className="message-timestamp">
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;