import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Layers,
  Star,
  Crown,
  DollarSign,
  BookCheck,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import axiosClient from "../../api/axiosClient";

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosClient.get("/books/stats");
        const data = res?.data || res;
        setStatsData(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
        setError("Không thể tải dữ liệu thống kê hệ thống. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Định nghĩa các thẻ thông số
  const stats = [
    {
      label: "Tổng số sách",
      value: statsData?.totalBooks || 0,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Sách Premium",
      value: statsData?.totalPremiumBooks || 0,
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Tổng người dùng",
      value: statsData?.totalUsers || 0,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Tổng hội viên",
      value: statsData?.totalActiveSubscriptions || 0,
      icon: Crown,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Tổng doanh thu",
      value: statsData?.totalRevenue || 0,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      isCurrency: true,
    },
    {
      label: "Lượt đọc xong",
      value: statsData?.totalCompletedBooks || 0,
      icon: BookCheck,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Tổng đánh giá",
      value: statsData?.totalReviews || 0,
      icon: MessageSquare,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      label: "Danh mục",
      value: statsData?.totalCategories || 0,
      icon: Layers,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h1>
        <p className="text-slate-500 text-sm">
          Thống kê hoạt động, doanh thu, tăng trưởng thành viên và lịch sử hoạt động hệ thống.
        </p>
      </div>

      {/* Grid 8 stats cards (chia làm 4 cột) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-4">
              <div className={`${item.bg} p-3 rounded-xl`}>
                <item.icon className={item.color} size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  {item.label}
                </p>
                <h3 className="text-xl font-bold text-slate-800">
                  {item.value.toLocaleString("vi-VN")}
                  {item.isCurrency ? " đ" : ""}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ thống kê (2 cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biểu đồ cột: Doanh thu */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">
            Doanh thu 6 tháng gần nhất (VND)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData?.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000).toLocaleString('vi-VN')}k`} />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString('vi-VN')} đ`, "Doanh thu"]}
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ đường: Người dùng mới */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">
            Người dùng mới đăng ký 6 tháng gần nhất
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsData?.usersByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value) => [value, "Người dùng mới"]}
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
