import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DishCard } from './DishCard';
import { BrowseHeroSection } from './BrowseHeroSection';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
  ChefHat,
  Filter,
  Check,
  Utensils,
  Leaf,
} from 'lucide-react';

export const BrowseView: React.FC = () => {
  const { dishes, currentUser, setIsFridgeModalOpen } = useApp();
  const searchFilterRef = useRef<HTMLDivElement>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('Tất cả');
  const [selectedDiet, setSelectedDiet] = useState('Tất cả');
  const [selectedMealType, setSelectedMealType] = useState('Tất cả');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Tất cả');
  const [selectedCalorieRange, setSelectedCalorieRange] = useState('Tất cả');
  const [selectedSpice, setSelectedSpice] = useState('Tất cả');
  const [sortBy, setSortBy] = useState<'rating' | 'fastest' | 'lowCalorie' | 'highProtein'>('rating');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Available options
  const cuisineList = ['Tất cả', 'Việt Nam', 'Âu / Eat Clean', 'Ăn Chay (Vegetarian)', 'Âu / Pháp', 'Ý / Địa Trung Hải'];
  const dietList = ['Tất cả', 'Eat Clean', 'Ăn chay', 'Thuần chay', 'Keto / Low-Carb', 'High Protein', 'Bình thường'];
  const mealTypeList = ['Tất cả', 'Sáng', 'Trưa', 'Tối', 'Bữa phụ / Snack'];
  const spiceList = ['Tất cả', 'Không cay', 'Cay nhẹ', 'Cay vừa', 'Rất cay'];

  // Scroll smoothly to search/filter section
  const handleScrollToExplore = () => {
    searchFilterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Filter & Sort Logic
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (!dish.isPublished) return false;

      // Text query match (name, description, ingredients)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description.toLowerCase().includes(q);
        const matchIng = dish.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchIng) return false;
      }

      // Cuisine match
      if (selectedCuisine !== 'Tất cả' && dish.cuisine !== selectedCuisine) {
        return false;
      }

      // Diet tag match
      if (selectedDiet !== 'Tất cả' && !dish.dietTags.includes(selectedDiet)) {
        return false;
      }

      // Meal type match
      if (selectedMealType !== 'Tất cả' && !dish.mealType.includes(selectedMealType)) {
        return false;
      }

      // Spice level match
      if (selectedSpice !== 'Tất cả' && dish.spiceLevel !== selectedSpice) {
        return false;
      }

      // Cook time range
      if (selectedTimeRange === '<15' && dish.cookTimeMinutes > 15) return false;
      if (selectedTimeRange === '15-30' && (dish.cookTimeMinutes <= 15 || dish.cookTimeMinutes > 30)) return false;
      if (selectedTimeRange === '>30' && dish.cookTimeMinutes <= 30) return false;

      // Calorie range
      if (selectedCalorieRange === '<300' && dish.calories >= 300) return false;
      if (selectedCalorieRange === '300-500' && (dish.calories < 300 || dish.calories > 500)) return false;
      if (selectedCalorieRange === '>500' && dish.calories <= 500) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'fastest') return a.cookTimeMinutes - b.cookTimeMinutes;
      if (sortBy === 'lowCalorie') return a.calories - b.calories;
      if (sortBy === 'highProtein') return b.protein - a.protein;
      return 0;
    });
  }, [
    dishes,
    searchQuery,
    selectedCuisine,
    selectedDiet,
    selectedMealType,
    selectedTimeRange,
    selectedCalorieRange,
    selectedSpice,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCuisine('Tất cả');
    setSelectedDiet('Tất cả');
    setSelectedMealType('Tất cả');
    setSelectedTimeRange('Tất cả');
    setSelectedCalorieRange('Tất cả');
    setSelectedSpice('Tất cả');
    setSortBy('rating');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCuisine !== 'Tất cả' ||
    selectedDiet !== 'Tất cả' ||
    selectedMealType !== 'Tất cả' ||
    selectedTimeRange !== 'Tất cả' ||
    selectedCalorieRange !== 'Tất cả' ||
    selectedSpice !== 'Tất cả';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in space-y-8">
      {/* 🌟 Serene Forest Jade Hero Section */}
      <BrowseHeroSection onExploreClick={handleScrollToExplore} />

      {/* Search & Filter Section */}
      <div ref={searchFilterRef} className="scroll-mt-20">
        {/* Search Header */}
        <div className="text-center max-w-3xl mx-auto pt-2 pb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold mb-3">
            <Leaf className="w-3.5 h-3.5 text-teal-600" />
            <span>Thư Viện Công Thức Thanh Sạch & Cân Đối Dinh Dưỡng</span>
          </div>

          <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">
            Tra Cứu & Lọc Món Ăn
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto font-normal">
            Tìm kiếm theo tên món, nguyên liệu có sẵn, hoặc chọn lọc theo thời gian nấu, mức calo và thể loại ẩm thực ưa thích.
          </p>

          {/* Serene Search Box with soft teal focus ring */}
          <div className="mt-6 relative max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-md shadow-slate-900/5 border border-slate-200 focus-within:border-teal-600 focus-within:ring-3 focus-within:ring-teal-500/20 transition-all duration-300">
              <Search className="w-5 h-5 text-teal-600 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món ăn (Phở bò, Cá hồi, Đậu hũ...) hoặc nguyên liệu (ức gà, nấm, trứng)..."
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-transparent border-0 focus:outline-hidden text-slate-900 font-medium placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl mr-1.5 transition-colors cursor-pointer font-medium"
                >
                  Xóa
                </button>
              )}
              <button
                onClick={() => setIsFridgeModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                title="Tìm món từ nguyên liệu có sẵn trong tủ lạnh"
              >
                <span>Tủ lạnh</span>
              </button>
            </div>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-600 flex-wrap">
            <span className="font-medium text-slate-400">Gợi ý nhanh:</span>
            {['Ức gà', 'Cá hồi Na Uy', 'Món chay', 'Dưới 400 kcal', 'Không cay'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (tag === 'Món chay') setSelectedDiet('Ăn chay');
                  else if (tag === 'Không cay') setSelectedSpice('Không cay');
                  else if (tag === 'Dưới 400 kcal') setSelectedCalorieRange('<300');
                  else setSearchQuery(tag);
                }}
                className="px-3 py-1 rounded-full bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-600 border border-slate-200 text-xs font-medium transition-all shadow-2xs cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Bar with Calm Sage / Teal styling */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          {/* Row 1: Cuisine Segmented Control */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Ẩm thực:
              </span>
              {cuisineList.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedCuisine === c
                      ? 'bg-teal-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="sm:hidden px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
              <span>Bộ lọc</span>
            </button>
          </div>

          {/* Row 2: Secondary Dropdowns */}
          <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 ${
            showFiltersMobile ? 'block' : 'hidden sm:grid'
          }`}>
            {/* Diet dropdown */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Chế độ ăn
              </label>
              <select
                value={selectedDiet}
                onChange={(e) => setSelectedDiet(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                {dietList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Meal type dropdown */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Bữa ăn
              </label>
              <select
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                {mealTypeList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Time range */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Thời gian nấu
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                <option value="Tất cả">Mọi thời gian</option>
                <option value="<15">Dưới 15 phút</option>
                <option value="15-30">15 - 30 phút</option>
                <option value=">30">Trên 30 phút</option>
              </select>
            </div>

            {/* Calorie range */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Mức Calo
              </label>
              <select
                value={selectedCalorieRange}
                onChange={(e) => setSelectedCalorieRange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                <option value="Tất cả">Mọi mức calo</option>
                <option value="<300">Dưới 300 kcal</option>
                <option value="300-500">300 - 500 kcal</option>
                <option value=">500">Trên 500 kcal</option>
              </select>
            </div>

            {/* Spice level */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Độ cay
              </label>
              <select
                value={selectedSpice}
                onChange={(e) => setSelectedSpice(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                {spiceList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count & Sort row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span>
                Tìm thấy <strong className="text-teal-800 text-sm font-bold">{filteredDishes.length}</strong> món ăn
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-teal-700 hover:text-teal-900 font-semibold underline flex items-center gap-1 ml-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                <option value="rating">Đánh giá cao nhất ★</option>
                <option value="fastest">Nấu nhanh nhất ⚡</option>
                <option value="lowCalorie">Ít calo nhất</option>
                <option value="highProtein">Giàu protein nhất</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredDishes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
            {dishes.length === 0 ? 'Chưa có món ăn nào trong hệ thống' : 'Không tìm thấy món ăn phù hợp'}
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            {dishes.length === 0
              ? 'Hệ thống đã dọn sạch toàn bộ dữ liệu mẫu và sẵn sàng kết nối trực tiếp với Cơ sở dữ liệu.'
              : 'Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc để khám phá toàn bộ danh mục ẩm thực.'}
          </p>
          {dishes.length > 0 && (
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
};
