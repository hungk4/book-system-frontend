import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />
      
      {/* Nội dung chính */}
      <main className="grow container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;