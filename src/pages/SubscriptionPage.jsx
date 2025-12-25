import React, { useState } from "react";
import axiosClient from "../api/axiosClient";
import { Check, ShieldCheck, Zap, Star, Crown, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const SubscriptionPage = () => {
  const [loading, setLoading] = useState(false);

  // Cấu hình các gói hội viên đồng bộ với logic xử lý tại Backend
  const plans = [
    {
      name: "Gói Tháng",
      price: 50000,
      months: 1,
      duration: "/tháng",
      description: "Phù hợp để trải nghiệm thử dịch vụ.",
      icon: <Zap className="text-blue-500" size={24} />,
      features: ["Đọc toàn bộ sách Premium", "Không quảng cáo", "Hỗ trợ cơ bản"],
      popular: false,
    },
    {
      name: "Gói 6 Tháng",
      price: 250000,
      months: 6,
      duration: "/6 tháng",
      description: "Tiết kiệm hơn 15% so với mua lẻ từng tháng.",
      icon: <Star className="text-purple-500" size={24} />,
      features: ["Mọi tính năng gói tháng", "Hỗ trợ ưu tiên 24/7", "Đọc trước sách mới phát hành"],
      popular: true, // Làm nổi bật gói này
    },
    {
      name: "Gói Năm",
      price: 450000,
      months: 12,
      duration: "/năm",
      description: "Lựa chọn tốt nhất cho người đọc lâu dài.",
      icon: <Crown className="text-amber-500" size={24} />,
      features: ["Mọi tính năng gói 6 tháng", "Tiết kiệm 25% chi phí", "Quà tặng ebook độc quyền hàng tháng"],
      popular: false,
    },
  ];

  const handleSubscribe = async (amount, months, planName) => {
    try {
      setLoading(true);
      // Gọi API create-payment-url đã viết ở Backend
      const res = await axiosClient.post("/payments/create-payment-url", {
        amount,
        months,
        orderDescription: `Nâng cấp gói Premium: ${planName}`,
      });

      if (res.data.paymentUrl) {
        // Chuyển hướng người dùng sang cổng thanh toán VNPay
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error("Không thể khởi tạo link thanh toán.");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi kết nối với cổng thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      {/* Tiêu đề trang */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <ShieldCheck className="text-blue-600" size={48} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Nâng Cấp Hội Viên Premium</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Mở khóa toàn bộ kho sách PDF chất lượng cao và tận hưởng trải nghiệm đọc sách không giới hạn.
        </p>
      </div>

      {/* Danh sách các gói */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative bg-white p-8 rounded-3xl border transition-all duration-300 flex flex-col ${
              plan.popular
                ? "border-blue-500 shadow-xl scale-105 z-10"
                : "border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
            }`}
          >
            {/* Nhãn gói phổ biến */}
            {plan.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                Phổ biến nhất
              </span>
            )}

            <div className="mb-6">
              <div className="mb-4">{plan.icon}</div>
              <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-slate-900">
                {plan.price.toLocaleString("vi-VN")}đ
              </span>
              <span className="text-slate-400 font-medium">{plan.duration}</span>
            </div>

            {/* Danh sách tính năng */}
            <ul className="space-y-4 mb-10 flex-grow text-left">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                  <Check className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Nút thanh toán */}
            <button
              disabled={loading}
              onClick={() => handleSubscribe(plan.price, plan.months, plan.name)}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                plan.popular
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Đang xử lý...
                </>
              ) : (
                "Nâng cấp ngay"
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Thông tin hỗ trợ */}
      <div className="mt-16 text-center text-slate-400 text-sm border-t border-slate-100 pt-8">
        <p>Thanh toán an toàn qua cổng VNPay. Liên hệ hỗ trợ nếu bạn gặp vấn đề trong quá trình thanh toán.</p>
      </div>
    </div>
  );
};

export default SubscriptionPage;