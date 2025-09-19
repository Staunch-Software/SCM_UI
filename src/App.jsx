import React, { useState } from 'react';
import Navbar from './components/NavBar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import PlannedOrdersPage from './components/PlannedorderPage';
import InventoryPage from './components/InventoryPage';
import CustomersPage from './components/CustomersPage';
import VendorsPage from './components/VendorsPage';
import VendorMetricsPage from './components/VendorMetricsPage';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleNewChat = () => {
    setCurrentPage('chatbox');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'chatbox':
        return <ChatInterface />;
      case 'orders':
        return <PlannedOrdersPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'customers':
        return <CustomersPage />;
      case 'vendors':
        return <VendorsPage setCurrentPage={setCurrentPage} />;
      case "vendor-metrics":
        return <VendorMetricsPage setCurrentPage={setCurrentPage} />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="app">
      <Navbar 
        currentPage={currentPage}
        onNavigate={handleNavigation}
        onNewChat={handleNewChat}
      />
      <main className="main-content">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default App;