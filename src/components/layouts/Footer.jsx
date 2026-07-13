import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-8 mt-auto transition-colors duration-300">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Book System</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Nền tảng đọc sách trực tuyến hàng đầu Việt Nam.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} Book System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;