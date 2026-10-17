import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Leaf,
  Loader2,
  Tag,
  Lightbulb,
} from 'lucide-react';
import { dishesApi, DishListItem } from '../api/dishesApi';
import { metaApi, MetaCategory } from '../api/metaApi';
import { dishListItemToDish } from '../utils/dishAdapter';
import { Dish } from '../types';

export const BrowseView: React.FC = () => {
  const { currentUser, setIsFridgeModalOpen } = useApp();
  const searchFilterRef = useRef<HTMLDivElement>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '<15' | '15-30' | '>30'>('all');
  const [selectedCalorieRange, setSelectedCalorieRange] = useState<'all' | '<300' | '300-500' | '>500'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'popular' | 'cook_time' | 'calories' | 'newest' | 'relevance'>('rating');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Dữ liệu bộ lọc động từ API /meta/filters
  const [categories, setCategories] = useState<MetaCategory[]>([]);

  // Dữ liệu món ăn từ API /dishes
  const [dishesList, setDishesList] = useState<Dish[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tải danh mục bộ lọc từ API backend
  useEffect(() => {
    metaApi
      .getFilters()
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data.categories || []);
        }
      })
      .catch((err) => {
        console.warn('Không thể tải bộ lọc danh mục từ API:', err);
      });
  }, []);

  // Debounce từ khóa tìm kiếm (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Cuộn mượt tới khung tìm kiếm & lọc
  const handleScrollToExplore = () => {
    searchFilterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Gọi API GET /dishes theo các tiêu chí lọc
  const fetchDishes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        limit: 50,
        sort: sortBy,
      };

      if (debouncedQuery) {
        params.q = debouncedQuery;
      }
      if (selectedCategoryId !== 'all') {
        params.category_id = selectedCategoryId;
      }
      if (selectedDifficulty !== 'all') {
        params.difficulty = selectedDifficulty;
      }

      // Thời gian nấu
      if (selectedTimeRange === '<15') {
        params.max_cook_time = 15;
      } else if (selectedTimeRange === '15-30') {
        params.max_cook_time = 30;
      }

      // Mức calo
      if (selectedCalorieRange === '<300') {
        params.max_calories = 300;
      } else if (selectedCalorieRange === '300-500') {
        params.max_calories = 500;
      }

      const res = await dishesApi.getDishes(params);
      if (res.success && Array.isArray(res.data)) {
        let items = res.data.map(dishListItemToDish);

        // Lọc cận dưới nếu thời gian nấu >30 hoặc calo >500
        if (selectedTimeRange === '>30') {
          items = items.filter((d) => d.cookTimeMinutes > 30);
        } else if (selectedTimeRange === '15-30') {
          items = items.filter((d) => d.cookTimeMinutes >= 15);
        }

        if (selectedCalorieRange === '>500') {
          items = items.filter((d) => d.calories > 500);
        } else if (selectedCalorieRange === '300-500') {
          items = items.filter((d) => d.calories >= 300);
        }

        setDishesList(items);
        setTotalCount(res.meta?.total ?? items.length);
        setSuggestions(res.meta?.suggestions || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách món ăn từ API:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedQuery,
    selectedCategoryId,
    selectedDifficulty,
    selectedTimeRange,
    selectedCalorieRange,
    sortBy,
  ]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategoryId('all');
    setSelectedDifficulty('all');
    setSelectedTimeRange('all');
    setSelectedCalorieRange('all');
    setSortBy('rating');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategoryId !== 'all' ||
    selectedDifficulty !== 'all' ||
    selectedTimeRange !== 'all' ||
    selectedCalorieRange !== 'all';

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
            Tìm kiếm theo tên món, nguyên liệu có sẵn, hoặc chọn lọc theo vùng miền, thời gian nấu, mức calo và thể loại ẩm thực ưa thích.
          </p>

          {/* Search Box */}
          <div className="mt-6 relative max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-md shadow-slate-900/5 border border-slate-200 focus-within:border-teal-600 focus-within:ring-3 focus-within:ring-teal-500/20 transition-all duration-300">
              <Search className="w-5 h-5 text-teal-600 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món ăn (Phở bò, Cá hồi, Đậu hũ...) hoặc nguyên liệu (thịt bò, nấm, trứng)..."
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
                title="Tìm món theo nguyên liệu có sẵn"
              >
                <ChefHat className="w-4 h-4 text-emerald-300" />
                <span>Nguyên liệu có sẵn</span>
              </button>
            </div>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-600 flex-wrap">
            <span className="font-medium text-slate-400">Từ khóa phổ biến:</span>
            {['Phở bò', 'Cá hồi', 'Thịt bò', 'Canh cà chua', 'Nấm hương'].map((kw) => (
              <button
                key={kw}
                onClick={() => setSearchQuery(kw)}
                className="px-3 py-1 rounded-full bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-600 border border-slate-200 text-xs font-medium transition-all shadow-2xs cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between sm:hidden">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bộ lọc tìm kiếm</span>
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
              <span>{showFiltersMobile ? 'Thu gọn' : 'Mở rộng bộ lọc'}</span>
            </button>
          </div>

          {/* Secondary Dropdowns */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${
              showFiltersMobile ? 'block' : 'hidden sm:grid'
            }`}
          >
            {/* Loại món (Category) dropdown */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Loại món
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) =>
                  setSelectedCategoryId(
                    e.target.value === 'all' ? 'all' : Number(e.target.value)
                  )
                }
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                <option value="all">Tất cả loại món</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Thời gian nấu */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Thời gian nấu
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                <option value="all">Mọi thời gian</option>
                <option value="<15">Dưới 15 phút</option>
                <option value="15-30">15 - 30 phút</option>
                <option value=">30">Trên 30 phút</option>
              </select>
            </div>

            {/* Độ khó (Difficulty) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Độ khó
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                <option value="all">Tất cả độ khó</option>
                <option value="easy">Dễ làm</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Kỳ công</option>
              </select>
            </div>

            {/* Mức Calo */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Mức Calo
              </label>
              <select
                value={selectedCalorieRange}
                onChange={(e) => setSelectedCalorieRange(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-hidden"
              >
                <option value="all">Mọi mức calo</option>
                <option value="<300">Dưới 300 kcal</option>
                <option value="300-500">300 - 500 kcal</option>
                <option value=">500">Trên 500 kcal</option>
              </select>
            </div>
          </div>

          {/* Results count & Sort row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              {isLoading ? (
                <div className="flex items-center gap-1.5 text-teal-800 font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang truy vấn món ăn...</span>
                </div>
              ) : (
                <span>
                  Tìm thấy <strong className="text-teal-800 text-sm font-bold">{dishesList.length}</strong> món ăn
                </span>
              )}
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
                <option value="popular">Phổ biến nhất</option>
                <option value="cook_time">Nấu nhanh nhất ⚡</option>
                <option value="calories">Ít calo nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="relevance">Độ liên quan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dishes Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
          <p className="text-xs font-medium">Đang tìm kiếm món ăn từ hệ thống dữ liệu...</p>
        </div>
      ) : dishesList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dishesList.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
            Không tìm thấy món ăn phù hợp
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn lọc với tiêu chí rộng hơn để khám phá thực đơn.
          </p>

          {/* Suggestions mở rộng tìm kiếm theo UC02 luồng 2a */}
          {suggestions.length > 0 && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl mb-5 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Gợi ý mở rộng tìm kiếm từ hệ thống:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(sug)}
                    className="px-3 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    🔍 {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
            <button
              onClick={() => setIsFridgeModalOpen(true)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Mở Nguyên liệu có sẵn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
