import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { Search, ChevronLeft, ChevronRight, DollarSign, Calendar, Gift, CheckCircle2, XCircle, Clock, CreditCard, ChevronDown, X } from "lucide-react";

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'revenue', 'grant'
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'succeeded', 'pending', 'failed'
  const [filterDate, setFilterDate] = useState(""); // YYYY-MM-DD
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc', 'asc'
  
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

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        keyword: debouncedSearch,
        type: filterType,
        status: filterStatus,
        date: filterDate,
        sort: sortOrder,
      };
      const res = await axiosClient.get("/payments/admin", { params });
      if (res.data.success) {
        setPayments(res.data.data || []);
        setStats(res.data.stats);
        setPagination(res.data.pagination || {
          total: (res.data.data || []).length,
          page: 1,
          limit: ITEMS_PER_PAGE,
          totalPages: 1,
        });
      }
    } catch (err) {
      toast.error("Không thể tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage, debouncedSearch, filterType, filterStatus, filterDate, sortOrder]);

  const totalPages = pagination.totalPages;
  const safePage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages || 1));
  const currentPayments = payments;

  return (
    <div className="p-4 md:p-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="text-blue-600" />
          Quản lý Giao dịch
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Theo dõi dòng tiền, hóa đơn thanh toán và lịch sử cấp phát gói hội viên.
        </p>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Tổng doanh thu</div>
              <div className="text-2xl font-bold text-gray-800">{stats.total_revenue.toLocaleString('vi-VN')} đ</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Hôm nay ({stats.today_count} GD)</div>
              <div className="text-2xl font-bold text-gray-800">{stats.today_revenue.toLocaleString('vi-VN')} đ</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        {/* Row 1: Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã giao dịch, email hoặc tên..."
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
        
        {/* Row 2: Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input 
            type="date"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
            title="Lọc theo ngày cụ thể"
          />

          <div className="relative">
            <select 
              className="appearance-none pl-3 pr-12 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white cursor-pointer"
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
            >
              <option value="desc">Thời gian: Mới nhất</option>
              <option value="asc">Thời gian: Cũ nhất</option>
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
              <option value="succeeded">Thành công</option>
              <option value="pending">Đang chờ</option>
              <option value="failed">Thất bại</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <select 
              className="appearance-none pl-3 pr-12 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white cursor-pointer"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Tất cả giao dịch</option>
              <option value="revenue">Khách thanh toán</option>
              <option value="grant">Admin cấp tặng</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
          
          {/* Nút xóa bộ lọc */}
          {(filterDate || sortOrder !== 'desc' || filterStatus !== 'all' || filterType !== 'all') && (
            <button 
              onClick={() => {
                setFilterDate("");
                setSortOrder("desc");
                setFilterStatus("all");
                setFilterType("all");
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Mã GD</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Số tiền</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentPayments.length > 0 ? (
                currentPayments.map((p) => {
                  const isGrant = parseInt(p.amount) === 0;
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-gray-700">{p.payment_id}</span>
                          {isGrant && <Gift size={14} className="text-purple-500" title="Giao dịch do Admin tự tạo" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-sm">
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 text-sm">{p.username}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isGrant ? 'text-gray-400' : 'text-gray-900'}`}>
                          {parseInt(p.amount).toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.status === 'succeeded' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200">
                            <CheckCircle2 size={12} /> Thành công
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 border border-yellow-200">
                            <Clock size={12} /> Đang chờ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                            <XCircle size={12} /> Thất bại
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(p.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">
                    Không tìm thấy giao dịch nào.
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
              Hiển thị <span className="font-medium text-gray-700">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium text-gray-700">{Math.min(safePage * ITEMS_PER_PAGE, pagination.total)}</span> trong số <span className="font-medium text-gray-700">{pagination.total}</span> giao dịch
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-blue-600 disabled:opacity-50 transition-colors bg-white shadow-sm">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2 mx-2 text-sm text-gray-600">
                <span>Trang</span>
                <input type="number" min={1} max={totalPages || 1} value={currentPage} onChange={(e) => setCurrentPage(e.target.value === "" ? "" : Number(e.target.value))} onBlur={() => setCurrentPage(safePage)} className="w-14 text-center py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span>/ {totalPages || 1}</span>
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-blue-600 disabled:opacity-50 transition-colors bg-white shadow-sm">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
