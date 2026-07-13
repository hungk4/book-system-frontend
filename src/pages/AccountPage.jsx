import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";
import { User, Key, Mail, Calendar, Shield, Award, Flame, CalendarCheck, Loader2 } from "lucide-react";

const AccountPage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State form update profile
  const [username, setUsername] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // State form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/auth/profile");
      if (res.data.success) {
        setUserData(res.data.user);
        setUsername(res.data.user.username);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tải thông tin tài khoản");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      return toast.warn("Tên người dùng không được để trống");
    }

    try {
      setUpdatingProfile(true);
      const res = await axiosClient.put("/auth/profile", { username });
      if (res.data.success) {
        toast.success("Cập nhật thông tin thành công");
        setUserData((prev) => ({ ...prev, username: res.data.user.username }));
        // Cập nhật lại trong localStorage
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.username = res.data.user.username;
        localStorage.setItem("user", JSON.stringify(storedUser));
        // Dispatch event để Header nhận biết
        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật tài khoản");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }

    try {
      setUpdatingPassword(true);
      const res = await axiosClient.put("/auth/profile", {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        toast.success("Đổi mật khẩu thành công");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const isGoogleAccount = userData?.google_id ? true : false;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  const isPremium = userData?.premium_expiry && new Date(userData.premium_expiry) > new Date();

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <User className="text-blue-500 w-8 h-8" />
          Quản Lý Tài Khoản
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Xem thông tin cá nhân và thay đổi thiết lập bảo mật của bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột 1: Thông tin tổng quan */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            {/* Avatar Mock */}
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center text-white font-black text-3xl shadow-lg mb-4">
              {userData?.username ? userData.username.charAt(0).toUpperCase() : "U"}
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{userData?.username}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{userData?.email}</p>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm
              ${isPremium 
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              <Shield size={12} />
              {isPremium ? "Hội viên Premium" : "Tài khoản thường"}
            </span>

            {isPremium && (
              <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-2 font-medium">
                Hạn dùng: {new Date(userData.premium_expiry).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>

          {/* Gamification Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
              <Award className="text-amber-500" size={18} />
              Thành tích đọc sách
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-900/30">
                <span className="text-xs text-amber-700 dark:text-amber-400 block font-medium">Điểm tích lũy</span>
                <span className="text-2xl font-black text-amber-800 dark:text-amber-300">{userData?.points || 0}</span>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 text-center border border-orange-100 dark:border-orange-900/30">
                <span className="text-xs text-orange-700 dark:text-orange-400 block font-medium">Chuỗi Streak</span>
                <span className="text-2xl font-black text-orange-800 dark:text-orange-300">{userData?.streak_count || 0} ngày</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <CalendarCheck size={14} className="text-green-500" />
                <span>Check-in gần nhất: {userData?.last_checkin_date ? new Date(userData.last_checkin_date).toLocaleDateString("vi-VN") : "Chưa từng check-in"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                <span>Ngày tham gia: {new Date(userData?.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột 2 & 3: Các Form chỉnh sửa */}
        <div className="lg:col-span-2 space-y-8">
          {/* Form Thông tin cá nhân */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <User className="text-blue-500" size={20} />
              Thông Tin Cá Nhân
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Địa chỉ Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={userData?.email || ""}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Không thể thay đổi email đăng nhập.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Tên người dùng</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Nhập tên người dùng..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02]"
                >
                  {updatingProfile && <Loader2 size={16} className="animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>

          {/* Form Đổi mật khẩu */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Key className="text-blue-500" size={20} />
              Đổi Mật Khẩu
            </h3>

            {isGoogleAccount && !userData?.has_password ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-xl p-4 text-sm">
                Tài khoản này được đăng ký thông qua **Google OAuth**. Bạn không cần sử dụng mật khẩu để đăng nhập.
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {userData?.has_password && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Key size={16} />
                      </span>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Nhập mật khẩu hiện tại..."
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    {userData?.has_password ? "Mật khẩu mới" : "Thiết lập mật khẩu mới"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Key size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Mật khẩu mới (tối thiểu 8 ký tự, có chữ và số)..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Key size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Xác nhận lại mật khẩu mới..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02]"
                  >
                    {updatingPassword && <Loader2 size={16} className="animate-spin" />}
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
