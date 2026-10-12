export type UserRole = 'user' | 'admin';

export type UserStatus = 'active' | 'blocked';

export type SpiceLevel = 'Không cay' | 'Cay nhẹ' | 'Cay vừa' | 'Rất cay';

export type Difficulty = 'Dễ' | 'Trung bình' | 'Khó';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

export interface CookingStep {
  stepNumber: number;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  dietTags: string[];
  mealType: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  spiceLevel: SpiceLevel;
  allergenWarnings: string[];
  servings: number;
  image: string;
  ingredients: Ingredient[];
  steps: CookingStep[];
  chefTips: string[];
  rating: number;
  ratingCount: number;
  isPublished: boolean;
  slug?: string;
  region?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  tags?: Array<{ id: number; name: string }>;
  estCost?: number | null;
  favoriteCount?: number;
  isFavorite?: boolean;
  match?: {
    matched_count: number;
    missing_count: number;
    ratio: number;
    missing_ingredients: string[];
  };
}

export interface Review {
  id: string;
  dishId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface TasteProfile {
  name: string;
  diet: string; // 'Bình thường' | 'Eat Clean' | 'Ăn chay' | 'Thuần chay' | 'Keto / Low-Carb' | 'Tăng cơ (High Protein)' | 'Tiểu đường / Ít đường'
  allergies: string[]; // ['Hải sản', 'Đậu phộng', 'Sữa bò / Lactose', 'Gluten', 'Trứng', 'Đậu nành']
  dislikes: string[]; // ['Hành lá', 'Rau mùi / ngò', 'Ớt cay', 'Mướp đắng', 'Măng chua', 'Nội tạng']
  spiceTolerance: SpiceLevel;
  targetCalories: number;
  healthGoal: string; // 'Giảm mỡ giữ cơ' | 'Ăn sạch sống khỏe' | 'Tăng cơ bắp' | 'Duy trì vóc dáng'
  favoriteCuisines: string[];
  waterTargetLiters: number;
  dailyMealsCount: number;
}

export interface MealHistoryItem {
  id: string;
  dishId: string;
  dishName: string;
  dishImage: string;
  date: string;
  mealType: string;
  calories: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone?: string;
  status: UserStatus;
  createdAt: string;
  tasteProfile: TasteProfile;
  favorites: string[]; // Dish IDs
  mealHistory: MealHistoryItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedDishes?: string[];
  dishes?: Array<{
    id: string;
    name: string;
    slug?: string;
    image_url?: string;
    description?: string;
    cook_time_minutes?: number;
    difficulty?: string;
  }>;
  replyType?: 'recipe' | 'general' | 'out_of_scope';
  outcome?: 'answered' | 'no_match' | 'out_of_scope' | 'fallback';
  tokens?: number | null;
  feedback?: 'like' | 'dislike' | 'helpful' | 'unhelpful' | null;
  feedback_reason?: string | null;
}

export interface GuestQuota {
  limit: number;
  used: number;
  remaining: number;
  resets_at: string;
}

export interface GuestChatResponse {
  guest_id: string;
  reply: {
    type: 'recipe' | 'general' | 'out_of_scope';
    content: string;
    dishes: Array<{
      id: string;
      name: string;
      slug?: string;
      image_url?: string;
      description?: string;
      cook_time_minutes?: number;
      difficulty?: string;
    }>;
  };
  quota: GuestQuota;
}

export interface TasteProfileApiData {
  preferred_region_id: number | null;
  taste_prefs: {
    spicy_level: number;
    salty_level: number;
    sweet_level: number;
    sour_level: number;
    liked_ingredient_ids: number[];
  };
  calorie_goal: number | null;
  budget_min: number | null;
  budget_max: number | null;
  household_size: number;
  diet_type_ids: number[];
  allergen_group_ids: number[];
  disliked_ingredient_ids: number[];
  preferred_region: { id: number; name: string } | null;
  diet_types: Array<{ id: number; name: string }>;
  allergen_groups: Array<{ id: number; name: string }>;
  disliked_ingredients: Array<{ id: number; name: string }>;
  completeness: number;
  updated_at: string | null;
}

export interface SaveTasteProfilePayload {
  preferred_region_id?: number | null;
  taste_prefs?: {
    spicy_level?: number;
    salty_level?: number;
    sweet_level?: number;
    sour_level?: number;
    liked_ingredient_ids?: number[];
  };
  calorie_goal?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  household_size?: number;
  diet_type_ids?: number[];
  allergen_group_ids?: number[];
  disliked_ingredient_ids?: number[];
}

export interface ChatLogRecord {
  id: string;
  userId: string;
  userName: string;
  isGuest: boolean;
  timestamp: string;
  query: string;
  reply: string;
  latencyMs: number;
  feedback: 'helpful' | 'unhelpful' | 'neutral';
  topic: 'Dinh dưỡng' | 'Tủ lạnh' | 'Nấu nhanh' | 'Dị ứng' | 'Công thức';
}

export interface SystemStats {
  totalUsers: number;
  totalDishes: number;
  totalChatbotQueries: number;
  totalReviews: number;
  averageSatisfactionRate: number;
  topCuisines: { name: string; count: number }[];
  dietaryDistribution: { diet: string; percentage: number }[];
}
