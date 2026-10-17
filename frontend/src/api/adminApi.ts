// src/api/adminApi.ts
// API calls cho khu vực quản trị (UC10–UC16)

import axiosClient from './axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminDish {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
  cook_time_minutes: number | null;
  difficulty: string | null;
  calories: number | null;
  servings: number;
  est_cost: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  category: { id: number; name: string } | null;
  region: { id: number; name: string } | null;
  tags?: Array<{ id: number; name: string }>;
  has_recipe: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: 'user' | 'admin';
  status: 'active' | 'locked';
  created_at: string;
  updated_at: string;
  stats?: {
    favorites: number;
    ratings: number;
    chat_sessions: number;
  };
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  dish_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminChatSession {
  id: string;
  title: string;
  user: { id: string; email: string; display_name: string } | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminChatSessionDetail extends AdminChatSession {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    outcome: string | null;
    latency_ms: number | null;
    feedback: string | null;
    feedback_reason: string | null;
    created_at: string;
  }>;
}

export interface AdminChatbotOverview {
  period_days: number;
  total_queries: number;
  avg_latency_ms: number;
  error_rate_percent: number;
  user_sessions: number;
  guest_sessions: number;
  liked: number;
  disliked: number;
}

export interface AdminChatbotConfig {
  guest_query_limit: number;
  system_prompt_override: string | null;
  ai_service_status: string;
}

export interface AdminStats {
  period_days: number;
  users: { total: number; new_in_period: number };
  dishes: { total_published: number };
  engagement: {
    ratings_in_period: number;
    favorites_in_period: number;
    chat_queries_in_period: number;
    avg_rating: number;
  };
  top_viewed_dishes: Array<{ dish_id: string; dish: { id: string; name: string; image_url: string | null } | null }>;
  top_favorited_dishes: Array<{ dish_id: string; favorite_count: number; dish: { id: string; name: string; image_url: string | null } | null }>;
}

