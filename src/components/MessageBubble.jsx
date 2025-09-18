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

const MultipleTablesDisplay = ({ orderTables }) => {
  if (!orderTables || !Array.isArray(orderTables)) {
    return null;
  }

  return (
    <div className="multiple-tables-container">
      {orderTables.map((orderTable, index) => (
        <div key={orderTable.order_id || index} className="order-table-section">
          <h4 className="order-header">
            <strong>Order ID: {orderTable.order_id} - {orderTable.product_name}</strong>
          </h4>
          <DataTable tableData={orderTable.table_data} />
          {index < orderTables.length - 1 && <div className="table-separator"></div>}
        </div>
      ))}
    </div>
  );
};

const repairPythonJSON = (jsonString) => {
  return jsonString
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/'/g, '"'); // Replace single quotes with double quotes if needed
};

const MessageBubble = ({ message }) => {
  const { type, content, timestamp } = message;
  const isUser = type === 'user';

  const renderAssistantMessage = () => {
    // First, try to parse the content as JSON
    try {
      const parsedContent = JSON.parse(content);

      console.log('Parsed content:', parsedContent); // Debug logging

      if (parsedContent && parsedContent.enhanced_supplier_selection_tool_response) {
        const toolResponse = parsedContent.enhanced_supplier_selection_tool_response;
        console.log('Found nested tool response:', toolResponse);

        // Handle nested table response
        if (toolResponse.display_type === 'table') {
          return (
            <>
              {toolResponse.title && <p>{toolResponse.title}</p>}
              <DataTable tableData={toolResponse} />
            </>
          );
        }

        // Handle nested multiple tables
        if (toolResponse.display_type === 'multiple_tables') {
          return <MultipleTablesDisplay orderTables={toolResponse.order_tables} />;
        }
      }

      if (parsedContent && parsedContent.display_type === 'multiple_tables') {
        console.log('Rendering multiple tables:', parsedContent);
        return <MultipleTablesDisplay orderTables={parsedContent.order_tables} />;
      }

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

      if (content.includes('"display_type"') && (content.includes('True') || content.includes('False'))) {
        console.log('Detected Python-style JSON, repairing...');
        
        try {
          const repairedJSON = repairPythonJSON(content);
          const repairedContent = JSON.parse(repairedJSON);
          
          if (repairedContent && repairedContent.display_type === 'table') {
            console.log('Successfully repaired and rendering table');
            return (
              <>
                {repairedContent.title && <p>{repairedContent.title}</p>}
                <DataTable tableData={repairedContent} />
              </>
            );
          }
          
          if (repairedContent && repairedContent.display_type === 'multiple_tables') {
            console.log('Successfully repaired and rendering multiple tables');
            return <MultipleTablesDisplay orderTables={repairedContent.order_tables} />;
          }
          
        } catch (repairError) {
          console.log('Could not repair Python JSON:', repairError);
        }
      }

      if (content.includes('"display_type": "multiple_tables"') && content.includes('"order_tables"')) {
        console.log('Detected malformed multiple tables JSON, attempting to fix...');

        let cleanedContent = content.trim();
        const jsonStart = cleanedContent.indexOf('{"scenario"') !== -1 ?
          cleanedContent.indexOf('{"scenario"') :
          cleanedContent.indexOf('{"display_type"');
        const jsonEnd = cleanedContent.lastIndexOf('}') + 1;

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanedContent = repairPythonJSON(cleanedContent.substring(jsonStart, jsonEnd));

          try {
            const repairedContent = JSON.parse(cleanedContent);
            if (repairedContent.display_type === 'multiple_tables') {
              console.log('Successfully repaired multiple tables JSON');
              return <MultipleTablesDisplay orderTables={repairedContent.order_tables} />;
            }
          } catch (repairError) {
            console.log('Could not repair multiple tables JSON:', repairError);
          }
        }
      }
      
      // Fallback to extracting clean JSON
      if (content.includes('"display_type": "table"')) {
        console.log('Attempting to extract clean JSON...');
        
        const jsonStart = content.indexOf('{"display_type"');
        const jsonEnd = content.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          let cleanedContent = content.substring(jsonStart, jsonEnd);
          cleanedContent = repairPythonJSON(cleanedContent);
          
          try {
            const extractedContent = JSON.parse(cleanedContent);
            if (extractedContent.display_type === 'table') {
              console.log('Successfully extracted and repaired JSON table');
              return (
                <>
                  {extractedContent.title && <p>{extractedContent.title}</p>}
                  <DataTable tableData={extractedContent} />
                </>
              );
            }
          } catch (extractError) {
            console.log('Could not extract clean JSON:', extractError);
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