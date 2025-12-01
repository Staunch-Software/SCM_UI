import React from 'react';
import { Bot, User } from 'lucide-react';
import { formatTime } from '../utils/dateHelpers';
import '../styles/MessageBubble.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    .replace(/'/g, '"'); 
};

const MessageBubble = ({ message, onOpenDrawer }) => {
  const { type, content, timestamp } = message;
  const isUser = type === 'user';

  // --- UPDATED: AGGRESSIVE JSON PARSER ---
  const tryParseJSON = (text) => {
    if (!text) return null;
    
    // 1. Clean Markdown code blocks
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, '') // Case insensitive match for json
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
    }

    // 2. Helper to safely parse
    const safeParse = (str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        // Common LLM Error: Newlines inside strings break JSON.parse
        // Attempt to escape newlines that are NOT part of the JSON structure
        try {
            // This is a heuristic: replace literal newlines with \n
            const sanitized = str.replace(/\n/g, "\\n");
            return JSON.parse(sanitized);
        } catch (e2) {
            return null;
        }
      }
    };

    // 3. Try direct parse
    let result = safeParse(cleaned);
    if (result) return result;

    // 4. Try extracting JSON object { ... }
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');

    if (firstOpen !== -1 && lastClose > firstOpen) {
      const candidate = text.substring(firstOpen, lastClose + 1);
      result = safeParse(candidate);
      if (result) return result;

      // 5. Try repairing Python syntax on the candidate
      try {
        return JSON.parse(repairPythonJSON(candidate));
      } catch (e3) {
        return null;
      }
    }
    return null;
  };

  const renderAssistantMessage = () => {
    const parsedContent = tryParseJSON(content);

    if (parsedContent && typeof parsedContent === 'object') {
      
      // 1. Handle Open Drawer
      if (parsedContent.display_type === 'open_drawer') {
        const { drawer_type, order_id, message: drawerMessage } = parsedContent;
        const drawerTypeLabel = drawer_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Order';

        const messageKey = `${message.id}_drawer`;
        if (onOpenDrawer && !window.drawerOpened?.[messageKey]) {
          if (!window.drawerOpened) window.drawerOpened = {};
          window.drawerOpened[messageKey] = true;
          setTimeout(() => onOpenDrawer(drawer_type, order_id), 100);
        }

        if (drawerMessage) {
          return (
            <div className="markdown-content">
              <ReactMarkdown>{drawerMessage}</ReactMarkdown>
            </div>
          );
        }
        return <p>Opened {drawerTypeLabel} for order <strong>{order_id}</strong>.</p>;
      }

      // 2. Handle Enhanced Supplier Tool Response
      if (parsedContent.enhanced_supplier_selection_tool_response) {
        const toolResponse = parsedContent.enhanced_supplier_selection_tool_response;
        if (toolResponse.display_type === 'table') {
          return (
            <>
              {toolResponse.title && <p>{toolResponse.title}</p>}
              <DataTable tableData={toolResponse} />
            </>
          );
        }
        if (toolResponse.display_type === 'multiple_tables') {
          return <MultipleTablesDisplay orderTables={toolResponse.order_tables} />;
        }
      }

      // 3. Handle Multiple Tables
      if (parsedContent.display_type === 'multiple_tables') {
        return <MultipleTablesDisplay orderTables={parsedContent.order_tables} />;
      }

      // 4. Handle Standard Table
      if (parsedContent.display_type === 'table') {
        return (
          <>
            {/* Render Summary */}
            {parsedContent.summary && (
              <div className="markdown-content" style={{ marginBottom: '12px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {parsedContent.summary}
                </ReactMarkdown>
              </div>
            )}

            {parsedContent.title && (
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {parsedContent.title}
              </p>
            )}
            <DataTable tableData={parsedContent} />
          </>
        );
      }

      // 5. Handle Simple JSON Results/Errors
      if (parsedContent.result || parsedContent.error || parsedContent.summary) {
        return (
          <div className="markdown-content">
            <ReactMarkdown>
              {parsedContent.result || parsedContent.error || parsedContent.summary}
            </ReactMarkdown>
          </div>
        );
      }
    }

    // Fallback: Render as Markdown
    return (
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
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