import React from 'react';
import { Bot, User } from 'lucide-react';
import { formatTime } from '../utils/dateHelpers';
import '../styles/MessageBubble.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- HELPER: Smart Row Lookup ---
// Solves the issue where Headers are "PLANNED ORDER ID" but data keys are "planned_order_id"
const getRowValue = (row, header) => {
  // 1. Try Direct Match
  if (row[header] !== undefined) return row[header];

  // 2. Try Normalized Match (Ignore case, spaces -> underscores)
  // Example: Header "PLANNED ORDER ID" -> "planned_order_id"
  const normalize = (str) => str.toLowerCase().replace(/\s+/g, '_');
  const normalizedHeader = normalize(header);

  const matchingKey = Object.keys(row).find(key => normalize(key) === normalizedHeader);
  
  // 3. Return match or empty string
  return matchingKey ? row[matchingKey] : '';
};

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
            {tableData.headers.map(header => (
              <th key={header}>
                {/* Ensure header is readable (remove underscores if raw key is passed) */}
                {header.replace(/_/g, ' ').toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, index) => (
            <tr key={index}>
              {tableData.headers.map(header => (
                <td key={header}>
                  {/* Use Smart Lookup here */}
                  {getRowValue(row, header)}
                </td>
              ))}
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

// New Component: Replenishment Status Card
const ReplenishmentStatusCard = ({ data }) => {
  if (!data || !data.metrics) return null;
  const { metrics } = data;

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px', 
      padding: '16px', 
      backgroundColor: '#f9fafb',
      maxWidth: '500px',
      marginTop: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ 
          width: '10px', height: '10px', borderRadius: '50%', 
          backgroundColor: '#10b981', marginRight: '8px' 
        }}></div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          {data.product_name} Status: <span style={{ color: '#10b981' }}>Healthy</span>
        </h3>
      </div>

      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        {data.summary}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Demand Section */}
        <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
          <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Total Demand</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{metrics.total_demand}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>Source: {metrics.demand_source}</div>
        </div>

        {/* Supply Section */}
        <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
          <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Total Supply</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>{metrics.total_supply}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Inv: {metrics.inventory} | POs: {metrics.open_po}
          </div>
        </div>
      </div>

      {/* Balance Bar */}
      <div style={{ marginTop: '16px', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>Net Balance</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>+{metrics.net_balance}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          Target Safety Stock: <strong>{metrics.safety_stock}</strong>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, onOpenDrawer }) => {
  const { type, content, timestamp } = message;
  const isUser = type === 'user';

  // --- AGGRESSIVE JSON PARSER ---
  const tryParseJSON = (text) => {
    if (!text) return null;
    
    // 1. Clean Markdown code blocks
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
    }

    // 2. Helper to safely parse
    const safeParse = (str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        try {
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

      // 5. Try repairing Python syntax
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

      // 5. Handle Simple Text Message
      if (parsedContent.display_type === 'text') {
        return (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {parsedContent.message}
            </ReactMarkdown>
          </div>
        );
      }

      // 6. Handle Simple JSON Results/Errors
      if (parsedContent.result || parsedContent.error || parsedContent.summary) {
        return (
          <div className="markdown-content">
            <ReactMarkdown>
              {parsedContent.result || parsedContent.error || parsedContent.summary}
            </ReactMarkdown>
          </div>
        );
      }

       if (parsedContent.display_type === 'replenishment_status') {
        return <ReplenishmentStatusCard data={parsedContent} />;
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