import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  Mail,
  Lock,
  Loader,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Home,
  Eye,
  EyeOff,
} from "lucide-react";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosClient.post("/auth/login", formData);

      if (!response.data.token) throw new Error("Không nhận được token");

      const token = response.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(response.data.user || {}));

      // Verify quyền admin từ server (không tin localStorage)
      try {
        await axiosClient.get("/auth/verify-admin");
        navigate("/admin");
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setError("Tài khoản này không có quyền truy cập trang quản trị.");
      }
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      {/* Back to home */}
      <Link
        to="/"
        className="absolute top-6 left-6 p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
        title="Quay về trang chủ"
      >
        <Home size={20} />
      </Link>

      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <ShieldCheck size={28} className="text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Trang quản trị</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Đăng nhập với tài khoản quản trị viên
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                id="admin-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-colors outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-colors outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <>
                Đăng nhập <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Đây là trang dành riêng cho quản trị viên
            </span>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Nếu bạn là người dùng thông thường,{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
          >
            đăng nhập tại đây
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
