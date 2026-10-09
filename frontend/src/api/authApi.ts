// src/api/authApi.ts
// Tất cả các hàm gọi API xác thực đều đi qua file này.
// Sử dụng axiosClient (đã gắn Bearer token tự động).

import axiosClient from './axiosClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  status?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  accessToken: string | null;
  refreshToken: string | null;
}

// ── API Functions ──────────────────────────────────────────────────────────────

/**
 * Đăng ký tài khoản mới.
 * Sau khi thành công, token được lưu vào localStorage tự động.
 */
export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await axiosClient.post<AuthResponse>('/api/auth/register', payload);
  const data = res.data;

  if (data.accessToken) {
    saveTokens(data.accessToken, data.refreshToken ?? '');
  }

  return data;
}

/**
 * Đăng nhập.
 * Sau khi thành công, token được lưu vào localStorage tự động.
 */
export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  const res = await axiosClient.post<AuthResponse>('/api/auth/login', payload);
  const data = res.data;

  if (data.accessToken) {
    saveTokens(data.accessToken, data.refreshToken ?? '');
  }

  return data;
}

/**
 * Đăng xuất.
 * Xóa token khỏi localStorage sau khi gọi API.
 */
export async function apiLogout(): Promise<void> {
  try {
    await axiosClient.post('/api/auth/logout');
  } finally {
    // Luôn xóa token dù server có lỗi
    clearTokens();
  }
}

/**
 * Lấy thông tin người dùng hiện tại từ server (cần token).
 */
export async function apiGetMe(): Promise<AuthUser> {
  const res = await axiosClient.get<{ user: AuthUser }>('/api/auth/me');
  return res.data.user;
}

/**
 * Làm mới access token bằng refresh token.
 */
export async function apiRefreshToken(): Promise<AuthTokens> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('Không có refresh token.');

  const res = await axiosClient.post<AuthTokens>('/api/auth/refresh', { refreshToken });
  const data = res.data;

  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

// ── Password Reset ─────────────────────────────────────────────────────────────

/**
 * Yêu cầu gửi email đặt lại mật khẩu.
 */
export async function apiRequestPasswordReset(email: string): Promise<{ success: boolean, data: { message: string } }> {
  const res = await axiosClient.post<{ success: boolean, data: { message: string } }>('/api/auth/forgot-password', { email });
  return res.data;
}

/**
 * Kiểm tra mã / token đặt lại mật khẩu.
 */
export async function apiVerifyPasswordReset(token: string): Promise<{ success: boolean, data: { valid: boolean, expires_at: string } }> {
  const res = await axiosClient.post<{ success: boolean, data: { valid: boolean, expires_at: string } }>('/api/auth/reset-password/verify', { token });
  return res.data;
}

/**
 * Đặt mật khẩu mới.
 */
export async function apiResetPassword(token: string, new_password: string, confirm_password: string): Promise<{ success: boolean, data: { message: string } }> {
  const res = await axiosClient.post<{ success: boolean, data: { message: string } }>('/api/auth/reset-password', { token, new_password, confirm_password });
  return res.data;
}

// ── Token helpers ──────────────────────────────────────────────────────────────

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function isTokenStored(): boolean {
  return !!localStorage.getItem('access_token');
}
