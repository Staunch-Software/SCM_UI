import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './NavBar';

const Layout = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        {/* The Outlet component renders the matched child route component */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;