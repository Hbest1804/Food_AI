// src/api/chatApi.ts
// Các hàm gọi API cho Chatbot AI (mục 4.4 khách và mục 4.6 cá nhân hóa UC07)

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
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ── Types cho Mục 4.6 Chatbot cá nhân hóa ──────────────────────────────────────
export interface ChatSessionItem {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  referenced_dishes?: Array<{
    id: string;
    name: string;
    slug?: string;
    image_url?: string;
    description?: string;
    cook_time_minutes?: number;
    difficulty?: string;
  }>;
  feedback?: 'like' | 'dislike' | null;
  feedback_reason?: string | null;
  outcome?: 'answered' | 'no_match' | 'out_of_scope' | 'fallback';
  tokens?: number | null;
  created_at: string;
}

export interface ChatSessionDetail {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: ChatSessionMessage[];
}

export interface SendMessageResponseData {
  user_message: {
    id: string;
    role: 'user';
    content: string;
    created_at: string;
  };
  assistant_message: {
    id: string;
    role: 'assistant';
    content: string;
    referenced_dishes?: Array<{
      id: string;
      name: string;
      slug?: string;
      image_url?: string;
      description?: string;
      cook_time_minutes?: number;
      difficulty?: string;
    }>;
    outcome?: 'answered' | 'no_match' | 'out_of_scope' | 'fallback';
    tokens?: number | null;
    created_at: string;
  };
}

// ── 4.4 & 5.2.1 CHATBOT KHÁCH ──────────────────────────────────────────────────
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

  if (res.data?.data?.guest_id) {
    saveGuestId(res.data.data.guest_id);
  }

  return res.data;
}

// ── 4.6 CHATBOT CÁ NHÂN HÓA (UC07) ───────────────────────────────────────────
/**
 * 4.6.1 Tạo hội thoại mới
 * POST /api/chat/sessions
 */
export async function apiCreateChatSession(title?: string): Promise<ApiResponse<ChatSessionItem>> {
  const body = title ? { title } : {};
  const res = await axiosClient.post<ApiResponse<ChatSessionItem>>('/api/chat/sessions', body);
  return res.data;
}

/**
 * 4.6.2 Danh sách hội thoại
 * GET /api/chat/sessions
 */
export async function apiGetChatSessions(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<ChatSessionItem[]>> {
  const res = await axiosClient.get<ApiResponse<ChatSessionItem[]>>('/api/chat/sessions', {
    params: { page, limit },
  });
  return res.data;
}

/**
 * 4.6.3 Mở lại hội thoại cũ
 * GET /api/chat/sessions/:sessionId
 */
export async function apiGetChatSessionById(
  sessionId: string,
  page: number = 1,
  limit: number = 50
): Promise<ApiResponse<ChatSessionDetail>> {
  const res = await axiosClient.get<ApiResponse<ChatSessionDetail>>(`/api/chat/sessions/${sessionId}`, {
    params: { page, limit },
  });
  return res.data;
}

/**
 * 4.6.4 Gửi câu hỏi cho chatbot (cá nhân hóa)
 * POST /api/chat/sessions/:sessionId/messages
 */
export async function apiSendChatMessage(
  sessionId: string,
  params: SendGuestMessageParams
): Promise<ApiResponse<SendMessageResponseData>> {
  const res = await axiosClient.post<ApiResponse<SendMessageResponseData>>(
    `/api/chat/sessions/${sessionId}/messages`,
    params
  );
  return res.data;
}

/**
 * 4.6.5 Xóa một hội thoại
 * DELETE /api/chat/sessions/:sessionId
 */
export async function apiDeleteChatSession(sessionId: string): Promise<void> {
  await axiosClient.delete(`/api/chat/sessions/${sessionId}`);
}

/**
 * 4.6.6 Đánh giá câu trả lời của chatbot
 * POST /api/chat/messages/:messageId/feedback
 */
export async function apiSendChatMessageFeedback(
  messageId: string,
  feedback: 'like' | 'dislike',
  reason?: string
): Promise<ApiResponse<{ id: string; feedback: 'like' | 'dislike'; feedback_reason?: string | null }>> {
  const body: { feedback: string; reason?: string } = { feedback };
  if (reason && reason.trim()) {
    body.reason = reason.trim();
  }
  const res = await axiosClient.post<
    ApiResponse<{ id: string; feedback: 'like' | 'dislike'; feedback_reason?: string | null }>
  >(`/api/chat/messages/${messageId}/feedback`, body);
  return res.data;
}

/**
 * API Bổ sung: Đổi tiêu đề hội thoại
 * PATCH /api/chat/sessions/:sessionId
 */
export async function apiUpdateChatSessionTitle(
  sessionId: string,
  title: string
): Promise<ApiResponse<ChatSessionItem>> {
  const res = await axiosClient.patch<ApiResponse<ChatSessionItem>>(
    `/api/chat/sessions/${sessionId}`,
    { title }
  );
  return res.data;
}
