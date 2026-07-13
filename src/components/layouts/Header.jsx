import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  BookText,
  LogOut,
  User,
  ChevronDown,
  Library,
  Calendar,
  Gift
} from "lucide-react";
import axiosClient from "../../api/axiosClient.js";

const Header = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Khởi tạo state user từ localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        return null;
      }
    }
    return null;
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const handleAuthChange = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null); // Khi token hết hạn, axiosClient xóa user -> UI xóa tên
      }
    };

    window.addEventListener("storage", handleAuthChange);

    return () => window.removeEventListener("storage", handleAuthChange);
  }, []);

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  // Effect xử lý Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    try {
      // Gọi API để server xóa Cookie và Token trong DB
      await axiosClient.post("/auth/logout");
    } catch (error) {
      console.error("Lỗi khi gọi API logout:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsMenuOpen(false);
      navigate("/login");
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("themeChanged"));
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-2 text-blue-600 dark:text-blue-400"
        >
          <BookText size={28} />
          <span className="text-xl font-bold">E-Book</span>
        </Link>

        <div className="flex items-center space-x-6">
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium"
            >
              Trang Chủ
            </Link>

            <Link
              to="/subscription"
              className="text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full text-sm font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-1"
            >
              Gói hội viên
            </Link>

            <span className="text-gray-300 dark:text-gray-600">|</span>

            {user ? (
              /* User Menu với Popup */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex cursor-pointer items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User
                      size={18}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-200 hidden sm:block">
                    {user.username || user.email}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${
                      isMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Popup Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-slate-700 z-50 animate-in fade-in zoom-in duration-200">
                    <Link
                      to="/my-library"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    >
                      <Library size={16} />
                      <span className="font-medium">Tủ sách cá nhân</span>
                    </Link>

                    {/* Phân cách */}
                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2"></div>

                    <Link
                      to="/rewards"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                    >
                      <Gift size={16} />
                      <span className="font-medium">Quản lý điểm thưởng</span>
                    </Link>

                    {/* Phân cách */}
                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2"></div>

                    <Link
                      to="/subscription/manage"
                      onClick={() => setIsMenuOpen(false)} 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                    >
                      <Calendar size={16} />
                      <span className="font-medium">Quản lý gói hội viên</span>
                    </Link>

                    {/* Phân cách */}
                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2"></div>

                    <Link
                      to="/account"
                      onClick={() => setIsMenuOpen(false)} 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                    >
                      <User size={16} />
                      <span className="font-medium">Quản lý tài khoản</span>
                    </Link>

                    {/* Phân cách */}
                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-s hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={16} />
                      Thoát tài khoản
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium"
              >
                Đăng Nhập
              </Link>
            )}
          </nav>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 transition-all"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
