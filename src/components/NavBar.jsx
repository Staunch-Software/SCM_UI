import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Package, BarChart3, Users, Building2, Plus, Search } from 'lucide-react';
import '../styles/Navbar.css';
import Notifications from './Notifications';
import UserProfile from './UserProfile';
import { useChatStore } from '../stores/chatStore';

const Navbar = () => {
  const clearMessages = useChatStore((state) => state.clearMessages);
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/orders', label: 'Orders', icon: Package },
    // --- THIS LINE IS THE FIX ---
    { path: '/inventory-hub', label: 'Inventory Hub', icon: BarChart3 },
    { path: '/customers', label: 'Order Management', icon: Users },
    { path: '/vendors', label: 'Vendors', icon: Building2 }
  ];

  const handleNewChat = () => {
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
        
        <div className="navbar-actions">
          <Notifications />
          <UserProfile />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;