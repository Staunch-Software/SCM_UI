import React from 'react';
// Import NavLink just ONCE from react-router-dom
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Package, BarChart3, Users, Building2, Plus } from 'lucide-react';
import '../styles/Navbar.css';
// Import the store for the "New Chat" functionality
import { useChatStore } from '../stores/chatStore';

const Navbar = () => {
  // Get just the clearMessages function from the store
  const clearMessages = useChatStore((state) => state.clearMessages);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/inventory-dashboard', label: 'Inventory', icon: BarChart3 },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/vendors', label: 'Vendors', icon: Building2 }
  ];

  const handleNewChat = () => {
    // When the button is clicked, clear the global chat state
    clearMessages();
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h1>SCM</h1>
        </div>
        
        <div className="navbar-items">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="navbar-item" 
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* <div className="navbar-actions">
          <NavLink to="/chat" className="new-chat-btn" onClick={handleNewChat}>
            <Plus size={16} />
            <span>New Chat</span>
          </NavLink>
        </div> */}
      </div>
    </nav>
  );
};

export default Navbar;