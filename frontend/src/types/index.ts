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
  feedback?: 'helpful' | 'unhelpful' | null;
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
