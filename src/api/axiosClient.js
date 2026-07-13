import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Gửi Access Token kèm theo mỗi request
axiosClient.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
// axiosClient.interceptors.response.use(
//   function (response) {
//     if (response && response.data) {
//       return response.data;
//     }
//     return response;
//   },
//   function (error) {
//     return Promise.reject(error);
//   }
// );

// Tự động làm mới khi Access Token hết hạn
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu Backend trả về 403
    if (error.response?.status === 403 && !originalRequest._retry) {
      // 1. Kiểm tra lỗi tài khoản bị khóa
      if (error.response.data?.message === "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("storage"));
        window.location.href = "/login?error=banned";
        return Promise.reject(error);
      }

      // 2. Nếu không phải lỗi khóa, thì là Token hết hạn -> Tiến hành gọi refresh
      originalRequest._retry = true;

      try {
        // Gọi API refresh token
        const res = await axios.post(
          `${axiosClient.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = res.data;
        localStorage.setItem("token", accessToken); // Lưu lại token 1h mới

        // Thực hiện lại yêu cầu bị lỗi ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Nếu cả Refresh Token 7 ngày cũng hết hạn
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("storage")); // Thông báo cho UI xóa tên "hungca"
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
