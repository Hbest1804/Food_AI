// frontend/src/api/engagementApi.ts
import axiosClient from './axiosClient';

export interface FavoriteResponse {
  success: boolean;
  data: {
    dish_id: string;
    is_favorite: boolean;
    favorite_count: number;
  };
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution?: Record<string, number>;
}

export interface RatingReviewItem {
  id: number;
  stars: number;
  comment: string | null;
  user: {
    id: string | null;
    name: string;
    avatar?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface GetRatingsParams {
  sort?: 'newest' | 'highest' | 'lowest';
  has_comment?: boolean;
  page?: number;
  limit?: number;
}

export interface GetRatingsResponse {
  success: boolean;
  data: {
    summary: RatingSummary;
    items: RatingReviewItem[];
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CreateRatingPayload {
  stars: number;
  comment?: string;
}

export interface CreateRatingResponse {
  success: boolean;
  data: {
    rating: {
      id: number;
      dish_id: string;
      stars: number;
      comment: string | null;
      created_at: string;
    };
    rating_summary: {
      average: number;
      count: number;
    };
  };
}

export interface UpdateRatingPayload {
  stars?: number;
  comment?: string;
}

export interface UpdateRatingResponse {
  success: boolean;
  data: {
    id: number;
    stars: number;
    comment: string | null;
    updated_at: string;
  };
}

export const engagementApi = {
  /**
   * 4.8.1 Thêm vào yêu thích
   * PUT /api/dishes/:dishId/favorite
   */
  addFavorite: async (dishId: string): Promise<FavoriteResponse> => {
    const res = await axiosClient.put<FavoriteResponse>(`/api/dishes/${dishId}/favorite`);
    return res.data;
  },

  /**
   * 4.8.2 Bỏ yêu thích
   * DELETE /api/dishes/:dishId/favorite
   */
  removeFavorite: async (dishId: string): Promise<FavoriteResponse> => {
    const res = await axiosClient.delete<FavoriteResponse>(`/api/dishes/${dishId}/favorite`);
    return res.data;
  },

  /**
   * 4.8.3 Danh sách đánh giá & bình luận của món
   * GET /api/dishes/:dishId/ratings
   */
  getDishRatings: async (
    dishId: string,
    params?: GetRatingsParams
  ): Promise<GetRatingsResponse> => {
    const res = await axiosClient.get<GetRatingsResponse>(`/api/dishes/${dishId}/ratings`, {
      params,
    });
    return res.data;
  },

  /**
   * 4.8.4 Đánh giá & bình luận món
   * POST /api/dishes/:dishId/ratings
   */
  createDishRating: async (
    dishId: string,
    payload: CreateRatingPayload
  ): Promise<CreateRatingResponse> => {
    const res = await axiosClient.post<CreateRatingResponse>(
      `/api/dishes/${dishId}/ratings`,
      payload
    );
    return res.data;
  },

  /**
   * 4.8.5 Sửa đánh giá của mình
   * PATCH /api/ratings/:ratingId
   */
  updateRating: async (
    ratingId: number,
    payload: UpdateRatingPayload
  ): Promise<UpdateRatingResponse> => {
    const res = await axiosClient.patch<UpdateRatingResponse>(
      `/api/ratings/${ratingId}`,
      payload
    );
    return res.data;
  },

  /**
   * 4.8.6 Xóa đánh giá của mình
   * DELETE /api/ratings/:ratingId
   */
  deleteRating: async (ratingId: number): Promise<void> => {
    await axiosClient.delete(`/api/ratings/${ratingId}`);
  },
};
