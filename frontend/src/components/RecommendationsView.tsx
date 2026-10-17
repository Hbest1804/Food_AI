// frontend/src/components/RecommendationsView.tsx
// Giao diện Gợi ý cá nhân hóa theo mục 4.7 (UC08) của tài liệu đặc tả API

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Heart,
  Clock,
  Leaf,
  Star,
  ChefHat,
  AlertCircle,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Flame,
  Award,
} from 'lucide-react';
import {
  recommendationsApi,
  RecommendationItem,
  RecommendationMeta,
} from '../api/recommendationsApi';
import { dishListItemToDish } from '../utils/dishAdapter';
import { metaApi, CategoryItem } from '../api/metaApi';

export const RecommendationsView: React.FC = () => {
  const {
    currentUser,
    dishes,
    calculateDishMatchScore,
    setIsTasteProfileModalOpen,
    setAuthModalType,
    openDishDetail,
    setCookingDish,
    toggleFavorite,
  } = useApp();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [meta, setMeta] = useState<RecommendationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  // Tải danh mục tra cứu
  useEffect(() => {
    metaApi.getCategories()
      .then((catRes) => {
        if (catRes.success) setCategories(catRes.data);
      })
      .catch((err) => console.warn('Lỗi tải danh mục meta:', err));
  }, []);

  // Tải danh sách gợi ý cá nhân hóa từ API (hỗ trợ cả người dùng đăng nhập lẫn khách vãng lai)
  const loadRecommendations = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        let items: RecommendationItem[] = [];
        let fetchedMeta: RecommendationMeta | null = null;

        try {
          const res = await recommendationsApi.getRecommendations({
            limit: 16,
            category_id: selectedCategoryId,
            refresh,
          });

          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            items = res.data;
            fetchedMeta = res.meta;
          }
        } catch (apiErr) {
          console.warn('Không thể gọi API gợi ý, kích hoạt dự phòng phía client:', apiErr);
        }

        // Nếu API chưa có dữ liệu hoặc lỗi mạng, dự phòng hiển thị từ kho dishes của AppContext
        if (items.length === 0 && dishes.length > 0) {
          let filtered = dishes.filter((d) => d.isPublished !== false);
          if (selectedCategoryId) {
            filtered = filtered.filter((d) => d.category?.id === selectedCategoryId);
          }

          items = filtered.slice(0, 16).map((d) => {
            const match = calculateDishMatchScore(d, currentUser?.tasteProfile);
            return {
              dish: {
                id: d.id,
                name: d.name,
                slug: d.slug || d.id,
                description: d.description || '',
                image_url: d.image,
                region: d.region ? { id: d.region.id, name: d.region.name } : null,
                category: d.category ? { id: d.category.id, name: d.category.name } : null,
                cook_time_minutes: d.cookTimeMinutes || 20,
                difficulty: d.difficulty === 'Khó' ? 'hard' : d.difficulty === 'Trung bình' ? 'medium' : 'easy',
                calories: d.calories || 300,
                avg_rating: d.rating || 5,
                rating_count: d.ratingCount || 0,
                favorite_count: d.favoriteCount || 0,
                is_favorite: Boolean(d.isFavorite),
              },
              score: match.score || 85,
              reasons: match.reasons?.length
                ? match.reasons
                : ['Món ăn thanh đạm cân bằng dinh dưỡng được yêu thích'],
            };
          });

          fetchedMeta = {
            strategy: currentUser ? 'personalized' : 'popular_fallback',
            profile_completeness: currentUser?.tasteProfile ? 65 : 0,
            prompt_complete_profile: !currentUser,
            generated_at: new Date().toISOString(),
          };
        }

        setRecommendations(items);
        setMeta(fetchedMeta);
      } catch (err: unknown) {
        console.error('Lỗi khi tải gợi ý cá nhân hóa:', err);
        setError('Đã xảy ra lỗi khi kết nối tới hệ thống gợi ý CulinaAI.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentUser, dishes, calculateDishMatchScore, selectedCategoryId]
  );

  useEffect(() => {
    loadRecommendations(false);
  }, [loadRecommendations]);

  const handleToggleFavorite = useCallback(
    (dishId: string) => {
      toggleFavorite(dishId);
      setRecommendations((prev) =>
        prev.map((item) => {
          if (item.dish.id === dishId) {
            const isCurrentlyFav = currentUser ? (currentUser.favorites?.includes(dishId) ?? false) : false;
            const nextFav = !isCurrentlyFav;
            return {
              ...item,
              dish: {
                ...item.dish,
                is_favorite: nextFav,
                favorite_count: Math.max(0, (item.dish.favorite_count || 0) + (nextFav ? 1 : -1)),
              },
            };
          }
          return item;
        })
      );
    },
    [currentUser, toggleFavorite]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in space-y-8">
      {/* Hero Recommendation Header */}
      <div className="relative rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 border border-teal-800/40">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-16 w-60 h-60 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/70 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gợi Ý Cá Nhân Hóa Dinh Dưỡng</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
            {currentUser
              ? `Thực Đơn Lý Tưởng Cho ${currentUser.name}`
              : 'Gợi Ý Món Ăn Thanh Lành Cho Bạn'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            {currentUser
              ? `Hệ thống phân tích hồ sơ khẩu vị, lọc sạch 100% nguyên liệu dị ứng & không thích, tối ưu hóa điểm tương thích theo mục tiêu ${
                  currentUser.tasteProfile?.targetCalories || 1800
                } kcal/ngày.`
              : 'Đăng nhập vào Culina để trải nghiệm thuật toán AI đề xuất món ăn chuẩn theo thể trạng, chế độ ăn kiêng và bảo vệ dị ứng nghiêm ngặt.'}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            {currentUser ? (
              <>
                <button
                  onClick={() => loadRecommendations(true)}
                  disabled={isRefreshing || isLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Đang tính toán lại...' : 'Làm mới gợi ý (Refresh)'}</span>
                </button>

                <button
                  onClick={() => setIsTasteProfileModalOpen(true)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-emerald-300" />
                  <span>Tùy chỉnh khẩu vị & Calo</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setAuthModalType('login')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
                <button
                  onClick={() => setAuthModalType('register')}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-2xl border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                >
                  Đăng ký tài khoản
                </button>
              </div>
            )}
          </div>

          {/* Ngữ cảnh cá nhân hóa đang áp dụng theo UC08 */}
          {currentUser && (
            <div className="mt-6 pt-5 border-t border-teal-800/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-teal-950/50 backdrop-blur-md p-2.5 rounded-xl border border-teal-700/30">
                <span className="text-[10px] text-teal-300 block uppercase font-semibold">Chế độ ăn</span>
                <span className="font-bold text-white text-xs truncate block">
                  {currentUser.tasteProfile?.diet || 'Bình thường'}
                </span>
              </div>
              <div className="bg-teal-950/50 backdrop-blur-md p-2.5 rounded-xl border border-teal-700/30">
                <span className="text-[10px] text-teal-300 block uppercase font-semibold">Mục tiêu Calo</span>
                <span className="font-bold text-emerald-300 text-xs">
                  {currentUser.tasteProfile?.targetCalories || 1800} kcal/ngày
                </span>
              </div>
              <div className="bg-teal-950/50 backdrop-blur-md p-2.5 rounded-xl border border-teal-700/30">
                <span className="text-[10px] text-teal-300 block uppercase font-semibold">Chiến lược</span>
                <span className="font-bold text-white text-xs">
                  {meta?.strategy === 'personalized' ? '🎯 Cá nhân hóa' : '🌟 Món phổ biến'}
                </span>
              </div>
              <div className="bg-teal-950/50 backdrop-blur-md p-2.5 rounded-xl border border-teal-700/30">
                <span className="text-[10px] text-teal-300 block uppercase font-semibold">Bảo vệ dị ứng</span>
                <span
                  className="font-bold text-emerald-300 text-xs truncate block"
                  title={currentUser.tasteProfile?.allergies?.join(', ') || 'Không có dị ứng'}
                >
                  {currentUser.tasteProfile?.allergies?.length
                    ? `🛡️ ${currentUser.tasteProfile.allergies.join(', ')}`
                    : '🛡️ Không có'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner nhắc nhở hoàn thiện hồ sơ khẩu vị theo Quy tắc 1 mục 4.7.1 */}
      {currentUser && (meta?.prompt_complete_profile || meta?.strategy === 'popular_fallback') && (
        <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-300/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>Bạn là thành viên mới hoặc chưa hoàn thiện hồ sơ khẩu vị</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  Hoàn thiện: {meta?.profile_completeness ?? 0}%
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Các món bên dưới đang được đề xuất theo chế độ món ăn phổ biến. Hãy hoàn thiện hồ sơ khẩu vị để CulinaAI tự động lọc sạch chất dị ứng và gợi ý chuẩn xác theo dinh dưỡng của bạn!
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTasteProfileModalOpen(true)}
            className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Hoàn thiện hồ sơ khẩu vị</span>
          </button>
        </div>
      )}

      {/* Bộ lọc nhanh Category */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-teal-700" />
          <span>Bộ lọc gợi ý:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category filter */}
          <select
            value={selectedCategoryId || ''}
            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium text-slate-700 cursor-pointer"
          >
            <option value="">Tất cả phân loại món</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedCategoryId && (
            <button
              onClick={() => {
                setSelectedCategoryId(undefined);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Banner dành cho khách vãng lai */}
      {!currentUser && (
        <div className="p-5 rounded-3xl bg-emerald-50/90 border border-emerald-300/80 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Gợi ý thịnh hành từ cộng đồng CulinaAI</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Chế độ Khách
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Bạn đang xem các món ăn được cộng đồng yêu thích và đánh giá cao nhất. Đăng nhập để CulinaAI tự động kích hoạt bộ lọc bảo vệ dị ứng và cá nhân hóa thực đơn 100% theo mục tiêu dinh dưỡng riêng của bạn!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAuthModalType('login')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={() => setAuthModalType('register')}
              className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Đăng ký
            </button>
          </div>
        </div>
      )}

      {/* Nội dung danh sách món */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 animate-pulse"
            >
              <div className="aspect-[16/10] bg-slate-200 rounded-2xl w-full" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-full" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="text-xs font-semibold">{error}</p>
          <button
            onClick={() => loadRecommendations(true)}
            className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">
            Không tìm thấy món phù hợp với bộ lọc
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Hãy thử chọn tất cả loại món để nhận thêm các đề xuất phong phú khác.
          </p>
          <button
            onClick={() => {
              setSelectedCategoryId(undefined);
            }}
            className="px-4 py-2 bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Xem tất cả gợi ý
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((item) => {
            const dish = dishListItemToDish(item.dish);
            const isFav = currentUser
              ? (currentUser.favorites?.includes(dish.id) ?? false)
              : (dish.isFavorite ?? false);

            return (
              <div
                key={dish.id}
                className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* Image container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/10 opacity-60" />

                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(dish.id);
                    }}
                    className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 cursor-pointer ${
                      isFav
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500 shadow-2xs'
                    }`}
                    title={isFav ? 'Bỏ lưu' : 'Lưu vào yêu thích'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* Score badge */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md bg-teal-900/90 text-emerald-200 border border-teal-400/30">
                    <Award className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{item.score}% Hợp gu</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Metadata line */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1.5 text-slate-500 flex-wrap">
                      <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {dish.cuisine}
                      </span>
                      <span>·</span>
                      <span>{dish.mealType[0] || 'Món chính'}</span>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => openDishDetail(dish.slug || dish.id)}
                      className="font-serif font-bold text-base text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-1 cursor-pointer leading-snug"
                    >
                      {dish.name}
                    </h3>

                    {/* Reasons pills (Lý do gợi ý theo đặc tả 4.7.1) */}
                    <div className="mt-2.5 space-y-1.5">
                      {item.reasons.map((reason, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-start gap-1.5 text-[11px] text-teal-900 bg-teal-50/80 px-2.5 py-1 rounded-xl border border-teal-100/90 font-medium leading-tight"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nutrition & Action buttons */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                      <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                        <Leaf className="w-3 h-3 text-teal-600" />
                        <span>{dish.calories} kcal</span>
                      </div>

                      <div className="flex items-center gap-1 font-medium text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{dish.cookTimeMinutes} phút</span>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{dish.rating}</span>
                        <span className="text-slate-400 text-[10px] font-normal">
                          ({dish.ratingCount})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openDishDetail(dish.slug || dish.id)}
                        className="w-full py-2 px-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-center cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => setCookingDish(dish)}
                        className="w-full py-2 px-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-all flex items-center justify-center gap-1 text-center cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Nấu ngay</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
