import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";
import { CalendarCheck, Flame, Gift, Coins, Loader2, Check } from "lucide-react";

const RewardsPage = () => {
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState({
    hasCheckedInToday: false,
    streakCount: 0,
    points: 0,
    rewardPoints: { checkin: 10, review: 30 },
    streakMilestones: [],
    rewardShop: { prizes: [] }
  });

  const fetchStatusAndSettings = async () => {
    try {
      setLoading(true);
      const [statusRes, settingsRes] = await Promise.all([
        axiosClient.get("/payments/checkin-status"),
        axiosClient.get("/settings/public")
      ]);

      const s = settingsRes.data.settings || {};
      setStatus({
        hasCheckedInToday: statusRes.data.hasCheckedInToday,
        streakCount: statusRes.data.streakCount,
        points: statusRes.data.points,
        rewardPoints: s.reward_points || { checkin: 10, review: 30 },
        streakMilestones: s.streak_milestones || [],
        rewardShop: s.reward_shop || { prizes: [] }
      });
    } catch (error) {
      toast.error("Lỗi khi tải thông tin điểm danh và cấu hình");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndSettings();
  }, []);

  const handleCheckin = async () => {
    try {
      setCheckingIn(true);
      const res = await axiosClient.post("/payments/checkin");
      toast.success(res.data.message);
      // Cập nhật lại UI sau khi điểm danh thành công (giữ nguyên config)
      setStatus(prev => ({
        ...prev,
        hasCheckedInToday: true,
        streakCount: res.data.newStreak,
        points: res.data.newPoints
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Điểm danh thất bại");
    } finally {
      setCheckingIn(false);
    }
  };

  const [exchangingId, setExchangingId] = useState(null);

  const handleExchangePoints = async (prizeId) => {
    try {
      setExchangingId(prizeId);
      const res = await axiosClient.post("/payments/exchange-points", { prizeId });
      toast.success(res.data.message);
      if (res.data.newPoints !== undefined) {
        setStatus(prev => ({ ...prev, points: res.data.newPoints }));
      } else {
        fetchStatusAndSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi đổi điểm");
    } finally {
      setExchangingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 flex justify-center items-center gap-3">
          <Gift className="text-amber-500 w-10 h-10" />
          Điểm Danh & Đổi Thưởng
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Chăm chỉ điểm danh mỗi ngày để tích điểm và đổi Hội viên miễn phí nhé!</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 max-w-2xl mx-auto text-center relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-amber-400 to-orange-400 opacity-10"></div>
        
        <div className="flex justify-around items-center mb-10 relative z-10">
          <div className="flex flex-col items-center">
            <div className="bg-amber-100 text-amber-600 p-4 rounded-full mb-3 shadow-inner">
              <Coins className="w-10 h-10" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Điểm của bạn</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{status.points}</p>
          </div>

          <div className="w-px h-24 bg-slate-200 dark:bg-slate-700"></div>

          <div className="flex flex-col items-center">
            <div className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 p-4 rounded-full mb-3 shadow-inner">
              <Flame className="w-10 h-10" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium">Chuỗi liên tục</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{status.streakCount} Ngày</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-700 text-left">
          <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <CalendarCheck className="text-blue-500" />
            Thể lệ Điểm danh
          </h4>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-4 list-disc pl-5">
            <li>Nhận ngay <strong className="text-amber-600 dark:text-amber-400">+{status.rewardPoints?.checkin || 10} Điểm</strong> mỗi ngày.</li>
            {status.streakMilestones && status.streakMilestones.length > 0 ? (
              [...status.streakMilestones].sort((a, b) => a.days - b.days).map((milestone) => (
                <li key={milestone.days}>
                  Đạt mốc {milestone.days} ngày liên tục: Thưởng thêm <strong className="text-amber-600 dark:text-amber-400">+{milestone.bonus} Điểm</strong>.
                </li>
              ))
            ) : (
              <>
                <li>Đạt mốc mỗi 7 ngày liên tiếp: Thưởng thêm <strong className="text-amber-600 dark:text-amber-400">+50 Điểm</strong>.</li>
                <li>Đạt mốc 30 ngày liên tiếp: Thưởng nóng <strong className="text-orange-600 dark:text-orange-400">+300 Điểm</strong>.</li>
              </>
            )}
            <li><span className="text-rose-500 dark:text-rose-400 font-semibold">Lưu ý:</span> Bỏ lỡ 1 ngày sẽ bị đứt chuỗi về 0.</li>
          </ul>
        </div>

        <button
          onClick={handleCheckin}
          disabled={status.hasCheckedInToday || checkingIn}
          className={`w-full py-4 rounded-2xl font-bold text-xl transition-all shadow-lg flex justify-center items-center gap-2
            ${status.hasCheckedInToday 
              ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none" 
              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 hover:shadow-orange-200"
            }`}
        >
          {checkingIn ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : status.hasCheckedInToday ? (
            <>
              <Check className="w-6 h-6" /> Đã điểm danh hôm nay
            </>
          ) : (
            "Điểm danh nhận quà"
          )}
        </button>

        {/* Cửa hàng Đổi Thưởng */}
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-left">
          <h4 className="font-bold text-slate-800 dark:text-white mb-4">Cửa Hàng Đổi Thưởng</h4>
          {status.rewardShop?.prizes && status.rewardShop.prizes.length > 0 ? (
            status.rewardShop.prizes.map((prize) => (
              <div key={prize.id} className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm mb-4">
                 <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">
                      {prize.name ? prize.name.replace(/Premium/g, "Hội viên") : "Gói Hội viên"}
                    </h3>
                    <p className="text-amber-700 dark:text-amber-500/80 text-sm">Đọc mọi sách bản quyền miễn phí.</p>
                 </div>
                 <button 
                   onClick={() => handleExchangePoints(prize.id)}
                   disabled={exchangingId !== null || status.points < prize.points}
                   className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2
                     ${status.points >= prize.points 
                       ? 'bg-amber-500 text-white hover:bg-amber-600 hover:scale-105' 
                       : 'bg-amber-200 dark:bg-amber-900/50 text-amber-600 dark:text-amber-600/50 cursor-not-allowed'}`}
                 >
                   {exchangingId === prize.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Coins className="w-5 h-5" />}
                   Dùng {prize.points} Điểm Đổi
                 </button>
              </div>
            ))
          ) : (
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
               <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Gói Hội viên 1 Tháng</h3>
                  <p className="text-amber-700 dark:text-amber-500/80 text-sm">Đọc mọi sách bản quyền miễn phí.</p>
               </div>
               <button 
                 onClick={() => handleExchangePoints("pkg_premium_1m")}
                 disabled={exchangingId !== null || status.points < 500}
                 className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2
                   ${status.points >= 500 
                     ? 'bg-amber-500 text-white hover:bg-amber-600 hover:scale-105' 
                     : 'bg-amber-200 dark:bg-amber-900/50 text-amber-600 dark:text-amber-600/50 cursor-not-allowed'}`}
               >
                 {exchangingId === "pkg_premium_1m" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Coins className="w-5 h-5" />}
                 Dùng 500 Điểm Đổi
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;
