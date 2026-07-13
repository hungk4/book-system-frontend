import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axiosClient from "../api/axiosClient";

/**
 * AdminRoute: Bảo vệ tất cả route /admin
 * Gọi API backend để verify token + role, không tin localStorage.
 * - Đang kiểm tra: hiện loading
 * - Không phải admin / chưa đăng nhập: redirect về "/admin/login"
 * - Là admin: render children (Outlet)
 */
const AdminRoute = () => {
  const [status, setStatus] = useState("loading"); // "loading" | "authorized" | "unauthorized"

  useEffect(() => {
    axiosClient
      .get("/auth/verify-admin")
      .then(() => setStatus("authorized"))
      .catch(() => setStatus("unauthorized"));
  }, []);

  if (status === "loading") {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh",
        background: "#f8fafc", gap: "12px"
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #e2e8f0",
          borderTopColor: "#6366f1",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
          Đang xác thực quyền truy cập...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
