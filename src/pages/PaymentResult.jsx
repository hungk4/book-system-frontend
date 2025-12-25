import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const responseCode = searchParams.get("vnp_ResponseCode");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-100">
        {responseCode === "00" ? (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Thanh toán thành công!</h1>
            <p className="text-slate-500 mb-8">Tài khoản Premium của bạn đã sẵn sàng.</p>
          </>
        ) : (
          <>
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Thanh toán thất bại</h1>
            <p className="text-slate-500 mb-8">Có lỗi xảy ra hoặc giao dịch bị hủy.</p>
          </>
        )}
        <button 
          onClick={() => navigate("/")}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
};

export default PaymentResult;