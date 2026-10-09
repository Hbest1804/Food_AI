import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Clock,
  Flame,
  Star,
  Users,
  AlertTriangle,
  ChefHat,
  Heart,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const DishDetailModal: React.FC = () => {
  const {
    activeDishModal,
    setActiveDishModal,
    setCookingDish,
    currentUser,
    toggleFavorite,
    reviews,
    addReview,
    calculateDishMatchScore,
    setAuthModalType,
  } = useApp();

  const [servings, setServings] = useState<number>(activeDishModal?.servings || 2);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  if (!activeDishModal) return null;

  const dish = activeDishModal;
  const isFavorite = currentUser?.favorites.includes(dish.id) || false;
  const dishReviews = reviews.filter((r) => r.dishId === dish.id);
  const matchInfo = calculateDishMatchScore(dish);

  // Scaled ingredient amounts
  const scaleMultiplier = servings / (dish.servings || 2);

  const toggleCheck = (name: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setActiveDishModal(null);
      setAuthModalType('login');
      return;
    }
    if (!newComment.trim()) return;
    addReview(dish.id, newRating, newComment.trim());
    setNewComment('');
    setHasSubmittedReview(true);
    setTimeout(() => setHasSubmittedReview(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header bar */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden shrink-0 bg-stone-900">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />

          {/* Top buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(dish.id)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-stone-800'
              }`}
              title={isFavorite ? 'Bỏ lưu' : 'Lưu món yêu thích'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => setActiveDishModal(null)}
              className="p-2.5 rounded-full bg-white/80 hover:bg-white text-stone-800 backdrop-blur-md transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Title Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-1">
              <span>{dish.cuisine}</span>
              <span>·</span>
              <span>{dish.dietTags.join(', ')}</span>
              <span>·</span>
              <span className="capitalize">{dish.difficulty}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {dish.name}
            </h2>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-stone-200 mt-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                {dish.rating} ({dish.ratingCount} đánh giá)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-stone-400" />
                Chuẩn bị: {dish.prepTimeMinutes}p · Nấu: {dish.cookTimeMinutes}p
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-teal-600" />
                {dish.calories} kcal / phần
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Personalized match notice if logged in */}
          {currentUser && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 border ${
                matchInfo.isAllergic
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : matchInfo.score >= 80
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              {matchInfo.isAllergic ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm">
                <div className="font-bold">
                  {matchInfo.isAllergic
                    ? '⚠️ CẢNH BÁO AN TOÀN DỊ ỨNG'
                    : `Điểm phù hợp khẩu vị của bạn: ${matchInfo.score}%`}
                </div>
                <ul className="mt-1 list-disc list-inside text-xs space-y-0.5 opacity-90">
                  {matchInfo.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
              {dish.description}
            </p>
          </div>

          {/* Nutrition Facts Grid */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Thông tin dinh dưỡng (Mỗi khẩu phần chuẩn)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-stone-200/80">
                <div className="text-xs text-stone-500 font-medium">Năng lượng</div>
                <div className="text-lg font-bold text-stone-900 mt-0.5">{dish.calories}</div>
                <div className="text-[10px] text-stone-400">kcal</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/80">
                <div className="text-xs text-stone-500 font-medium">Chất đạm (Protein)</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{dish.protein}g</div>
                <div className="text-[10px] text-stone-400">cơ bắp & no lâu</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/80">
                <div className="text-xs text-stone-500 font-medium">Tinh bột (Carbs)</div>
                <div className="text-lg font-bold text-amber-700 mt-0.5">{dish.carbs}g</div>
                <div className="text-[10px] text-stone-400">năng lượng</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/80">
                <div className="text-xs text-stone-500 font-medium">Chất béo (Fat)</div>
                <div className="text-lg font-bold text-stone-700 mt-0.5">{dish.fat}g</div>
                <div className="text-[10px] text-stone-400">chất béo tốt</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/80 col-span-2 sm:col-span-1">
                <div className="text-xs text-stone-500 font-medium">Chất xơ (Fiber)</div>
                <div className="text-lg font-bold text-teal-700 mt-0.5">{dish.fiber}g</div>
                <div className="text-[10px] text-stone-400">hỗ trợ tiêu hóa</div>
              </div>
            </div>
          </div>

          {/* Servings calculator & Ingredients checklist */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Nguyên liệu cần chuẩn bị
                </h3>
                <p className="text-xs text-stone-500">
                  Tích chọn các nguyên liệu bạn đã chuẩn bị sẵn trong bếp
                </p>
              </div>

              {/* Servings selector */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
                <Users className="w-3.5 h-3.5 text-stone-500 ml-1.5" />
                <span className="text-stone-600 font-medium pr-1">Khẩu phần:</span>
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setServings(num)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      servings === num
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {num} người
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dish.ingredients.map((ing, idx) => {
                const scaledAmount = Number((ing.amount * scaleMultiplier).toFixed(1));
                const isChecked = checkedIngredients[ing.name];

                return (
                  <label
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900 line-through opacity-75'
                        : 'bg-white border-stone-200 hover:border-teal-400 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={Boolean(isChecked)}
                        onChange={() => toggleCheck(ing.name)}
                        className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-stone-300 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-medium">{ing.name}</span>
                    </div>
                    <span className="text-xs font-bold text-teal-900">
                      {scaledAmount} {ing.unit}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Cooking Steps Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Hướng dẫn các bước nấu ({dish.steps.length} bước)
                </h3>
                <p className="text-xs text-stone-500">
                  Có thể bật Chế độ Nấu ăn Tập trung để sử dụng Bộ hẹn giờ đếm ngược
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveDishModal(null);
                  setCookingDish(dish);
                }}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Bắt đầu nấu với Bộ hẹn giờ</span>
              </button>
            </div>

            <div className="space-y-3">
              {dish.steps.map((st) => (
                <div
                  key={st.stepNumber}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3.5"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {st.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                      {st.instruction}
                    </p>
                    {st.tip && (
                      <p className="mt-1.5 text-[11px] text-teal-900 bg-teal-50 p-2 rounded-lg border border-teal-200/60">
                        💡 <strong>Mẹo đầu bếp:</strong> {st.tip}
                      </p>
                    )}
                    {st.durationMinutes && (
                      <div className="mt-2 text-[11px] text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Thời gian ước tính: {st.durationMinutes} phút</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chef Tips */}
          {dish.chefTips && dish.chefTips.length > 0 && (
            <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5 mb-2">
                <ChefHat className="w-4 h-4 text-teal-700" />
                Mẹo độc quyền từ Bếp trưởng CulinaAI
              </h4>
              <ul className="text-xs sm:text-sm text-stone-700 space-y-1.5 list-disc list-inside">
                {dish.chefTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Reviews & Community Comments */}
          <div className="pt-4 border-t border-stone-200">
            <h3 className="font-serif font-bold text-lg text-stone-900 mb-3">
              Đánh giá & Bình luận từ người nấu ({dishReviews.length})
            </h3>

            {/* Review form (Only for authenticated users) */}
            {currentUser ? (
              <form onSubmit={handleReviewSubmit} className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-stone-700">
                    Bạn đang bình luận với tên: <span className="font-bold text-teal-800">{currentUser.name}</span>
                  </span>

                  {/* Star rating selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 focus:outline-hidden hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newRating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-1.5">
                      {newRating} sao
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Chia sẻ cảm nhận về hương vị, mẹo bạn biến tấu khi nấu món này..."
                    rows={3}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 bg-white"
                    required
                  />
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi đánh giá</span>
                  </button>
                </div>

                {hasSubmittedReview && (
                  <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cảm ơn bạn! Đánh giá đã được ghi nhận vào hệ thống.</span>
                  </div>
                )}
              </form>
            ) : (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-stone-900">
                      Đăng nhập để đánh giá & bình luận
                    </div>
                    <div className="text-[11px] sm:text-xs text-stone-600">
                      Tính năng đánh giá sao và chia sẻ trải nghiệm dành riêng cho thành viên đã đăng nhập.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDishModal(null);
                    setAuthModalType('login');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {/* Existing Reviews List */}
            <div className="space-y-3">
              {dishReviews.map((rev) => (
                <div key={rev.id} className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className="w-7 h-7 rounded-full object-cover border border-stone-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-stone-900">{rev.userName}</div>
                        <div className="text-[10px] text-stone-400">{rev.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed pl-9">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveDishModal(null)}
            className="px-4 py-2.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-xl border border-stone-300 transition-colors cursor-pointer"
          >
            Đóng lại
          </button>

          <button
            onClick={() => {
              setActiveDishModal(null);
              setCookingDish(dish);
            }}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>Nấu món này ngay (Mở Hẹn giờ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
