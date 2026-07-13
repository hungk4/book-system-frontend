import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { Edit, Trash2, Plus, X, Users, List, ChevronLeft, ChevronRight, Search, ChevronDown } from "lucide-react";

const AdminAuthorsPage = () => {
  const [authors, setAuthors] = useState([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const ITEMS_PER_PAGE = 10;

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        keyword: debouncedSearch,
        sortBy: sortBy,
      };
      const res = await axiosClient.get("/authors", { params });
      setAuthors(res.data.authors || []);
      setPagination(res.data.pagination || {
        total: (res.data.authors || []).length,
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalPages: 1,
      });
    } catch (err) {
      toast.error("Không thể tải danh sách tác giả");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [currentPage, debouncedSearch, sortBy]);

  const totalPages = pagination.totalPages;
  const safePage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages || 1));
  const currentAuthors = authors;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.warn("Tên tác giả không được để trống");

    try {
      if (editingId) {
        await axiosClient.put(`/authors/${editingId}`, { name, bio });
        toast.success("Cập nhật tác giả thành công");
      } else {
        await axiosClient.post("/authors", { name, bio });
        toast.success("Thêm tác giả thành công");
        setSearchTerm("");
        setSortBy("name_asc");
        setCurrentPage(1);
      }
      resetForm();
      fetchAuthors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tác giả này?")) {
      try {
        await axiosClient.delete(`/authors/${id}`);
        toast.success("Xóa tác giả thành công");
        fetchAuthors();
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa tác giả");
      }
    }
  };

  const startEdit = (author) => {
    setName(author.name);
    setBio(author.bio || "");
    setEditingId(author.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setName("");
    setBio("");
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <List className="text-indigo-600" />
            Quản lý tác giả
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Thêm, sửa hoặc xóa các tác giả trong hệ thống.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {editingId ? "Chỉnh sửa tác giả" : "Thêm tác giả mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Name */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="Tên tác giả *"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${
                  editingId
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                }`}
              >
                {editingId ? <Edit size={18} /> : <Plus size={18} />}
                {editingId ? "Cập nhật" : "Tạo tác giả"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <textarea
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-gray-50 focus:bg-white resize-none text-sm"
            placeholder="Tiểu sử tác giả (không bắt buộc)"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </form>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm tác giả (tên hoặc tiểu sử)..."
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-3 pr-12 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-600 font-medium cursor-pointer"
            >
              <option value="name_asc">Tên tác giả (A-Z)</option>
              <option value="name_desc">Tên tác giả (Z-A)</option>
              <option value="books_desc">Số lượng sách (Nhiều - Ít)</option>
              <option value="books_asc">Số lượng sách (Ít - Nhiều)</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Tên tác giả</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Tiểu sử</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Số lượng sách</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : authors.length > 0 ? (
                currentAuthors.map((author) => (
                  <tr key={author.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                        {author.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <span className="line-clamp-2">
                        {author.bio || <span className="italic text-gray-300">Chưa có tiểu sử</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {author.book_count || 0} cuốn sách
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(author)}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(author.id)}
                          className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-all"
                          title="Xóa tác giả"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">
                    {searchTerm ? `Không tìm thấy tác giả nào phù hợp với từ khóa "${searchTerm}"` : "Chưa có tác giả nào được tạo."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Hiển thị <span className="font-medium text-gray-700">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium text-gray-700">{Math.min(safePage * ITEMS_PER_PAGE, pagination.total)}</span> trong số <span className="font-medium text-gray-700">{pagination.total}</span> tác giả
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
                  className="w-14 text-center py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

export default AdminAuthorsPage;
