import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import BookCard from "../components/BookCard";
import { BookOpen, Heart, Library } from "lucide-react";

const MyLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState("reading");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get("/books/library")
      .then((res) => {
        setBooks(res.data.books || []);
      })
      .catch((err) => {
        console.error("Error fetching user library:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const readingBooks = books.filter((b) => b.last_page > 0);
  const favoriteBooks = books.filter((b) => b.is_favorite);
  const displayBooks = activeTab === "reading" ? readingBooks : favoriteBooks;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 dark:shadow-none shadow-lg">
            <Library className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Tủ sách cá nhân
          </h1>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 bg-gray-200/50 dark:bg-slate-800 rounded-xl w-fit mb-10 border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("reading")}
            className={`cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "reading"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-slate-700/50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Đang đọc
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === "reading"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-slate-900 text-gray-400"
              }`}
            >
              {readingBooks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("favorite")}
            className={`cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "favorite"
                ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-slate-700/50"
            }`}
          >
            <Heart className="w-4 h-4" />
            Yêu thích
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === "favorite"
                  ? "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                  : "bg-gray-100 dark:bg-slate-900 text-gray-400"
              }`}
            >
              {favoriteBooks.length}
            </span>
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : displayBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {displayBooks.map((book) => (
              <div
                key={book.id}
                className="group flex flex-col bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-300 border border-gray-100 dark:border-slate-700"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <BookCard book={book} />
                  <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Progress Section */}
                <div className="mt-4 px-1">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Tiến độ
                    </span>

                    <span
                      className={`text-xs font-bold ${activeTab === "favorite" ? "text-pink-600 dark:text-pink-400" : "text-blue-600 dark:text-blue-400"}`}
                    >
                      {Math.min(book.last_page, book.total_pages)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden border dark:border-slate-700">
                    <div
                      className={`h-full transition-all duration-500 ease-out rounded-full ${
                        activeTab === "favorite"
                          ? "bg-pink-500 dark:bg-pink-600"
                          : "bg-blue-600 dark:bg-blue-500"
                      }`}
                      style={{
                        width: `${Math.min((book.last_page / book.total_pages) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1 font-medium">
                    <BookOpen className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    Trang {book.last_page} / {book.total_pages}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
            <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <Library className="text-gray-300 dark:text-gray-600 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Chưa có sách nào
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto text-sm">
              Danh sách {activeTab === "reading" ? "đang đọc" : "yêu thích"} của
              bạn đang trống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLibraryPage;
