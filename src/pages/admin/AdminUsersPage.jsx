import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { Trash2, Users, Search, Mail, Award, Flame, ChevronLeft, ChevronRight, Crown, User, Lock, Unlock, Eye, ChevronDown, X } from "lucide-react";
import UserDetailModal from "./UserDetailModal";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMembership, setFilterMembership] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPremium: 0,
    totalBanned: 0,
  });
  const ITEMS_PER_PAGE = 10;

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        keyword: debouncedSearch,
        membership: filterMembership,
        status: filterStatus,
      };
      const res = await axiosClient.get("/users", { params });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || {
        total: (res.data.users || []).length,
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalPages: 1,
      });
      setStats(res.data.stats || {
        totalUsers: 0,
        totalPremium: 0,
        totalBanned: 0,
      });
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearch, filterMembership, filterStatus]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const actionText = newStatus === 'banned' ? 'KHÓA' : 'MỞ KHÓA';
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) {
      try {
        await axiosClient.put(`/users/${id}/status`, { status: newStatus });
        toast.success(newStatus === 'banned' ? "Đã khóa người dùng" : "Đã mở khóa người dùng");
        fetchUsers();
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái");
      }
    }
  };

  const totalPages = pagination.totalPages;
  const safePage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages || 1));
  const currentUsers = users;

  return (
    <div className="p-4 md:p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" />
            Quản lý người dùng
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý tài khoản, phân quyền và theo dõi thành tích của các thành viên.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Tổng người dùng</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Crown size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Hội viên Premium</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalPremium}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Lock size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Tài khoản bị khóa</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalBanned}</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng theo tên hoặc email..."
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
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
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative">
            <select 
              className="appearance-none pl-3 pr-12 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white cursor-pointer"
              value={filterMembership}
              onChange={(e) => { setFilterMembership(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tất cả hạng</option>
              <option value="premium">Hội viên</option>
              <option value="regular">Thường</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <select 
              className="appearance-none pl-3 pr-12 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white cursor-pointer"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="banned">Bị khóa</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Hạng thành viên</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Thành tích</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{user.username}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            {user.google_id ? (
                              <span className="text-red-500 font-medium border border-red-200 bg-red-50 px-1.5 py-0.5 rounded-sm flex items-center gap-1 text-[10px] uppercase">Google</span>
                            ) : (
                              <span className="text-blue-500 font-medium border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-sm flex items-center gap-1 text-[10px] uppercase">Email</span>
                            )}
                            <span className="ml-1 truncate max-w-[150px] sm:max-w-[200px]" title={user.email}>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Membership Level */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 w-max ${
                        user.is_premium 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {user.is_premium ? <Crown size={12} className="text-amber-600" /> : <User size={12} className="text-gray-500" />}
                        {user.is_premium ? 'Hội viên' : 'Thường'}
                      </span>
                    </td>

                    {/* Achievements */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Award size={14} className="text-amber-500" />
                          {user.points || 0} điểm
                        </div>
                        <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Flame size={14} className="text-orange-500" />
                          {user.streak_count || 0} ngày
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 w-max ${
                        user.status === 'banned' 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {user.status === 'banned' ? 'Bị khóa' : 'Hoạt động'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                          className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                            user.status === 'banned'
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-rose-500 hover:bg-rose-100'
                          }`}
                          title={user.status === 'banned' ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        >
                          {user.status === 'banned' ? <Unlock size={18} /> : <Lock size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Hiển thị <span className="font-medium text-gray-700">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium text-gray-700">{Math.min(safePage * ITEMS_PER_PAGE, pagination.total)}</span> trong số <span className="font-medium text-gray-700">{pagination.total}</span> người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors bg-white shadow-sm"
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
                    if (val === "") setCurrentPage("");
                    else setCurrentPage(Number(val));
                  }}
                  onBlur={() => {
                    if (currentPage === "" || currentPage < 1) setCurrentPage(1);
                    else if (currentPage > totalPages) setCurrentPage(totalPages);
                  }}
                  className="w-14 text-center py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>/ {totalPages || 1}</span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-transparent transition-colors bg-white shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
