// frontend/src/api/dishesApi.ts
import axiosClient from './axiosClient';

export interface DishListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  region: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  cook_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number;
  avg_rating: number;
  rating_count: number;
  favorite_count: number;
  is_favorite: boolean;
  match?: {
    matched_count: number;
    missing_count: number;
    ratio: number;
    missing_ingredients: string[];
  };
}

export interface DishDetailItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  region: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  cook_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories: number;
  avg_rating: number;
  rating_count: number;
  favorite_count: number;
  is_favorite: boolean;
  servings: number;
  est_cost: number | null;
  nutrition: {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
  };
  ingredients: Array<{
    ingredient_id: number;
    name: string;
    quantity: number;
    unit: string;
    is_optional: boolean;
    allergen_group: { id: number; name: string } | null;
  }>;
  steps: Array<{
    order: number;
    content: string;
    duration_minutes?: number;
  }>;
  tags: Array<{
    id: number;
    name: string;
  }>;
  rating_summary: {
    average: number;
    count: number;
    distribution: Record<string, number>;
  };
  my_rating: {
    id: number;
    stars: number;
    comment: string;
  } | null;
  related_dishes: Array<{
    id: string;
    name: string;
    slug: string;
    image_url: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface GetDishesParams {
  q?: string;
  region_id?: number;
  category_id?: number;
  ingredient_ids?: string;
  ingredient_match?: 'any' | 'all';
  min_match_ratio?: number;
  exclude_ingredient_ids?: string;
  tag_ids?: string;
  max_cook_time?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  max_calories?: number;
  min_protein_g?: number;
  max_carbs_g?: number;
  max_fat_g?: number;
  sort?: 'relevance' | 'match' | 'newest' | 'rating' | 'popular' | 'cook_time' | 'calories';
  page?: number;
  limit?: number;
}

export interface GetDishesResponse {
  success: boolean;
  data: DishListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    suggestions: string[];
    suggest_ai: boolean;
  };
}

export interface GetDishDetailResponse {
  success: boolean;
  data: DishDetailItem;
}

export const dishesApi = {
  /**
   * 4.3.1 Tìm kiếm & lọc món ăn
   * GET /api/dishes
   */
  getDishes: async (params?: GetDishesParams): Promise<GetDishesResponse> => {
    const res = await axiosClient.get<GetDishesResponse>('/api/dishes', { params });
    return res.data;
  },

  /**
   * 4.3.2 Xem chi tiết món ăn & công thức
   * GET /api/dishes/:idOrSlug
   */
  getDishDetail: async (idOrSlug: string): Promise<GetDishDetailResponse> => {
    const res = await axiosClient.get<GetDishDetailResponse>(`/api/dishes/${idOrSlug}`);
    return res.data;
  },

  /**
   * Lấy danh sách món ăn phổ biến
   * GET /api/dishes/popular
   */
  getPopularDishes: async (params?: Omit<GetDishesParams, 'sort'>): Promise<GetDishesResponse> => {
    const res = await axiosClient.get<GetDishesResponse>('/api/dishes/popular', { params });
    return res.data;
  }
};
