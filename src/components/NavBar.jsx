import React from 'react';
import { Home, MessageSquare, Package, BarChart3, Users, Building2, Plus } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar = ({ currentPage, onNavigate, onNewChat }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'chatbox', label: 'Chat', icon: MessageSquare },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Building2 }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h1>SCM AI</h1>
        </div>
        
        <div className="navbar-items">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`navbar-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="navbar-actions">
          <button className="new-chat-btn" onClick={onNewChat}>
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;