import axiosClient from './axiosClient';

export interface Ingredient {
  id: number;
  name: string;
  default_unit: string;
  is_common?: boolean;
  allergen_group?: {
    id: number;
    name?: string;
  } | null;
}

export interface IngredientsResponse {
  success: boolean;
  data: Ingredient[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface GetIngredientsParams {
  q?: string;
  is_common?: boolean;
  page?: number;
  limit?: number;
}

export const ingredientsApi = {
  getIngredients: (params?: GetIngredientsParams): Promise<IngredientsResponse> => {
    return axiosClient.get('/api/ingredients', { params });
  },
};
