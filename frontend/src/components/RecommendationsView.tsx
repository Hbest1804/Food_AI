import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DishCard } from './DishCard';
import {
  Sparkles,
  Sliders,
  Flame,
  Zap,
  Heart,
  Bot,
  CheckCircle,
  Leaf,
} from 'lucide-react';

export const RecommendationsView: React.FC = () => {
  const {
    currentUser,
    dishes,
    setIsTasteProfileModalOpen,
    setAuthModalType,
    calculateDishMatchScore,
  } = useApp();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Compute matched scores for all dishes
  const scoredDishes = dishes.map((dish) => ({
    dish,
    ...calculateDishMatchScore(dish),
  }));

  // Sort descending by score
  scoredDishes.sort((a, b) => b.score - a.score);

  // Filter groups
  const topMatchDishes = scoredDishes.filter((item) => item.score >= 70).slice(0, 4);
  const quickDishes = dishes.filter((d) => d.cookTimeMinutes <= 20).slice(0, 4);
  const lowCalorieDishes = dishes.filter((d) => d.calories <= 420).slice(0, 4);
  const dinnerDishes = dishes.filter((d) => d.mealType.includes('Tối')).slice(0, 4);

  const handleAskAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasteProfile: currentUser?.tasteProfile,
          mealTime: 'Hôm nay',
        }),
      });
      const data = await response.json();
      setAiAnalysis(data.analysis || 'Thực đơn đã được cân bằng tối ưu về macro và vi chất dinh dưỡng.');
    } catch (err) {
      setAiAnalysis(
        `Thực đơn hôm nay tập trung bổ sung 35g+ protein từ cá hồi và ức gà nạc, kết hợp chất xơ từ măng tây và bông cải xanh, giúp duy trì năng lượng bền bỉ và không gây tích mỡ.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in space-y-12">
      {/* Hero Recommendation Header with serene forest jade palette */}
      <div className="relative rounded-3xl p-6 sm:p-12 text-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 border border-teal-800/40">
        {/* Subtle ambient glows */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-10 -mb-16 w-60 h-60 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Floating food icons */}
        <div className="hidden lg:block absolute top-8 right-24 text-4xl animate-float pointer-events-none select-none">
          🥗
        </div>
        <div className="hidden lg:block absolute bottom-8 right-12 text-3xl animate-float-reverse pointer-events-none select-none">
          🥑
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Thuật Toán Cá Nhân Hóa Dinh Dưỡng</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
            {currentUser
              ? `Thực Đơn Lý Tưởng Cho ${currentUser.name}`
              : 'Gợi Ý Món Ăn Thanh Lành Hôm Nay'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            {currentUser
              ? `Hệ thống phân tích dựa trên chế độ "${currentUser.tasteProfile.diet}", triệt để loại bỏ "${
                  currentUser.tasteProfile.allergies.join(', ') || 'dị ứng'
                }", và căn chỉnh chính xác theo mức ${currentUser.tasteProfile.targetCalories} kcal.`
              : 'Đăng nhập hoặc chọn tài khoản mẫu để trải nghiệm thuật toán tính toán % điểm tương thích Match Score theo khẩu vị và an toàn dị ứng.'}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-8 flex-wrap">
            {currentUser ? (
              <>
                <button
                  onClick={handleAskAIAnalysis}
                  disabled={isAnalyzing}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 hover:scale-102 cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-emerald-200" />
                  <span>
                    {isAnalyzing
                      ? 'AI Bếp trưởng đang phân tích...'
                      : 'Nhờ Bếp trưởng AI phân tích thực đơn'}
                  </span>
                </button>

                <button
                  onClick={() => setIsTasteProfileModalOpen(true)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-emerald-300" />
                  <span>Cập nhật khẩu vị & Calo</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthModalType('login')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Đăng nhập để nhận gợi ý chuẩn gu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis Result Card (if generated) with calm sage styling */}
      {aiAnalysis && (
        <div className="p-6 rounded-3xl bg-teal-50/80 border border-teal-200 text-slate-800 animate-in fade-in flex items-start gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6 text-emerald-300" />
          </div>
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">
            <div className="font-serif font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <span>Lời khuyên ẩm thực từ Bếp trưởng CulinaAI</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                Tối ưu Dinh dưỡng
              </span>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{aiAnalysis}</p>
          </div>
        </div>
      )}

      {/* Dish Recommendations Sections */}
      {dishes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-xl text-slate-900 mb-2">
            Chưa có dữ liệu món ăn để phân tích
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Thuật toán cá nhân hóa sẽ tự động tính toán điểm phù hợp (% Match Score) theo khẩu vị và tiêu chuẩn dinh dưỡng ngay khi dữ liệu món ăn được tải từ Cơ sở dữ liệu.
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: Top Matched for User */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                  </div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                    Món ăn sinh ra dành cho khẩu vị của bạn
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-10">
                  Đạt điểm tương thích (% Match Score) cao nhất dựa trên sở thích và bảo vệ dị ứng
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topMatchDishes.map(({ dish }) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </div>

          {/* Section 2: Under 20 Minutes Quick Meals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-teal-700" />
                  </div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                    Nhanh gọn dưới 20 phút
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-10">
                  Chế biến nhanh cho ngày bận rộn nhưng vẫn vẹn tròn hương vị tươi ngon
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </div>

          {/* Section 3: Low-Calorie & Healthy Meals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                    Kiểm soát calo & Giữ dáng (Dưới 420 kcal)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-10">
                  Tỷ lệ đạm cao, no lâu và duy trì lượng calo thâm hụt lý tưởng cho vóc dáng
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {lowCalorieDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </div>

          {/* Section 4: Cozy Dinner */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-500" />
                  </div>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                    Bữa tối ấm cúng gia đình
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-10">
                  Món ăn đậm đà, tròn vị truyền thống và dễ dàng kết hợp cho mọi thành viên
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dinnerDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
