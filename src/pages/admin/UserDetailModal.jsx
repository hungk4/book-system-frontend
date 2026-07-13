import React, { useState, useEffect } from "react";
import { X, BookOpen, CreditCard, MessageSquare, Star, Calendar, Loader, Crown, User, CheckCircle2, XCircle, Plus, Minus, Gift, Trash2 } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

const UserDetailModal = ({ userId, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reading"); // 'reading', 'payments', 'reviews'
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await axiosClient.get(`/users/${userId}/details`);
      if (res.data.success) {
        setDetails(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết người dùng:", error);
    }
  };

  useEffect(() => {
    const loadInit = async () => {
      setLoading(true);
      await fetchDetails();
      setLoading(false);
    };
    if (userId) loadInit();
  }, [userId]);

  const handleUpdatePoints = async () => {
    const pointsStr = window.prompt("Nhập số điểm muốn CỘNG (nhập số âm để TRỪ):", "50");
    if (!pointsStr) return;
    
    const pointsChange = parseInt(pointsStr);
    if (isNaN(pointsChange)) {
      toast.error("Vui lòng nhập một số hợp lệ.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await axiosClient.put(`/users/${userId}/points`, { pointsChange });
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchDetails(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật điểm.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGrantPremium = async () => {
    const daysStr = window.prompt("Nhập số ngày Premium muốn tặng:", "30");
    if (!daysStr) return;
    
    const days = parseInt(daysStr);
    if (isNaN(days) || days <= 0) {
      toast.error("Vui lòng nhập số ngày hợp lệ (lớn hơn 0).");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn tặng ${days} ngày Premium cho user này?`)) return;

    setIsUpdating(true);
    try {
      const res = await axiosClient.put(`/users/${userId}/premium`, { days });
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchDetails(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tặng Premium.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) {
      setIsUpdating(true);
      try {
        const res = await axiosClient.delete(`/reviews/${reviewId}`);
        toast.success(res.data.message || "Xóa đánh giá thành công");
        await fetchDetails(); // Tải lại chi tiết để cập nhật điểm mới của user và danh sách review
      } catch (error) {
        console.error("Lỗi khi xóa đánh giá:", error);
        toast.error(error.response?.data?.message || "Xóa đánh giá thất bại");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-blue-600" />
            Chi tiết Người dùng
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Loader className="animate-spin mb-4 text-blue-600" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : details ? (
          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Sidebar / User Info */}
            <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 p-6 overflow-y-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4">
                  {details.user.username.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{details.user.username}</h3>
                <p className="text-sm text-gray-500 mb-3">{details.user.email}</p>
                
                {details.user.premium_expiry ? (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1 border border-amber-200">
                    <Crown size={14} /> Hội viên
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1">
                    Người dùng Thường
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Điểm tích lũy</div>
                    <div className="text-lg font-bold text-amber-600">{details.user.points || 0} điểm</div>
                  </div>
                  <button 
                    onClick={handleUpdatePoints}
                    disabled={isUpdating}
                    className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                    title="Cộng/Trừ điểm"
                  >
                    <Star size={18} />
                  </button>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái Gói</div>
                    <div className="text-sm font-bold text-gray-800">
                      {details.user.premium_expiry 
                        ? `Hết hạn vào ngày ${new Date(details.user.premium_expiry).toLocaleDateString('vi-VN')}` 
                        : "Gói Miễn phí"}
                    </div>
                  </div>
                  <button 
                    onClick={handleGrantPremium}
                    disabled={isUpdating}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    title="Tặng Premium thủ công"
                  >
                    <Gift size={18} />
                  </button>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Chuỗi ngày đọc</div>
                  <div className="text-lg font-bold text-orange-500">{details.user.streak_count || 0} ngày</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Ngày tham gia</div>
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(details.user.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100 p-2 gap-2 bg-white">
                <button
                  onClick={() => setActiveTab("reading")}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === "reading" 
                      ? "bg-blue-50 text-blue-700 shadow-sm" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen size={16} /> Lịch sử đọc
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === "payments" 
                      ? "bg-blue-50 text-blue-700 shadow-sm" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <CreditCard size={16} /> Giao dịch
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    activeTab === "reviews" 
                      ? "bg-blue-50 text-blue-700 shadow-sm" 
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <MessageSquare size={16} /> Đánh giá
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {/* Lịch sử đọc */}
                {activeTab === "reading" && (
                  <div className="space-y-4">
                    {details.bookmarks.length === 0 ? (
                      <p className="text-center text-gray-500 italic py-8">Chưa đọc cuốn sách nào.</p>
                    ) : (
                      details.bookmarks.map((bm, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
                          <div className="w-12 h-16 bg-gray-200 rounded object-cover overflow-hidden flex-shrink-0">
                            {bm.cover_url ? (
                              <img src={bm.cover_url} alt={bm.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-full h-full p-3 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{bm.title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-1 rounded">Trang {bm.last_page}</span>
                              <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(bm.updated_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Giao dịch */}
                {activeTab === "payments" && (
                  <div className="space-y-4">
                    {details.payments.length === 0 ? (
                      <p className="text-center text-gray-500 italic py-8">Chưa có giao dịch nào.</p>
                    ) : (
                      <div className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                              <th className="px-4 py-3">Ngày giao dịch</th>
                              <th className="px-4 py-3">Số tiền</th>
                              <th className="px-4 py-3">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {details.payments.map((p, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{new Date(p.payment_date).toLocaleDateString('vi-VN')}</td>
                                <td className="px-4 py-3 font-semibold text-gray-800">{parseInt(p.amount).toLocaleString('vi-VN')} đ</td>
                                <td className="px-4 py-3">
                                  {p.status === 'succeeded' ? (
                                    <span className="text-green-600 flex items-center gap-1 text-xs font-bold uppercase"><CheckCircle2 size={14}/> Thành công</span>
                                  ) : (
                                    <span className="text-red-500 flex items-center gap-1 text-xs font-bold uppercase"><XCircle size={14}/> Thất bại</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Đánh giá */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {details.reviews.length === 0 ? (
                      <p className="text-center text-gray-500 italic py-8">Chưa có đánh giá nào.</p>
                    ) : (
                      details.reviews.map((r, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                              <BookOpen size={16} className="text-blue-500" /> {r.title}
                            </h4>
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{r.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              disabled={isUpdating}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-50"
                              title="Xóa đánh giá này"
                            >
                              <Trash2 size={14} /> Xóa đánh giá
                            </button>
                            <div className="text-xs text-gray-400">
                              {new Date(r.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-red-500">Lỗi không thể tải dữ liệu.</div>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
