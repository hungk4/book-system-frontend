import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { ChevronLeft, AlertCircle, Loader, Lock, Crown, List, Maximize, SlidersHorizontal } from "lucide-react";
import { toast } from "react-toastify";

import PdfBookReader from "../components/PdfBookReader";

const BookReadingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data State
  const [bookTitle, setBookTitle] = useState("");
  const [totalPages, setTotalPages] = useState(0);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Lấy thông tin sách
        const detailRes = await axiosClient.get(`/books/${id}`);
        setBookTitle(detailRes.data.book.title);
        setTotalPages(detailRes.data.book.total_pages || 1);
      } catch (err) {
        console.error("Lỗi khi tải thông tin sách:", err);
        const status = err.response?.status;
        const errorMap = {
          404: {
            type: "not_found",
            message: "Cuốn sách này không tồn tại hoặc đã bị gỡ bỏ.",
          },
        };

        setError(
          errorMap[status] || {
            type: "system",
            message: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
          },
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const [initialPage, setInitialPage] = useState(null);

  useEffect(() => {
    const fetchBookmark = async () => {
      try {
        const res = await axiosClient.get(`/books/${id}/bookmark`);
        // PDF Viewer dùng index từ 0, database lưu từ 1
        setInitialPage(res.data.last_page - 1);
      } catch (err) {
        setInitialPage(0);
      }
    };
    fetchBookmark();
  }, [id]);

  const [zoomScale, setZoomScale] = useState(1.0);
  const [sidebarTrigger, setSidebarTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);


  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Không thể mở toàn màn hình:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };



  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  useEffect(() => {
    const handleThemeUpdate = () => {
      const themeInStorage = localStorage.getItem("theme") || "light";
      setTheme(themeInStorage);
    };

    window.addEventListener("themeChanged", handleThemeUpdate);
    return () => {
      window.removeEventListener("themeChanged", handleThemeUpdate);
    };
  }, []);

  const toggleTheme = (newTheme) => {
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new Event("themeChanged"));
  };

  // --- Render Loading ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium animate-pulse">
          Đang tải tài liệu...
        </p>
      </div>
    );
  }

  // --- Render Error ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
          {error.type === "auth" ? (
            <div className="text-yellow-600 mb-4 flex justify-center">
              <Lock size={48} />
            </div>
          ) : (
            <div className="text-red-500 mb-4 flex justify-center">
              <AlertCircle size={48} />
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Lỗi truy cập
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error.message}
          </p>

          <div className="flex flex-col gap-3 w-full">
            {/* Nút Nâng cấp Premium */}
            {error.status === 403 && (
              <button
                onClick={() => navigate("/subscription")}
                className="w-full py-2.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-2
                 bg-blue-600 hover:bg-blue-700 text-white shadow-md
                 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Crown className="w-5 h-5" />
                Nâng cấp gói Premium
              </button>
            )}

            {/* Nút Đăng nhập  */}
            {error.status === 401 && (
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-lg font-bold transition-all cursor-pointer
                 bg-blue-600 hover:bg-blue-700 text-white
                 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Đăng nhập ngay
              </button>
            )}

            {/* Nút Quay lại */}
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2 rounded-lg font-medium transition-colors cursor-pointer
               border border-gray-300 text-gray-700 hover:bg-gray-50
               dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render PDF View ---
  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] text-gray-200' : 'bg-gray-100 text-slate-800'}`}>
      {/* Header Toolbar */}
      <header className={`h-14 flex items-center justify-between px-6 shrink-0 z-30 relative select-none border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-[#181818] border-[#282828] text-gray-200' : 'bg-white border-slate-200 text-slate-800'}`}>
        {/* Left: Back Arrow */}
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#282828]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          title="Quay lại"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Center: Centered Book Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none max-w-[40%]">
          <span className={`font-semibold text-sm md:text-base tracking-wide truncate block ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
            {bookTitle}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 md:gap-3 relative">


          {/* List button (Sidebar toggle) */}
          <button
            onClick={() => setSidebarTrigger((prev) => prev + 1)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#282828]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            title="Thanh ghi chú / Mục lục"
          >
            <List size={20} />
          </button>


          {/* Settings button */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${showSettings ? (theme === 'dark' ? 'text-white bg-[#282828]' : 'text-slate-800 bg-slate-100') : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#282828]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')}`}
              title="Cấu hình đọc"
            >
              <SlidersHorizontal size={20} />
            </button>

            {/* Settings Dropdown Popover */}
            {showSettings && (
              <div className={`absolute right-0 mt-2.5 w-60 rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4 border ${theme === 'dark' ? 'bg-[#1f1f1f] border-[#2d2d2d] text-gray-200' : 'bg-white border-slate-200 text-slate-800'}`}>
                {/* Zoom section */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Thu phóng</span>
                  <div className={`flex items-center justify-between p-1.5 rounded-lg border ${theme === 'dark' ? 'bg-[#181818] border-[#2d2d2d]' : 'bg-slate-50 border-slate-200'}`}>
                    <button
                      onClick={() => setZoomScale((prev) => Math.max(0.5, parseFloat((prev - 0.1).toFixed(1))))}
                      className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-lg cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[#252525] hover:bg-[#303030] text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
                      title="Thu nhỏ"
                    >
                      -
                    </button>
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale((prev) => Math.min(2.0, parseFloat((prev + 0.1).toFixed(1))))}
                      className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-lg cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[#252525] hover:bg-[#303030] text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
                      title="Phóng to"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Theme section */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Màu nền chính</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        toggleTheme("light");
                        setShowSettings(false);
                      }}
                      className={`py-1.5 rounded text-xs font-bold transition-all border shadow cursor-pointer ${theme === 'light' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-black hover:bg-gray-100'}`}
                    >
                      Sáng
                    </button>
                    <button
                      onClick={() => {
                        toggleTheme("dark");
                        setShowSettings(false);
                      }}
                      className={`py-1.5 rounded text-xs font-bold transition-all border shadow cursor-pointer ${theme === 'dark' ? 'bg-blue-600 border-blue-650 text-white' : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'}`}
                    >
                      Tối
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen button */}
          <button
            onClick={handleToggleFullscreen}
            className={`p-2 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#282828]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            title="Bật/Tắt Toàn màn hình"
          >
            <Maximize size={20} />
          </button>
        </div>
      </header>

      {/* Container hiển thị sách */}
      <div className={`flex-1 w-full relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-200'}`}>
        {initialPage !== null && totalPages > 0 ? (
          <PdfBookReader
            bookId={id}
            initialPage={initialPage}
            totalPages={totalPages}
            zoomScale={zoomScale}
            sidebarTrigger={sidebarTrigger}
            onPageChange={(page) => setCurrentPage(page)}
            onError={(err) => setError(err)}
          />
        ) : (
          <div className={`flex flex-col items-center justify-center h-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-200'}`}>
            <Loader className="animate-spin text-blue-600 mb-4" size={40} />
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Đang chuẩn bị tài liệu...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookReadingPage;