export interface MyProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  favorites: Array<{
    dish_id: string;
    added_at: string;
    dish: { id: string; name: string; slug: string; image_url: string | null } | null;
  }>;
  chat_sessions: Array<{
    id: string;
    title: string;
    message_count: number;
    created_at: string;
    updated_at: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ─── UC10: Dữ liệu cá nhân ──────────────────────────────────────────────────

export const myProfileApi = {
  getProfile: async (): Promise<{ success: boolean; data: MyProfile }> => {
    const res = await axiosClient.get('/api/me/profile');
    return res.data;
  },

  updateProfile: async (display_name: string): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.put('/api/me/profile', { display_name });
    return res.data;
  },

  changePassword: async (current_password: string, new_password: string, confirm_password: string): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.patch('/api/me/password', { current_password, new_password, confirm_password });
    return res.data;
  },

  deleteAccount: async (password: string): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.delete('/api/me', { data: { password } });
    return res.data;
  },

  getFavorites: async (page = 1, limit = 20): Promise<PaginatedResponse<any>> => {
    const res = await axiosClient.get('/api/me/favorites', { params: { page, limit } });
    return res.data;
  },

  deleteChatHistory: async (): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.delete('/api/me/chat-history');
    return res.data;
  },

  uploadAvatar: async (file: File): Promise<{ success: boolean; data: { avatar_url: string } }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosClient.post('/api/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// ─── UC11: Quản lý món ăn (Admin) ─────────────────────────────────────────────

export const adminDishesApi = {
  getDishes: async (params?: {
    q?: string;
    category_id?: number;
    is_published?: boolean;
    has_recipe?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AdminDish>> => {
    const res = await axiosClient.get('/api/admin/dishes', { params });
    return res.data;
  },

  createDish: async (payload: {
    name: string;
    description?: string;
    category_id: number;
    region_id?: number;
    image_url?: string;
    cook_time_minutes?: number;
    difficulty?: string;
    servings: number;
    est_cost?: number;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    tag_ids?: number[];
  }): Promise<{ success: boolean; data: AdminDish }> => {
    const res = await axiosClient.post('/api/admin/dishes', payload);
    return res.data;
  },

  updateDish: async (dishId: string, payload: Partial<{
    name: string;
    description: string;
    category_id: number;
    region_id: number;
    image_url: string;
    cook_time_minutes: number;
    difficulty: string;
    servings: number;
    est_cost: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    tag_ids: number[];
  }>): Promise<{ success: boolean; data: AdminDish }> => {
    const res = await axiosClient.put(`/api/admin/dishes/${dishId}`, payload);
    return res.data;
  },

  togglePublish: async (dishId: string, is_published: boolean): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.patch(`/api/admin/dishes/${dishId}/publish`, { is_published });
    return res.data;
  },

  deleteDish: async (dishId: string, force = false): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.delete(`/api/admin/dishes/${dishId}`, { params: { force } });
    return res.data;
  },

  getRecipe: async (dishId: string): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.get(`/api/admin/dishes/${dishId}/recipe`);
    return res.data;
  },

  updateRecipe: async (dishId: string, payload: {
    ingredients: Array<{ ingredient_id?: number; name?: string; quantity?: number; unit?: string; is_optional?: boolean }>;
    steps: Array<{ order?: number; content: string; duration_minutes?: number }>;
  }): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.put(`/api/admin/dishes/${dishId}/recipe`, payload);
    return res.data;
  },

  deleteRecipe: async (dishId: string): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.delete(`/api/admin/dishes/${dishId}/recipe`);
    return res.data;
  },

  uploadImage: async (file: File): Promise<{ success: boolean; data: { url: string; size: number } }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosClient.post('/api/admin/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// ─── UC12: Quản lý người dùng (Admin) ─────────────────────────────────────────

export const adminUsersApi = {
  getUsers: async (params?: {
    q?: string;
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AdminUser>> => {
    const res = await axiosClient.get('/api/admin/users', { params });
    return res.data;
  },

  getUserDetail: async (userId: string): Promise<{ success: boolean; data: AdminUser }> => {
    const res = await axiosClient.get(`/api/admin/users/${userId}`);
    return res.data;
  },

  updateUser: async (userId: string, payload: { status?: string; role?: string }): Promise<{ success: boolean; data: AdminUser }> => {
    const res = await axiosClient.patch(`/api/admin/users/${userId}`, payload);
    return res.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.delete(`/api/admin/users/${userId}`);
    return res.data;
  },

  getAuditLogs: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> => {
    const res = await axiosClient.get('/api/admin/audit-logs', { params });
    return res.data;
  },
};

// ─── UC13: Giám sát chatbot (Admin) ──────────────────────────────────────────

export const adminChatbotApi = {
  getOverview: async (days = 30): Promise<{ success: boolean; data: AdminChatbotOverview }> => {
    const res = await axiosClient.get('/api/admin/chatbot/overview', { params: { days } });
    return res.data;
  },

  getSessions: async (params?: { q?: string; page?: number; limit?: number }): Promise<PaginatedResponse<AdminChatSession>> => {
    const res = await axiosClient.get('/api/admin/chatbot/sessions', { params });
    return res.data;
  },

  getSessionDetail: async (sessionId: string): Promise<{ success: boolean; data: AdminChatSessionDetail }> => {
    const res = await axiosClient.get(`/api/admin/chatbot/sessions/${sessionId}`);
    return res.data;
  },

  flagMessage: async (messageId: string, reason?: string, is_flagged = true): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.patch(`/api/admin/chatbot/messages/${messageId}/flag`, { reason, is_flagged });
    return res.data;
  },

  getConfig: async (): Promise<{ success: boolean; data: AdminChatbotConfig }> => {
    const res = await axiosClient.get('/api/admin/chatbot/config');
    return res.data;
  },

  updateConfig: async (payload: { guest_query_limit?: number; system_prompt_override?: string }): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.put('/api/admin/chatbot/config', payload);
    return res.data;
  },
};

// ─── UC14: Thống kê (Admin) ──────────────────────────────────────────────────

export const adminStatsApi = {
  getStats: async (days = 30): Promise<{ success: boolean; data: AdminStats }> => {
    const res = await axiosClient.get('/api/admin/stats', { params: { days } });
    return res.data;
  },
};

// ─── UC16: Quản lý danh mục (Admin) ──────────────────────────────────────────

export const adminCategoriesApi = {
  getCategories: async (params?: { q?: string; page?: number; limit?: number }): Promise<PaginatedResponse<AdminCategory>> => {
    const res = await axiosClient.get('/api/admin/categories', { params });
    return res.data;
  },

  createCategory: async (payload: {
    name: string;
    description?: string;
    image_url?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<{ success: boolean; data: AdminCategory }> => {
    const res = await axiosClient.post('/api/admin/categories', payload);
    return res.data;
  },

  updateCategory: async (categoryId: number, payload: Partial<{
    name: string;
    description: string;
    image_url: string;
    sort_order: number;
    is_active: boolean;
  }>): Promise<{ success: boolean; data: AdminCategory }> => {
    const res = await axiosClient.put(`/api/admin/categories/${categoryId}`, payload);
    return res.data;
  },

  deleteCategory: async (categoryId: number, migrate_to_category_id?: number): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.delete(`/api/admin/categories/${categoryId}`, {
      data: migrate_to_category_id ? { migrate_to_category_id } : undefined
    });
    return res.data;
  },
};

// ─── UC11 (Luồng 3b & 3c) / Section 4.11: Quản lý dữ liệu nền (Master Data) ───

export interface MasterResourceItem {
  id: number;
  name: string;
  code?: string;
  default_unit?: string;
  allergen_group_id?: number | null;
  allergen_group?: { id: number; name: string } | null;
  aliases?: string | null;
  needs_review?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type MasterResourceType = 'ingredients' | 'tags' | 'regions' | 'diet_types' | 'allergen_groups';

export const adminMasterApi = {
  list: async (
    resource: MasterResourceType,
    params?: { q?: string; needs_review?: boolean; allergen_group_id?: number; page?: number; limit?: number }
  ): Promise<PaginatedResponse<MasterResourceItem>> => {
    const res = await axiosClient.get(`/api/admin/master/${resource}`, { params });
    return res.data;
  },

  create: async (
    resource: MasterResourceType,
    payload: { name: string; code?: string; default_unit?: string; allergen_group_id?: number | null; aliases?: string }
  ): Promise<{ success: boolean; data: MasterResourceItem }> => {
    const res = await axiosClient.post(`/api/admin/master/${resource}`, payload);
    return res.data;
  },

  update: async (
    resource: MasterResourceType,
    id: number,
    payload: Partial<{ name: string; code?: string; default_unit?: string; allergen_group_id?: number | null; aliases?: string }>
  ): Promise<{ success: boolean; data: MasterResourceItem }> => {
    const res = await axiosClient.put(`/api/admin/master/${resource}/${id}`, payload);
    return res.data;
  },

  delete: async (
    resource: MasterResourceType,
    id: number
  ): Promise<{ success: boolean; data: any }> => {
    const res = await axiosClient.delete(`/api/admin/master/${resource}/${id}`);
    return res.data;
  },
};

