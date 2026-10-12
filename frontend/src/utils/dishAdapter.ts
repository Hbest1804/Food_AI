// frontend/src/utils/dishAdapter.ts
import { Dish, Difficulty, SpiceLevel } from '../types';
import { DishListItem, DishDetailItem } from '../api/dishesApi';

export function mapDifficulty(diff?: string): Difficulty {
  if (diff === 'easy' || diff === 'Dễ') return 'Dễ';
  if (diff === 'medium' || diff === 'Trung bình') return 'Trung bình';
  if (diff === 'hard' || diff === 'Khó') return 'Khó';
  return 'Dễ';
}

export function dishListItemToDish(item: DishListItem): Dish {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description || '',
    cuisine: item.region?.name || 'Việt Nam',
    dietTags: [],
    mealType: [item.category?.name || 'Món chính'],
    calories: Math.round(item.calories || 300),
    protein: 20,
    carbs: 30,
    fat: 10,
    fiber: 3,
    prepTimeMinutes: 10,
    cookTimeMinutes: item.cook_time_minutes || 20,
    difficulty: mapDifficulty(item.difficulty),
    spiceLevel: 'Không cay' as SpiceLevel,
    allergenWarnings: [],
    servings: 2,
    image: item.image_url || (item as any).image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    ingredients: [],
    steps: [],
    chefTips: [],
    rating: item.avg_rating || 5,
    ratingCount: item.rating_count || 0,
    isPublished: true,
    region: item.region,
    category: item.category,
    favoriteCount: item.favorite_count,
    isFavorite: item.is_favorite,
    match: item.match,
  };
}

export function dishDetailItemToDish(item: DishDetailItem): Dish {
  const isSpicy = (item.tags || []).some((t) => t.name.toLowerCase().includes('cay'));
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description || '',
    cuisine: item.region?.name || 'Việt Nam',
    dietTags: (item.tags || []).map((t) => t.name),
    mealType: [item.category?.name || 'Món chính'],
    calories: Math.round(item.calories || item.nutrition?.calories || 300),
    protein: Math.round(item.nutrition?.protein_g || 20),
    carbs: Math.round(item.nutrition?.carbs_g || 30),
    fat: Math.round(item.nutrition?.fat_g || 10),
    fiber: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: item.cook_time_minutes || 20,
    difficulty: mapDifficulty(item.difficulty),
    spiceLevel: (isSpicy ? 'Cay vừa' : 'Không cay') as SpiceLevel,
    allergenWarnings: (item.ingredients || [])
      .map((i) => i.allergen_group?.name)
      .filter((n): n is string => Boolean(n)),
    servings: item.servings || 2,
    image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    ingredients: (item.ingredients || []).map((i) => ({
      name: i.name,
      amount: i.quantity,
      unit: i.unit,
      category: i.is_optional ? 'Tùy chọn' : 'Chính',
    })),
    steps: (item.steps || []).map((s, idx) => ({
      stepNumber: s.order || idx + 1,
      instruction: s.content,
      durationMinutes: s.duration_minutes,
    })),
    chefTips: [],
    rating: item.avg_rating || item.rating_summary?.average || 5,
    ratingCount: item.rating_count || item.rating_summary?.count || 0,
    isPublished: true,
    region: item.region,
    category: item.category,
    tags: item.tags,
    estCost: item.est_cost,
    favoriteCount: item.favorite_count,
    isFavorite: item.is_favorite,
  };
}
