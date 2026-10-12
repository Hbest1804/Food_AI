// src/api/tasteProfileApi.ts
// Các hàm gọi API cho Hồ sơ khẩu vị người dùng (mục 4.5 và mục 5.3.1)

import axiosClient from './axiosClient';
import { TasteProfileApiData, SaveTasteProfilePayload } from '../types';

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
 * 4.5.1 Xem hồ sơ khẩu vị
 * GET /api/me/taste-profile
 */
export async function apiGetTasteProfile(): Promise<ApiResponse<TasteProfileApiData>> {
  const res = await axiosClient.get<ApiResponse<TasteProfileApiData>>('/api/me/taste-profile');
  return res.data;
}

/**
 * 4.5.2 Lưu hồ sơ khẩu vị (ghi đè toàn bộ)
 * PUT /api/me/taste-profile
 */
export async function apiSaveTasteProfile(
  payload: SaveTasteProfilePayload
): Promise<ApiResponse<TasteProfileApiData>> {
  const res = await axiosClient.put<ApiResponse<TasteProfileApiData>>(
    '/api/me/taste-profile',
    payload
  );
  return res.data;
}

/**
 * 5.3.1 Cập nhật một phần hồ sơ khẩu vị
 * PATCH /api/me/taste-profile
 */
export async function apiPatchTasteProfile(
  payload: Partial<SaveTasteProfilePayload>
): Promise<ApiResponse<TasteProfileApiData>> {
  const res = await axiosClient.patch<ApiResponse<TasteProfileApiData>>(
    '/api/me/taste-profile',
    payload
  );
  return res.data;
}
