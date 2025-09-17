import { Home, MessageSquare } from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = ({ currentPage, onSelectDashboard, onSelectChatbox }) => {
  return (
    <div className="sidebar">
      <div 
        className={`sidebar-item ${currentPage === 'dashboard' ? 'active' : ''}`}
        onClick={onSelectDashboard}
      >
        <Home size={16} />
        <span>Main Dashboard</span>
      </div>

      <div 
        className={`sidebar-item ${currentPage === 'chatbox' ? 'active' : ''}`}
        onClick={onSelectChatbox}
      >
        <MessageSquare size={16} />
        <span>Chatbox</span>
      </div>
    </div>
  );
};

export default Sidebar;
