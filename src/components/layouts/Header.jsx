import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, BookText } from "lucide-react";

const Header = () => {
  // State quản lý chế độ tối
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Kiểm tra localStorage xem người dùng đã chọn trước đó chưa
    return localStorage.getItem("theme") === "dark";
  });

  // Effect: Chạy mỗi khi isDarkMode thay đổi
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
        >
          <BookText size={28} />
          <span className="text-xl font-bold">BookSystem</span>
        </Link>

        {/* Menu bên phải */}
        <div className="flex items-center space-x-6">
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Trang Chủ
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link
              to="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Đăng Nhập
            </Link>
          </nav>

          {/* Nút Bật/Tắt Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
            title="Chế độ tối/sáng"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
