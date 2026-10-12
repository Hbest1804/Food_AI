// src/api/chatApi.ts
// Các hàm gọi API cho Chatbot AI (mục 4.4 và mục 5.2.1)

import axiosClient from './axiosClient';
import { GuestChatResponse, GuestQuota } from '../types';

const GUEST_ID_KEY = 'culina_guest_id';

export function getStoredGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY);
}

export function saveGuestId(id: string): void {
  localStorage.setItem(GUEST_ID_KEY, id);
}

export interface SendGuestMessageParams {
  content: string;
  fridge?: {
    ingredient_ids?: number[];
    custom_ingredients?: string[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 5.2.1 Xem hạn mức lượt hỏi còn lại (khách)
 * GET /api/chat/guest/quota
 */
export async function apiGetGuestQuota(): Promise<ApiResponse<GuestQuota>> {
  const guestId = getStoredGuestId();
  const headers: Record<string, string> = {};
  if (guestId) {
    headers['X-Guest-Id'] = guestId;
  }

  const res = await axiosClient.get<ApiResponse<GuestQuota>>('/api/chat/guest/quota', {
    headers,
  });
  return res.data;
}

/**
 * 4.4.1 Gửi câu hỏi cho chatbot (khách)
 * POST /api/chat/guest/messages
 */
export async function apiSendGuestMessage(
  params: SendGuestMessageParams
): Promise<ApiResponse<GuestChatResponse>> {
  const guestId = getStoredGuestId();
  const headers: Record<string, string> = {};
  if (guestId) {
    headers['X-Guest-Id'] = guestId;
  }

  const res = await axiosClient.post<ApiResponse<GuestChatResponse>>(
    '/api/chat/guest/messages',
    params,
    { headers }
  );

  // Nếu server trả về guest_id mới hoặc đã có, lưu lại cho các lượt sau
  if (res.data?.data?.guest_id) {
    saveGuestId(res.data.data.guest_id);
  }

  return res.data;
}
