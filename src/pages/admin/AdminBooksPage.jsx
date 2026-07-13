import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Eye,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

const AdminBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [isPremium, setIsPremium] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const ITEMS_PER_PAGE = 10;

  const navigate = useNavigate();


  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Lấy danh sách thể loại để lọc
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get("/categories?all=true");
        setCategories(res.data.categories || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách thể loại:", error);
      }
    };
    fetchCategories();
  }, []);

  // Lấy danh sách sách từ backend khi các bộ lọc hoặc trang thay đổi
  useEffect(() => {
    fetchBooks();
  }, [currentPage, debouncedSearch, categoryId, isPremium, sortBy]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        keyword: debouncedSearch,
        categoryId,
        isPremium,
        sortBy,
      };
      const res = await axiosClient.get("/books", { params });

      setBooks(res.data.books || []);
      setPagination(res.data.pagination || {
        total: (res.data.books || []).length,
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalPages: 1,
      });
    } catch (error) {
      toast.error("Không thể tải danh sách sách");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = pagination.totalPages;
  const safePage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages || 1));

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa cuốn sách này không?")) {
      try {
        await axiosClient.delete(`/books/${id}`);
        toast.success("Xóa sách thành công");
        fetchBooks();
      } catch (error) {
        toast.error("Xóa sách thất bại");
      }
    }
  };

  const handleCategoryChange = (e) => {
    setCategoryId(e.target.value);
    setCurrentPage(1);
  };

  const handlePremiumChange = (e) => {
    setIsPremium(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Kho sách hệ thống
          </h1>
          <p className="text-slate-500 text-sm">
            Quản lý toàn bộ nội dung sách hiện có trên ứng dụng.
          </p>
        </div>
        <Link
          to="/admin/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus size={18} />
          Thêm sách mới
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm theo tên sách hoặc tác giả..."
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown lọc danh mục */}
            <div className="relative">
              <select
                value={categoryId}
                onChange={handleCategoryChange}
                className="appearance-none pl-3 pr-12 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 font-medium cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Dropdown lọc Premium */}
            <div className="relative">
              <select
                value={isPremium}
                onChange={handlePremiumChange}
                className="appearance-none pl-3 pr-12 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 font-medium cursor-pointer"
              >
                <option value="">Trạng thái (Tất cả)</option>
                <option value="false">Free</option>
                <option value="true">Premium</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Dropdown Sắp xếp */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="appearance-none pl-3 pr-12 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 font-medium cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title_asc">Tên sách (A-Z)</option>
                <option value="title_desc">Tên sách (Z-A)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Thông tin sách
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Tác giả
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Danh mục sách
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-400 italic"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : books.length > 0 ? (
                books.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded-md border border-slate-100 shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">
                            {book.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {book.author_name || <span className="text-slate-400 italic">Không có</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {book.category_name || <span className="text-slate-400 italic">Chưa có</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          book.is_premium
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {book.is_premium ? "Premium" : "Free"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Xem chi tiết admin"
                          onClick={() =>
                            navigate(`/admin/books/${book.id}`)
                          }
                        >
                          <Eye size={18} />
                        </button>
                        <a
                          href={`/book/${book.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Xem trên web"
                        >
                          <ExternalLink size={18} />
                        </a>
                        <button
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Chỉnh sửa"
                          onClick={() =>
                            navigate(`/admin/edit-book/${book.id}`)
                          }
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-400 italic"
                  >
                    Không tìm thấy cuốn sách nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Hiển thị <span className="font-medium text-gray-700">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium text-gray-700">{Math.min(safePage * ITEMS_PER_PAGE, pagination.total)}</span> trong số <span className="font-medium text-gray-700">{pagination.total}</span> cuốn sách
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors bg-white shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-2 mx-2 text-sm text-gray-600">
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
                  className="w-14 text-center py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
                <span>/ {totalPages || 1}</span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-indigo-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors bg-white shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBooksPage;
