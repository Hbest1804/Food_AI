// src/api/axiosClient.ts
// Axios instance dùng chung cho toàn bộ frontend.
// Tất cả request tới backend đều đi qua file này.

import axios from 'axios';
import { apiRefreshToken, getStoredRefreshToken } from './authApi';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,          // 15 giây
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,    // gửi cookie / credentials khi cần
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Tự động gắn JWT token (nếu có) vào mọi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
axiosClient.interceptors.response.use(
  // Trả về data trực tiếp để không cần gọi response.data ở mỗi chỗ
  (response) => response,

  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh') {
      originalRequest._retry = true;
      try {
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          // Attempt to refresh token
          const { accessToken } = await apiRefreshToken();
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, fallback to logout
      }

      // Token hết hạn và không thể refresh → xóa token
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Reload nhẹ để reset state context về guest
      window.location.reload();
    }

    // Chuẩn hóa message lỗi
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      'Đã xảy ra lỗi không xác định';

    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
