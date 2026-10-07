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
    setAuthModalType,
    setIsTasteProfileModalOpen,
    setIsFridgeModalOpen,
    setActiveTab,
  } = useApp();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 text-white p-6 sm:p-10 lg:p-12 shadow-xl mb-10 border border-teal-800/40">
      {/* Serene ambient glow orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />



      <div className="hidden xl:block absolute top-8 right-8 animate-float-reverse pointer-events-none select-none" style={{ animationDelay: '0.8s' }}>
        <div className="bg-white/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/80 flex items-center gap-3 text-xs text-slate-900">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg shadow-2xs">
            🍲
          </div>
          <div>
            <div className="font-bold text-slate-900">Phở Bò Tái Lăn</div>
            <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> 4.95 ★ (78 đánh giá)
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

        {/* Right Column: Visual Showcase Feature Card with serene styling */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-sm rounded-3xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200 animate-float" style={{ animationDuration: '7s' }}>
            {/* Image Preview with badge */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-100 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80"
                alt="Cá hồi áp chảo măng tây sốt bơ chanh"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Món Đề Xuất Hôm Nay</span>
              </div>
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-teal-800 text-white text-[11px] font-bold shadow-md">
                98% Hợp Gu Bạn
              </div>
            </div>

            {/* Card Content Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-teal-800">Âu / Eat Clean</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> 4.9 (42)
                </span>
              </div>

              <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 line-clamp-1">
                Cá Hồi Áp Chảo Măng Tây Sốt Chanh Bơ
              </h3>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-lg">
                  <Leaf className="w-3.5 h-3.5 text-teal-600" />
                  <span>420 kcal</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>15 phút nấu</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  High Protein
                </span>
              </div>
            </div>

            {/* Interactive Taste Profile Prompt Pill */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {currentUser ? `Chế độ: ${currentUser.tasteProfile.diet}` : 'Chưa lưu khẩu vị riêng?'}
              </span>
              <button
                onClick={() => {
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
        </div>
      </div>
    </section>
  );
};
