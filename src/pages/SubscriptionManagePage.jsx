import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { Crown, AlertCircle, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const SubscriptionManagePage = () => {
  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await axiosClient.get("/payments/my-subscription");
        setSubInfo(res.data.subscription);
      } catch (err) {
        console.error("Lỗi lấy thông tin gói");
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 mt-10 transition-colors">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-900 dark:text-white">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <Crown className="text-amber-500" size={24} />
        </div>
        Gói hội viên của tôi
      </h1>

      {subInfo ? (
        <div className="space-y-6">
          {/* Trạng thái gói */}
          <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Trạng thái hiện tại</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 capitalize">
                  {subInfo.status === 'active' ? 'Đang hoạt động' : subInfo.status}
                </p>
              </div>
              <div className="h-12 w-12 bg-white dark:bg-blue-800/50 rounded-full flex items-center justify-center shadow-sm">
                <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </div>

          {/* Chi tiết ngày tháng */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700 rounded-xl">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ngày hết hạn</p>
            <p className="font-semibold text-red-500 dark:text-red-400">
              {new Date(subInfo.expiry_date).toLocaleDateString('vi-VN')}
            </p>
          </div>
          
          {/* Nút gia hạn */}
          <Link 
            to="/subscription" 
            className="group flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all cursor-pointer mt-6"
          >
            Gia hạn ngay
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : (
        /* Giao diện khi chưa có gói */
        <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl bg-gray-50/50 dark:bg-slate-900/20">
          <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
            <AlertCircle className="text-gray-400" size={32} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-6 text-lg">
            Bạn chưa đăng ký gói hội viên nào.
          </p>
          <Link 
            to="/subscription" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
          >
            Khám phá các gói ngay
          </Link>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagePage;