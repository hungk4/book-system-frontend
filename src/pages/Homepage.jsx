import React, { useEffect, useMemo, useState, useRef } from "react";
import axiosClient from "../api/axiosClient";
import BookCard from "../components/BookCard";
import SearchableSelect from "../components/SearchableSelect";
import { Loader, BookOpen, Search, Gift, X, ChevronLeft, ChevronRight, Flame, Coins, Crown, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

import { Subject, of, from } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  tap,
  switchMap,
  catchError,
} from "rxjs/operators";

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [profile, setProfile] = useState(null);

  // State điểm danh nổi
  const [checkingInWidget, setCheckingInWidget] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);
  const [showCheckinSuccessPopup, setShowCheckinSuccessPopup] = useState(false);

  // Quản lý filter
  const [filters, setFilters] = useState({
    keyword: "",
    category_id: "",
    author_id: "",
    is_premium: "",
    sort: "newest",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCheckinPrompt, setShowCheckinPrompt] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const ITEMS_PER_PAGE = 10;

  // Lấy profile khi mount nếu đã đăng nhập
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      axiosClient.get("/auth/profile")
        .then((res) => {
          if (res.data.success) {
            setProfile(res.data.user);
          }
        })
        .catch((err) => console.error("Lỗi tải thông tin cá nhân:", err));
    }
  }, []);

  // Check checkin status
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      axiosClient.get("/payments/checkin-status")
        .then(res => {
          if (!res.data.hasCheckedInToday) {
            setShowCheckinPrompt(true);
          }
        })
        .catch(console.error);
    }
  }, []);

  // Thực hiện điểm danh ngay tại widget
  const handleCheckinFromWidget = async (e) => {
    e.preventDefault();
    try {
      setCheckingInWidget(true);
      const res = await axiosClient.post("/payments/checkin");
      setCheckinResult(res.data);
      setShowCheckinSuccessPopup(true);
      setShowCheckinPrompt(false);

      // Đồng bộ trực tiếp với state profile để hiển thị dải stats mới
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              points: res.data.newPoints,
              streak_count: res.data.newStreak,
            }
          : null
      );

      // Tự động đóng sau 3 giây
      setTimeout(() => {
        setShowCheckinSuccessPopup(false);
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Điểm danh thất bại");
    } finally {
      setCheckingInWidget(false);
    }
  };

  const searchSubject = useMemo(() => new Subject(), []); // tạo 1 instance duy nhất

  // Xử lý RxJS Stream
  useEffect(() => {
    const stream$ = searchSubject.pipe(
      tap(() => setLoading(true)),
      debounceTime(500),
      switchMap((reqFilters) => {
        const params = {
          page: reqFilters.page || 1,
          limit: ITEMS_PER_PAGE,
        };
        if (reqFilters.keyword) params.keyword = reqFilters.keyword;
        if (reqFilters.category_id) params.category_id = reqFilters.category_id;
        if (reqFilters.author_id) params.author_id = reqFilters.author_id;
        if (reqFilters.is_premium !== undefined && reqFilters.is_premium !== "") {
          params.is_premium = reqFilters.is_premium;
        }
        if (reqFilters.sort) params.sort = reqFilters.sort;

        return from(axiosClient.get("/books", { params })).pipe(
          catchError((err) => {
            console.error("Lỗi tải sách:", err);
            setError("Không thể tải dữ liệu.");
            return of({
              data: {
                books: [],
                pagination: { total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 1 },
              },
            });
          })
        );
      })
    );

    const sub = stream$.subscribe((response) => {
      setBooks(response.data.books || []);
      setPagination(response.data.pagination || {
        total: (response.data.books || []).length,
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalPages: 1,
      });
      setLoading(false);
      setError(null);
    });

    return () => {
      sub.unsubscribe();
    };
  }, [searchSubject]);

  // Filter hoặc Page thay đổi thì đẩy giá trị mới vào stream
  useEffect(() => {
    searchSubject.next({ ...filters, page: currentPage });
  }, [filters, currentPage, searchSubject]);

  // Lấy categories và authors khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosClient.get("/categories?all=true");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Lỗi tải thể loại:", err);
      }
    };

    const fetchAuthors = async () => {
      try {
        const response = await axiosClient.get("/authors?all=true");
        setAuthors(response.data.authors || []);
      } catch (err) {
        console.error("Lỗi tải tác giả:", err);
      }
    };

    fetchCategories();
    fetchAuthors();
  }, []);

  // --- Handler ---
  const handleCategoryChange = (val) => {
    setFilters((prev) => ({ ...prev, category_id: val }));
    setCurrentPage(1);
  };

  const handleAuthorChange = (val) => {
    setFilters((prev) => ({ ...prev, author_id: val }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, keyword: e.target.value }));
    setCurrentPage(1);
  };

  const handlePremiumChange = (val) => {
    setFilters((prev) => ({ ...prev, is_premium: val }));
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setFilters((prev) => ({ ...prev, sort: val }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      keyword: "",
      category_id: "",
      author_id: "",
      is_premium: "",
      sort: "newest",
    });
    setCurrentPage(1);
  };

  const getVipDaysRemaining = (expiryDateStr) => {
    if (!expiryDateStr) return 0;
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const totalPages = pagination.totalPages;
  const safePage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages || 1));
  const currentBooks = books;

  // Loading ban đầu (chỉ hiện khi chưa có gì cả)
  if (loading && books.length === 0 && categories.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <Loader
          className="animate-spin text-blue-600 dark:text-blue-400 mb-4"
          size={48}
        />
        <span className="text-gray-500 dark:text-gray-400 font-medium">
          Đang tải thư viện sách...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 max-w-lg">
          <h3 className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">
            Đã xảy ra lỗi
          </h3>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Banner có tích hợp CTA buttons */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-2xl p-8 mb-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Khám Phá Tri Thức Mới
          </h1>
          <p className="text-blue-100 dark:text-slate-300 max-w-xl text-lg">
            Hàng ngàn cuốn sách hay đang chờ bạn đọc và trải nghiệm.
          </p>
          {/* CTA Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => document.getElementById("book-library")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer text-sm animate-bounce-subtle"
            >
              Khám phá ngay
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* 2. DẢI STATS CÁ NHÂN */}
      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-6 mb-10 shadow-xs transition-all duration-300">
          {/* Streak */}
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400 rounded-xl">
              <Flame size={24} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chuỗi điểm danh</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{profile.streak_count} ngày</h3>
            </div>
          </div>

          {/* Points */}
          <div className="flex items-center space-x-4 border-t sm:border-t-0 sm:border-x border-slate-100 dark:border-slate-700/50 pt-4 sm:pt-0 sm:px-6">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-xl">
              <Coins size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Điểm tích lũy</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{profile.points.toLocaleString()} điểm</h3>
            </div>
            <Link to="/rewards" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">Đổi quà</Link>
          </div>

          {/* VIP Status */}
          <div className="flex items-center space-x-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/50 pt-4 sm:pt-0">
            {getVipDaysRemaining(profile.premium_expiry) > 0 ? (
              <>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-xl">
                  <Crown size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hội viên Premium</p>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Còn {getVipDaysRemaining(profile.premium_expiry)} ngày
                  </h3>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl">
                  <Crown size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hội viên Premium</p>
                  <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">Chưa kích hoạt</h3>
                </div>
                <Link to="/subscription" className="text-xs bg-linear-to-r from-amber-500 to-orange-500 hover:scale-105 transition-transform text-white px-3 py-1.5 rounded-full font-bold shadow-xs">
                  Nâng cấp
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. THANH FILTER (MỚI) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-6 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-6 bg-blue-600 dark:bg-blue-500 rounded-full"></span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bộ lọc thư viện</h3>
            {pagination.total > 0 && (
              <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-2.5 py-0.5 rounded-full">
                {pagination.total} cuốn sách
              </span>
            )}
          </div>
          
          {/* Nút xóa bộ lọc */}
          {(filters.keyword || filters.category_id || filters.author_id || filters.is_premium !== "" || filters.sort !== "newest") && (
            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center space-x-1 text-xs text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Input Tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm tên sách, tác giả..."
              value={filters.keyword}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-gray-800 dark:text-white transition-colors"
            />
            <Search
              className="absolute left-3 top-3.5 text-gray-400"
              size={18}
            />
          </div>

          {/* Select Thể loại */}
          <div className="relative z-30">
            <SearchableSelect
              options={[{ id: "", name: "Tất cả thể loại" }, ...categories]}
              value={filters.category_id}
              onChange={handleCategoryChange}
              placeholder="Tất cả thể loại"
            />
          </div>

          {/* Select Tác giả */}
          <div className="relative z-30">
            <SearchableSelect
              options={[{ id: "", name: "Tất cả tác giả" }, ...authors.map(a => ({ id: a.id, name: a.name }))] || []}
              value={filters.author_id}
              onChange={handleAuthorChange}
              placeholder="Tất cả tác giả"
            />
          </div>

          {/* Loại sách (Toggle 3 nút: Tất cả / Free / Premium) */}
          <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/30">
            <button
              onClick={() => handlePremiumChange("")}
              className={`flex-1 text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                filters.is_premium === ""
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handlePremiumChange("false")}
              className={`flex-1 text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                filters.is_premium === "false"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Miễn phí
            </button>
            <button
              onClick={() => handlePremiumChange("true")}
              className={`flex-1 text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                filters.is_premium === "true"
                  ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-500 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Hội viên
            </button>
          </div>

          {/* Sắp xếp */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 cursor-pointer transition-colors appearance-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="title_asc">Tiêu đề A-Z</option>
              <option value="most_read">Đọc nhiều nhất</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. LƯỚI THƯ VIỆN SÁCH CHÍNH */}
      <div className="mb-6 flex items-center">
        <h2 id="book-library" className="text-2xl font-bold text-gray-800 dark:text-white flex items-center w-full md:w-auto">
          <span className="w-2 h-8 bg-blue-600 dark:bg-blue-500 rounded-full mr-3"></span>
          Thư Viện Sách
        </h2>
      </div>

      {/* 6. Phần Danh sách sách chính và Phân trang (RxJS) */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader
            className="animate-spin text-blue-600 dark:text-blue-400"
            size={32}
          />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
          <div className="inline-block p-4 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
            <BookOpen size={32} className="text-gray-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Không tìm thấy sách nào
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Vui lòng chọn bộ lọc khác.
          </p>
          {(filters.category_id || filters.author_id || filters.keyword || filters.is_premium !== "") && (
            <button
              onClick={handleClearFilters}
              className="mt-4 text-blue-600 hover:underline text-sm font-medium"
            >
              Xem tất cả sách
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {currentBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-10 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
                Hiển thị <span className="font-medium text-gray-700 dark:text-gray-200">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium text-gray-700 dark:text-gray-200">{Math.min(safePage * ITEMS_PER_PAGE, pagination.total)}</span> trong số <span className="font-medium text-gray-700 dark:text-gray-200">{pagination.total}</span> cuốn sách
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safePage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-2 mx-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>Trang</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages || 1}
                    value={currentPage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setCurrentPage("");
                      } else {
                        setCurrentPage(Number(val));
                      }
                    }}
                    onBlur={() => {
                      if (currentPage === "" || currentPage < 1) setCurrentPage(1);
                      else if (currentPage > totalPages) setCurrentPage(totalPages);
                    }}
                    className="w-14 text-center py-1.5 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900"
                  />
                  <span>/ {totalPages || 1}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Widget Nút Nổi Điểm Danh trực tiếp */}
      {showCheckinPrompt && (
        <button
          onClick={handleCheckinFromWidget}
          disabled={checkingInWidget}
          className="fixed bottom-6 right-6 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] p-4 flex items-center justify-center hover:scale-105 transition-all z-50 group cursor-pointer disabled:opacity-50"
        >
          {checkingInWidget ? (
            <Loader className="animate-spin" size={28} />
          ) : (
            <Gift size={28} className="animate-pulse" />
          )}
          <span className="hidden sm:inline-block font-bold ml-2">
            {checkingInWidget ? "Đang điểm danh..." : "Điểm Danh Nhận Thưởng"}
          </span>
          {!checkingInWidget && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}
        </button>
      )}

      {/* Popup thành công điểm danh nổi */}
      {showCheckinSuccessPopup && checkinResult && (
        <div className="fixed bottom-24 right-6 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.15)] border border-amber-200 dark:border-amber-700/50 p-5 z-50 max-w-xs animate-bounce-in">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
              <Gift size={20} />
            </span>
            <h4 className="font-bold text-slate-800 dark:text-white">Điểm danh thành công!</h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
            Bạn vừa nhận được <strong className="text-amber-600 dark:text-amber-400">+{checkinResult.pointsEarned} điểm</strong>.
            <br />
            🔥 Chuỗi {checkinResult.newStreak} ngày liên tiếp!
          </p>
          <Link
            to="/rewards"
            onClick={() => setShowCheckinSuccessPopup(false)}
            className="block text-center bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all"
          >
            Đổi quà ngay
          </Link>
        </div>
      )}
    </div>
  );
};

export default HomePage;
