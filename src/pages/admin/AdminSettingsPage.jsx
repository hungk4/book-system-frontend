import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Save,
  Award,
  Flame,
  Gift,
  Crown,
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  Loader2,
  BookOpen,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);


  // States chứa cấu hình

  // Lưu trữ số điểm check-in và viết đánh giá.
  const [rewardPoints, setRewardPoints] = useState({
    checkin: 10,
    review: 30,
  });

  //  Mảng danh sách các mốc ngày streak và điểm thưởng.
  const [streakMilestones, setStreakMilestones] = useState([]); 

  // Danh sách các phần quà đổi điểm.
  const [rewardShop, setRewardShop] = useState({
    prizes: [],
  });

  // Danh sách các gói Premium
  const [premiumPackages, setPremiumPackages] = useState([]);

  // Quy định số ký tự tối thiểu/tối đa khi viết review.
  const [moderation, setModeration] = useState({
    review_min_length: 10,
    review_max_length: 500,
  });

  // Cấu hình thưởng đọc sách
  const [readingRewards, setReadingRewards] = useState({
    completion_points: 50,
    required_percent: 80,
    page_read_seconds: 60,
  });

  // State tạm thời cho việc thêm phần tử mới
  const [newStreak, setNewStreak] = useState({ days: "", bonus: "" });
  const [newPrize, setNewPrize] = useState({ name: "", points: "", days: "" });
  const [newPackage, setNewPackage] = useState({
    name: "",
    price: "",
    duration_months: "",
    description: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/settings");
      if (res.data.success) {
        const s = res.data.settings;
        if (s.reward_points) setRewardPoints(s.reward_points);
        if (s.streak_milestones) {
          // Sắp xếp mốc streak theo số ngày tăng dần
          setStreakMilestones(s.streak_milestones.sort((a, b) => a.days - b.days));
        }
        if (s.reward_shop) setRewardShop(s.reward_shop);
        if (s.premium_packages) setPremiumPackages(s.premium_packages);
        if (s.moderation) setModeration(s.moderation);
        if (s.reading_rewards) setReadingRewards(s.reading_rewards);
      }
    } catch (error) {
      console.error("Lỗi khi tải cấu hình:", error);
      toast.error("Không thể tải cấu hình hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    try {
      setUpdatingKey(key);
      const res = await axiosClient.put(`/settings/${key}`, { value });
      if (res.data.success) {
        toast.success("Cập nhật cấu hình thành công!");
      }
    } catch (error) {
      console.error(`Lỗi cập nhật cấu hình ${key}:`, error);
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setUpdatingKey(null);
    }
  };

  // 1. Quản lý Điểm Thưởng
  const handleRewardPointsChange = (e) => {
    setRewardPoints({
      ...rewardPoints,
      [e.target.name]: Number(e.target.value),
    });
  };

  // 2. Quản lý Mốc Streak
  const handleAddStreak = () => {
    if (!newStreak.days || !newStreak.bonus) {
      toast.warn("Vui lòng điền đầy đủ số ngày và điểm thưởng.");
      return;
    }
    const days = Number(newStreak.days);
    const bonus = Number(newStreak.bonus);

    if (streakMilestones.some((m) => m.days === days)) {
      toast.error("Mốc ngày streak này đã tồn tại.");
      return;
    }

    const updated = [...streakMilestones, { days, bonus }].sort(
      (a, b) => a.days - b.days
    );
    setStreakMilestones(updated);
    setNewStreak({ days: "", bonus: "" });
  };

  const handleDeleteStreak = (days) => {
    const updated = streakMilestones.filter((m) => m.days !== days);
    setStreakMilestones(updated);
  };

  // 3. Quản lý Đổi Quà (Reward Shop)
  const handleAddPrize = () => {
    if (!newPrize.name || !newPrize.points || !newPrize.days) {
      toast.warn("Vui lòng nhập đầy đủ thông tin phần quà.");
      return;
    }

    const prizeId = `pkg_${Date.now()}`;

    const updatedPrizes = [
      ...rewardShop.prizes,
      {
        id: prizeId,
        name: newPrize.name,
        points: Number(newPrize.points),
        days: Number(newPrize.days),
      },
    ];

    setRewardShop({
      ...rewardShop,
      prizes: updatedPrizes,
    });
    setNewPrize({ name: "", points: "", days: "" });
  };

  const handleDeletePrize = (id) => {
    const updatedPrizes = rewardShop.prizes.filter((p) => p.id !== id);
    setRewardShop({
      ...rewardShop,
      prizes: updatedPrizes,
    });
  };

  // 4. Quản lý Gói Hội viên
  const handleAddPackage = () => {
    if (
      !newPackage.name ||
      !newPackage.price ||
      !newPackage.duration_months
    ) {
      toast.warn("Vui lòng nhập đầy đủ thông tin gói.");
      return;
    }

    const packageId = `prem_${Date.now()}`;

    const updated = [
      ...premiumPackages,
      {
        id: packageId,
        name: newPackage.name,
        price: Number(newPackage.price),
        duration_months: Number(newPackage.duration_months),
        description: newPackage.description || "",
      },
    ];

    setPremiumPackages(updated);
    setNewPackage({ name: "", price: "", duration_months: "", description: "" });
  };

  const handleDeletePackage = (id) => {
    const updated = premiumPackages.filter((p) => p.id !== id);
    setPremiumPackages(updated);
  };

  // 5. Quản lý Moderation
  const handleModerationChange = (e) => {
    setModeration({
      ...moderation,
      [e.target.name]: Number(e.target.value),
    });
  };

  // 6. Quản lý thưởng đọc sách
  const handleReadingRewardsChange = (e) => {
    setReadingRewards({
      ...readingRewards,
      [e.target.name]: Number(e.target.value),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cấu hình hệ thống</h1>
        <p className="text-slate-500 text-sm">
          Thay đổi các cài đặt về Gamification, Streak, Điểm thưởng, Cửa hàng quà tặng và Gói Hội viên.
        </p>
      </div>

      {/* Nhóm 1: Các cấu hình thông số cơ bản (3 cột bằng nhau trên màn hình lớn) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. Cấu hình Điểm thưởng */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Award size={20} />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">
                Cấu hình Điểm thưởng
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Thiết lập số điểm mà người dùng nhận được khi thực hiện các hoạt động hàng ngày trên app.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 min-h-[32px] flex items-end">
                  Check-in hàng ngày
                </label>
                <input
                  type="number"
                  name="checkin"
                  value={rewardPoints.checkin}
                  onChange={handleRewardPointsChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 min-h-[32px] flex items-end">
                  Nhận xét đánh giá sách
                </label>
                <input
                  type="number"
                  name="review"
                  value={rewardPoints.review}
                  onChange={handleRewardPointsChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => handleSave("reward_points", rewardPoints)}
              disabled={updatingKey === "reward_points"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer disabled:opacity-50"
            >
              {updatingKey === "reward_points" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu Điểm thưởng
            </button>
          </div>
        </div>

        {/* 2. Cấu hình kiểm duyệt nhận xét */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">
                Cấu hình kiểm duyệt nhận xét
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Thiết lập quy định khi viết đánh giá cuốn sách nhằm nâng cao chất lượng nội dung của hệ thống.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 min-h-[32px] flex items-end">
                  Số ký tự tối thiểu
                </label>
                <input
                  type="number"
                  name="review_min_length"
                  value={moderation.review_min_length}
                  onChange={handleModerationChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 min-h-[32px] flex items-end">
                  Số ký tự tối đa
                </label>
                <input
                  type="number"
                  name="review_max_length"
                  value={moderation.review_max_length}
                  onChange={handleModerationChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => handleSave("moderation", moderation)}
              disabled={updatingKey === "moderation"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer disabled:opacity-50"
            >
              {updatingKey === "moderation" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu Kiểm duyệt
            </button>
          </div>
        </div>

        {/* Cấu hình thưởng đọc sách */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <BookOpen size={20} />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">
                Cấu hình thưởng đọc sách
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Thiết lập số điểm thưởng khi hoàn thành sách, tỷ lệ hoàn thành yêu cầu và thời gian tối thiểu của mỗi trang.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 min-h-[32px] flex items-end">
                  Điểm hoàn thành
                </label>
                <input
                  type="number"
                  name="completion_points"
                  value={readingRewards.completion_points}
                  onChange={handleReadingRewardsChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 min-h-[32px] flex items-end">
                  Tỷ lệ tối thiểu (%)
                </label>
                <input
                  type="number"
                  name="required_percent"
                  value={readingRewards.required_percent}
                  onChange={handleReadingRewardsChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 min-h-[32px] flex items-end">
                  Số giây/trang tối thiểu
                </label>
                <input
                  type="number"
                  name="page_read_seconds"
                  value={readingRewards.page_read_seconds}
                  onChange={handleReadingRewardsChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => handleSave("reading_rewards", readingRewards)}
              disabled={updatingKey === "reading_rewards"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer disabled:opacity-50"
            >
              {updatingKey === "reading_rewards" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu Thưởng đọc sách
            </button>
          </div>
        </div>
      </div>

      {/* Nhóm 2: Các cấu hình nâng cao dạng quản lý danh sách (Bố cục hàng dọc rộng rãi) */}
      <div className="grid grid-cols-1 gap-8">

        {/* 3. Cấu hình Streak */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Flame size={20} />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">
                Cấu hình mốc Streak điểm danh
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Thiết lập các mốc liên tục điểm danh hàng ngày và số điểm thưởng được tặng thêm khi đạt mốc đó.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Form thêm mốc */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 h-fit">
                <h4 className="font-bold text-slate-700 text-sm">Thêm mốc Streak mới</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Số ngày duy trì
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 5"
                    value={newStreak.days}
                    onChange={(e) => setNewStreak({ ...newStreak, days: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Điểm thưởng bonus
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 25"
                    value={newStreak.bonus}
                    onChange={(e) => setNewStreak({ ...newStreak, bonus: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleAddStreak}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <Plus size={14} /> Thêm mốc
                </button>
              </div>

              {/* Danh sách mốc hiện tại */}
              <div className="lg:col-span-2 border border-slate-100 rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Mốc Streak</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Điểm thưởng bonus</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {streakMilestones.length > 0 ? (
                      streakMilestones.map((m) => (
                        <tr key={m.days} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-700">{m.days} ngày liên tục</td>
                          <td className="px-4 py-3 font-bold text-orange-500">+{m.bonus} điểm</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteStreak(m.days)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">
                          Chưa cấu hình mốc streak nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => handleSave("streak_milestones", streakMilestones)}
              disabled={updatingKey === "streak_milestones"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer disabled:opacity-50"
            >
              {updatingKey === "streak_milestones" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu mốc Streak
            </button>
          </div>
        </div>

        {/* 4. Cấu hình đổi quà */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Gift size={20} />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">
                Cấu hình đổi quà
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Cài đặt các gói đổi điểm thưởng tích lũy lấy ngày sử dụng Hội viên của người đọc.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Form thêm phần quà */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 h-fit">
                <h4 className="font-bold text-slate-700 text-sm">Thêm phần quà mới</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tên phần quà
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 10 ngày Hội viên"
                    value={newPrize.name}
                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Số điểm yêu cầu
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 90"
                      value={newPrize.points}
                      onChange={(e) => setNewPrize({ ...newPrize, points: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Số ngày quy đổi
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 10"
                      value={newPrize.days}
                      onChange={(e) => setNewPrize({ ...newPrize, days: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddPrize}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <Plus size={14} /> Thêm quà
                </button>
              </div>

              {/* Danh sách phần quà hiện tại */}
              <div className="lg:col-span-2 space-y-4">

                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
                  <table className="w-full text-left text-sm border-collapse bg-white">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Tên phần quà</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Điểm quy đổi</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Số ngày hạn dùng</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rewardShop.prizes && rewardShop.prizes.length > 0 ? (
                        rewardShop.prizes.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              <div>{p.name}</div>
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{p.points} điểm</td>
                            <td className="px-4 py-3 font-semibold text-slate-500">+{p.days} ngày Hội viên</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeletePrize(p.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">
                            Chưa cấu hình phần quà nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => handleSave("reward_shop", rewardShop)}
              disabled={updatingKey === "reward_shop"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer disabled:opacity-50"
            >
              {updatingKey === "reward_shop" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu Đổi quà
            </button>
          </div>
        </div>

        {/* 5. Cấu hình Gói Hội viên */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Crown size={20} />
              </div>
              <h2 className="font-bold text-slate-800 text-lg">
                Cấu hình gói đăng ký Hội viên
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Thiết lập danh sách các gói dịch vụ mua bằng tiền mặt, giá tiền và quyền lợi tương ứng.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Form thêm gói */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 h-fit">
                <h4 className="font-bold text-slate-700 text-sm">Thêm gói Hội viên mới</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tên gói đăng ký
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Gói 6 Tháng"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Giá tiền (VNĐ)
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 200000"
                      value={newPackage.price}
                      onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Số tháng hạn dùng
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 6"
                      value={newPackage.duration_months}
                      onChange={(e) =>
                        setNewPackage({ ...newPackage, duration_months: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mô tả quyền lợi
                  </label>
                  <textarea
                    rows="2"
                    placeholder="VD: Truy cập toàn bộ kho sách 6 tháng, tiết kiệm 15%..."
                    value={newPackage.description}
                    onChange={(e) =>
                      setNewPackage({ ...newPackage, description: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleAddPackage}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <Plus size={14} /> Thêm gói
                </button>
              </div>

              {/* Danh sách gói đăng ký hiện tại */}
              <div className="lg:col-span-2 border border-slate-100 rounded-xl overflow-hidden bg-white max-h-[280px] overflow-y-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Tên gói đăng ký</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Giá bán (VNĐ)</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Thời gian</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {premiumPackages.length > 0 ? (
                      premiumPackages.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-700">{p.name}</div>
                            <div className="text-xs text-slate-500 italic mt-0.5 line-clamp-1 max-w-[250px]" title={p.description}>
                              {p.description || "Không có mô tả"}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-600">
                            {p.price.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-500">{p.duration_months} tháng</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeletePackage(p.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">
                          Chưa có gói đăng ký nào được cấu hình.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => handleSave("premium_packages", premiumPackages)}
              disabled={updatingKey === "premium_packages"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer disabled:opacity-50"
            >
              {updatingKey === "premium_packages" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu Gói Hội viên
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettingsPage;
