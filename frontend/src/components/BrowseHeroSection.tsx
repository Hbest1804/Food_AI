import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ChefHat,
  Refrigerator,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Flame,
  Clock,
  Star,
  CheckCircle2,
  Leaf,
} from 'lucide-react';

interface BrowseHeroSectionProps {
  onExploreClick?: () => void;
}

export const BrowseHeroSection: React.FC<BrowseHeroSectionProps> = ({ onExploreClick }) => {
  const {
    currentUser,
    dishes,
    setActiveDishModal,
    setAuthModalType,
    setIsTasteProfileModalOpen,
    setIsFridgeModalOpen,
    setActiveTab,
  } = useApp();

  const featuredDish = dishes.length > 0 ? dishes[0] : null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white p-6 sm:p-10 lg:p-12 shadow-xl mb-10 border border-teal-800/40">
      {/* Serene ambient glow orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

      <div className="hidden xl:block absolute top-8 right-8 animate-float-reverse pointer-events-none select-none" style={{ animationDelay: '0.8s' }}>
        <div className="bg-white/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/80 flex items-center gap-3 text-xs text-slate-900">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg shadow-2xs">
            {featuredDish ? '🍲' : '🌿'}
          </div>
          <div>
            <div className="font-bold text-slate-900">
              {featuredDish ? featuredDish.name : 'Dinh Dưỡng Thông Minh'}
            </div>
            <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
              {featuredDish ? (
                <>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> {featuredDish.rating} ★ ({featuredDish.ratingCount} đánh giá)
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Sẵn sàng kết nối CSDL
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden xl:block absolute bottom-10 right-10 animate-float pointer-events-none select-none" style={{ animationDelay: '2s' }}>
        <div className="bg-white/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/80 flex items-center gap-3 text-xs text-slate-900">
          <div className="w-9 h-9 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-sm">
            <ChefHat className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="font-bold text-slate-900">AI Bếp Trưởng Gemini</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Tư vấn dinh dưỡng 24/7</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Welcome Copy & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Welcome Badge with Calm Emerald Tone */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-900/60 backdrop-blur-md border border-teal-500/30 text-[12px] font-semibold text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {currentUser
                ? `Chào mừng bạn trở lại, ${currentUser.name}! 👨‍🍳`
                : 'Trợ Lý Ẩm Thực Thông Minh & Cá Nhân Hóa Dinh Dưỡng'}
            </span>
          </div>

          {/* Heading with Poised Typography */}
          <h1 className="font-bold text-[30px] sm:text-[48px] lg:text-[60px] text-white tracking-tight leading-[1.15]">
            Nâng Tầm Bữa Cơm,{' '}
            <span className="text-emerald-300 font-normal italic">
              Thanh Nhã & An Lành
            </span>{' '}
            Theo Khẩu Vị Riêng
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
            CulinaAI đồng hành cùng bạn tìm kiếm cảm hứng nấu nướng thanh sạch, cân đối calo theo thể trạng, bảo vệ an toàn dị ứng tuyệt đối và khéo léo kết hợp nguyên liệu có sẵn trong gia đình.
          </p>

          {/* Action Button Row */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={onExploreClick}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/40 hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Khám phá công thức ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ChefHat className="w-4 h-4 text-emerald-300" />
              <span>Hỏi AI Bếp Trưởng</span>
            </button>

            <button
              onClick={() => setIsFridgeModalOpen(true)}
              className="px-5 py-3.5 rounded-2xl bg-teal-900/60 hover:bg-teal-900/80 text-emerald-200 font-semibold text-xs sm:text-sm border border-teal-500/30 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Refrigerator className="w-4 h-4 text-emerald-400" />
              <span>Tủ lạnh thông minh</span>
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-teal-800/40">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-teal-800 text-emerald-300 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">100% An Toàn</div>
                <div className="text-[11px] text-slate-300">Lọc sạch chất dị ứng</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-teal-800 text-emerald-300 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Chuẩn Calo</div>
                <div className="text-[11px] text-slate-300">Cân đối macro dinh dưỡng</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-teal-800 text-emerald-300 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Bộ Hẹn Giờ</div>
                <div className="text-[11px] text-slate-300">Nấu ăn từng bước</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-teal-800 text-emerald-300 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Chống Lãng Phí</div>
                <div className="text-[11px] text-slate-300">Tận dụng đồ tủ lạnh</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Showcase Feature Card */}
        <div className="lg:col-span-5 relative flex justify-center">
          {featuredDish ? (
            <div
              onClick={() => setActiveDishModal(featuredDish)}
              className="relative w-full max-w-sm rounded-3xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200 animate-float cursor-pointer hover:scale-[1.01] transition-transform"
              style={{ animationDuration: '7s' }}
            >
              {/* Image Preview with badge */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-100 shadow-sm">
                <img
                  src={featuredDish.image}
                  alt={featuredDish.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Món Đề Xuất Hôm Nay</span>
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-teal-800 text-white text-[11px] font-bold shadow-md">
                  ★ {featuredDish.rating}
                </div>
              </div>

              {/* Card Content Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-teal-800">{featuredDish.cuisine}</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {featuredDish.rating} ({featuredDish.ratingCount})
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 line-clamp-1">
                  {featuredDish.name}
                </h3>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-lg">
                    <Leaf className="w-3.5 h-3.5 text-teal-600" />
                    <span>{featuredDish.calories} kcal</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{featuredDish.cookTimeMinutes} phút nấu</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {featuredDish.difficulty}
                  </span>
                </div>
              </div>

              {/* Interactive Taste Profile Prompt Pill */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  {currentUser ? `Chế độ: ${currentUser.tasteProfile.diet}` : 'Chưa lưu khẩu vị riêng?'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentUser) {
                      setIsTasteProfileModalOpen(true);
                    } else {
                      setAuthModalType('register');
                    }
                  }}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 hover:underline transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{currentUser ? 'Chỉnh sửa' : 'Cài đặt ngay'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className="relative w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl text-slate-900 p-6 shadow-2xl border border-slate-200/80 animate-float text-center"
              style={{ animationDuration: '7s' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <ChefHat className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-2">
                Sẵn sàng kết nối CSDL
              </span>
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">
                Kho Công Thức Trống
              </h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Đã làm sạch toàn bộ dữ liệu có sẵn. Khi kết nối cơ sở dữ liệu hoặc thêm món trong trang Quản trị, món ăn nổi bật sẽ tự động xuất hiện tại đây.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Hỏi Bếp trưởng AI Gemini</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
