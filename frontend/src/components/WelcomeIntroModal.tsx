import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ChefHat,
  Sliders,
  Refrigerator,
  ShieldCheck,
  Flame,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  UtensilsCrossed,
  Leaf,
} from 'lucide-react';

interface Slide {
  id: number;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeColor: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  graphic: string;
  highlights: string[];
}

const INTRO_SLIDES: Slide[] = [
  {
    id: 1,
    badge: 'Khởi đầu trải nghiệm ẩm thực',
    badgeIcon: <Leaf className="w-3.5 h-3.5 text-teal-600" />,
    badgeColor: 'bg-teal-50 text-teal-900 border-teal-200',
    title: 'Chào mừng bạn đến với CulinaAI 👨‍🍳🌿',
    description:
      'Hệ thống trợ lý ẩm thực thông minh tích hợp trí tuệ nhân tạo Gemini, hướng đến phong cách nấu nướng thanh sạch, cân đối dinh dưỡng và an lành cho gia đình.',
    icon: <UtensilsCrossed className="w-10 h-10 text-white" />,
    iconBg: 'bg-gradient-to-tr from-teal-800 to-emerald-700',
    graphic: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    highlights: [
      'Công thức ẩm thực tuyển chọn thanh đạm & chuẩn vị',
      'Định lượng chuẩn xác từng gam theo khẩu phần gia đình',
      'Tư vấn trực tiếp cùng Bếp trưởng AI 24/7',
    ],
  },
  {
    id: 2,
    badge: 'Cá nhân hóa theo khẩu vị riêng',
    badgeIcon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    title: 'Hồ Sơ Khẩu Vị & Bảo Vệ An Toàn Dị Ứng 🛡️🥗',
    description:
      'Thiết lập chế độ ăn (Eat Clean, Chay, Keto, Tăng cơ...), loại trừ 100% chất gây dị ứng và tính toán điểm phù hợp (% Match Score) cho mọi món ăn.',
    icon: <Sliders className="w-10 h-10 text-white" />,
    iconBg: 'bg-gradient-to-tr from-emerald-800 to-teal-700',
    graphic: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    highlights: [
      'Cảnh báo an toàn ngay khi món chứa thành phần kiêng kỵ',
      'Kiểm soát mục tiêu Calo, Protein, Carbs, Fat lành mạnh',
      'Gợi ý chuẩn xác theo mức độ ăn cay ưa thích',
    ],
  },
  {
    id: 3,
    badge: 'Nấu ăn chống lãng phí',
    badgeIcon: <Refrigerator className="w-3.5 h-3.5 text-teal-600" />,
    badgeColor: 'bg-teal-50 text-teal-900 border-teal-200',
    title: 'Tủ Lạnh Thông Minh & Hẹn Giờ Công Đoạn 🧊⏱️',
    description:
      'Tận dụng nguyên liệu sẵn có trong tủ lạnh để sáng tạo món ngon, kèm Chế độ Nấu ăn Tập trung có chuông đếm ngược cho từng bước nấu.',
    icon: <Refrigerator className="w-10 h-10 text-white" />,
    iconBg: 'bg-gradient-to-tr from-teal-900 to-emerald-800',
    graphic: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    highlights: [
      'Tìm món từ nguyên liệu còn thừa trong tủ lạnh',
      'Bộ hẹn giờ đếm ngược từng bước không lo thức ăn quá lửa',
      'Tự động ghi nhận Calo vào Nhật ký ẩm thực cá nhân',
    ],
  },
  {
    id: 4,
    badge: 'Bắt đầu hành trình',
    badgeIcon: <Sparkles className="w-3.5 h-3.5 text-teal-600" />,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    title: 'Bạn Đã Sẵn Sàng Ăn Ngon & Sống Khỏe? 🍲✨',
    description:
      'Hãy bắt đầu khám phá kho công thức, trò chuyện cùng Bếp trưởng AI hoặc thiết lập hồ sơ dinh dưỡng của bạn ngay hôm nay!',
    icon: <ChefHat className="w-10 h-10 text-white" />,
    iconBg: 'bg-gradient-to-tr from-slate-900 via-teal-950 to-emerald-900',
    graphic: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    highlights: [
      'Trải nghiệm chế độ Khách không cần tạo tài khoản',
      'Đăng nhập tài khoản mẫu để mở khóa trọn bộ tính năng',
      'Giao diện thanh nhã, dễ sử dụng trên mọi thiết bị',
    ],
  },
];

interface WelcomeIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeIntroModal: React.FC<WelcomeIntroModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setIsTasteProfileModalOpen,
    setAuthModalType,
    setActiveTab,
  } = useApp();

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides every 5.5s unless paused or user interacted
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % INTRO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isOpen, isAutoPlaying]);

  if (!isOpen) return null;

  const currentSlide = INTRO_SLIDES[currentSlideIndex];
  const isLastSlide = currentSlideIndex === INTRO_SLIDES.length - 1;

  const handleNext = () => {
    setIsAutoPlaying(false);
    if (isLastSlide) {
      onClose();
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStartExploring = () => {
    onClose();
    setActiveTab('browse');
  };

  const handleSetupProfile = () => {
    onClose();
    if (currentUser) {
      setIsTasteProfileModalOpen(true);
    } else {
      setAuthModalType('register');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Top Progress bar with serene teal gradient */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          {INTRO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`h-full flex-1 transition-all duration-500 ${
                idx === currentSlideIndex
                  ? 'bg-teal-700'
                  : idx < currentSlideIndex
                  ? 'bg-teal-900'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Top Header controls */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentSlide.badgeColor}`}
            >
              {currentSlide.badgeIcon}
              <span>{currentSlide.badge}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              {currentSlideIndex + 1} / {INTRO_SLIDES.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-3 py-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              Bỏ qua giới thiệu
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Slide Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Visual Banner Preview */}
          <div className="relative aspect-[16/8] sm:aspect-[16/7] rounded-2xl overflow-hidden shadow-inner bg-slate-100">
            <img
              src={currentSlide.graphic}
              alt={currentSlide.title}
              className="w-full h-full object-cover transition-transform duration-1000 scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

            {/* Icon Floating Badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl ${currentSlide.iconBg} flex items-center justify-center shadow-lg border border-white/20 animate-float`}
              >
                {currentSlide.icon}
              </div>
              <div className="text-white">
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                  CulinaAI Tour
                </div>
                <div className="font-serif font-bold text-base sm:text-lg line-clamp-1 drop-shadow-sm">
                  {currentSlide.title}
                </div>
              </div>
            </div>
          </div>

          {/* Text & Explanations */}
          <div className="space-y-3">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 leading-snug">
              {currentSlide.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {currentSlide.description}
            </p>

            {/* Highlights List */}
            <div className="pt-2 space-y-2">
              {currentSlide.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              className={`p-2.5 rounded-xl border border-slate-200 text-slate-600 transition-all cursor-pointer ${
                currentSlideIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-white hover:text-slate-900 shadow-2xs'
              }`}
              title="Trang trước"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Slide dots */}
            <div className="flex items-center gap-1.5 px-2">
              {INTRO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentSlideIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentSlideIndex
                      ? 'w-6 bg-teal-800'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Tới trang ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isLastSlide ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSetupProfile}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-teal-800 font-bold text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  Thiết lập khẩu vị
                </button>
                <button
                  onClick={handleStartExploring}
                  className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Bắt đầu ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
