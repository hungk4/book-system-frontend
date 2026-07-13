import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const SubscriptionPage = () => {
  const [activeLoadingId, setActiveLoadingId] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [initialSub, setInitialSub] = useState(null);
  const [plans, setPlans] = useState([]);

  // Lấy trạng thái ngày hết hạn hiện tại để làm mốc so sánh
  useEffect(() => {
    axiosClient.get("/payments/my-subscription")
      .then(res => {
         setInitialSub(res.data.subscription?.expiry_date || null);
      })
      .catch(console.error);
  }, []);

  // Lấy danh sách gói hội viên động từ database
  useEffect(() => {
    setLoadingPackages(true);
    axiosClient.get("/settings/public")
      .then(res => {
        if (res.data.success && res.data.settings?.premium_packages) {
          const packages = res.data.settings.premium_packages.sort((a, b) => a.duration_months - b.duration_months);
          
          const mapped = packages.map((pkg, index) => {
            return {
              id: pkg.id,
              name: pkg.name ? pkg.name.replace(/Premium/g, "Hội viên") : "Gói Hội viên",
              price: pkg.price,
              months: pkg.duration_months,
              duration: `/${pkg.duration_months} tháng`,
              description: pkg.description ? pkg.description.replace(/Premium/g, "Hội viên") : "",
            };
          });
          setPlans(mapped);
        }
      })
      .catch(err => {
        console.error("Lỗi tải gói hội viên:", err);
      })
      .finally(() => {
        setLoadingPackages(false);
      });
  }, []);

  // Polling tự động kiểm tra thanh toán mỗi 3 giây khi hiển thị Mã QR
  useEffect(() => {
    let interval;
    if (qrData) {
      interval = setInterval(async () => {
        try {
          const res = await axiosClient.get("/payments/my-subscription");
          const currentExpiry = res.data.subscription?.expiry_date;
          // Nếu có ngày hết hạn mới và khác ngày cũ -> Webhook đã chạy thành công
          if (currentExpiry && currentExpiry !== initialSub) {
            clearInterval(interval);
            setQrData(null);
            toast.success("Thanh toán thành công! Hệ thống tự động nhận diện.");
            window.location.href = "/payment-result?status=success";
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 3000); // 3 giây trích xuất DB một lần
    }
    return () => clearInterval(interval);
  }, [qrData, initialSub]);

  const handleSubscribe = async (planId, amount, months, planName) => {
    try {
      setActiveLoadingId(planId);
      // Gọi API create-payment-url đã sửa lại ở backend (trả về QR SePay)
      const res = await axiosClient.post("/payments/create-payment-url", {
        amount,
        months,
        orderDescription: `Nâng cấp gói Hội viên: ${planName}`,
      });

      if (res.data.paymentUrl) {
        // Mở Modal QR thay vì chuyển trang
        setQrData({
            url: res.data.paymentUrl,
            content: res.data.transferContent,
            amount: res.data.amount,
            planName: planName
        });
      } else {
        toast.error("Không thể khởi tạo link thanh toán.");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi kết nối với cổng thanh toán.");
    } finally {
      setActiveLoadingId(null);
    }
  };

  if (loadingPackages) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-16 px-4">
      {/* Tiêu đề trang */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-4">Nâng Cấp Gói Hội Viên</h1>
      </div>

      {/* Danh sách các gói */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, index) => (
          <div
            key={index}
            className="relative bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{plan.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black text-slate-800 dark:text-white">
                  {plan.price.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">{plan.duration}</span>
              </div>
            </div>

            {/* Nút thanh toán */}
            <button
              disabled={activeLoadingId !== null}
              onClick={() => handleSubscribe(plan.id, plan.price, plan.months, plan.name)}
              className={`w-full py-4 mt-8 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 active:scale-95 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg shadow-blue-100 dark:shadow-none cursor-pointer ${activeLoadingId !== null ? "opacity-70 cursor-not-allowed " : ""}`}
            >
              {activeLoadingId === plan.id ? (
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
      <div className="mt-16 text-center text-slate-500 dark:text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 pt-8">
        <p>Thanh toán an toàn qua cổng VietQR SePay. Liên hệ hỗ trợ nếu bạn gặp vấn đề trong quá trình thanh toán.</p>
      </div>

      {/* Modal QR Code Thanh Toán */}
      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 shadow-2xl relative">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thanh toán bằng mã QR</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm text-center mb-6">Mở app Ngân hàng và quét mã để nâng cấp {qrData.planName}</p>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 w-full">
               <img src={qrData.url} alt="QR Thanh toán" className="w-full h-auto rounded-lg shadow-sm" />
            </div>

            <div className="w-full text-center mb-6 space-y-2 bg-blue-50 dark:bg-blue-950/30 py-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <p className="text-sm text-slate-600 dark:text-slate-300">Nội dung chuyển khoản (Bắt buộc):</p>
                <p className="font-mono font-bold text-lg text-indigo-650 dark:text-indigo-400 tracking-wider bg-white dark:bg-slate-900 py-1 mx-4 rounded shadow-sm border border-indigo-200 dark:border-indigo-800">
                    {qrData.content}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold px-4 mt-1">Phải điền ĐÚNG nội dung này thì hệ thống mới tự động duyệt VIP nhé!</p>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setQrData(null)}
                className="flex-1 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
               >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;