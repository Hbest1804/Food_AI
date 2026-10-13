// frontend/src/api/recommendationsApi.ts
import axiosClient from './axiosClient';
import { DishListItem } from './dishesApi';

export interface RecommendationDishItem extends DishListItem {}

export interface RecommendationItem {
  dish: RecommendationDishItem;
  score: number;
  reasons: string[];
}

export interface RecommendationMeta {
  strategy: 'personalized' | 'popular_fallback';
  profile_completeness: number;
  prompt_complete_profile: boolean;
  generated_at: string;
  cached?: boolean;
}

export interface GetRecommendationsParams {
  limit?: number;
  category_id?: number;
  region_id?: number;
  refresh?: boolean;
}

export interface GetRecommendationsResponse {
  success: boolean;
  data: RecommendationItem[];
  meta: RecommendationMeta;
}

export const recommendationsApi = {
  /**
   * 4.7.1 Nhận gợi ý món ăn (Cá nhân hóa cho User hoặc Gợi ý phổ biến cho Khách)
   * GET /api/me/recommendations (User) hoặc GET /api/dishes/recommendations (Khách)
   */
  getRecommendations: async (
    params?: GetRecommendationsParams
  ): Promise<GetRecommendationsResponse> => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const res = await axiosClient.get<GetRecommendationsResponse>('/api/me/recommendations', {
          params,
        });
        return res.data;
      } catch (err: any) {
        // Nếu token hết hạn hoặc lỗi xác thực, fallback mượt mà sang gợi ý công khai
        if (err?.error?.code === 'AUTH_REQUIRED' || err?.error?.code === 'INVALID_TOKEN' || err?.status === 401) {
          const fallbackRes = await axiosClient.get<GetRecommendationsResponse>('/api/dishes/recommendations', {
            params,
          });
          return fallbackRes.data;
        }
        throw err;
      }
    }

    // Khách vãng lai (Guest): lấy danh sách gợi ý thịnh hành
    const res = await axiosClient.get<GetRecommendationsResponse>('/api/dishes/recommendations', {
      params,
    });
    return res.data;
  },
};
