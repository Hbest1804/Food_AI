import React, { useState } from 'react';
import { Dish } from '../types';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Flame,
  Star,
  Heart,
  AlertTriangle,
  Sparkles,
  ChefHat,
  Leaf,
} from 'lucide-react';

interface DishCardProps {
  dish: Dish;
  showMatchScore?: boolean;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, showMatchScore = true }) => {
  const {
    currentUser,
    toggleFavorite,
    setActiveDishModal,
    setCookingDish,
    calculateDishMatchScore,
  } = useApp();

  const [heartPop, setHeartPop] = useState(false);
  const isFavorite = currentUser?.favorites.includes(dish.id) || false;
  const matchInfo = calculateDishMatchScore(dish);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 300);
    toggleFavorite(dish.id);
  };

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* Image container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={dish.image}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Ambient shadow gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/10 opacity-60 group-hover:opacity-30 transition-opacity" />

        {/* Favorite heart button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 cursor-pointer ${
            heartPop ? 'scale-125' : 'hover:scale-110'
          } ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : 'bg-white/90 text-slate-700 hover:bg-white hover:text-rose-500 shadow-2xs'
          }`}
          title={isFavorite ? 'Bỏ lưu món' : 'Lưu vào yêu thích'}
          aria-label={isFavorite ? 'Bỏ lưu món' : 'Lưu vào yêu thích'}
        >
          <Heart className={`w-4 h-4 transition-transform duration-200 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Match score badge (serene sage/emerald badge) */}
        {showMatchScore && currentUser && (
          <div
            className={`absolute bottom-3 left-3 px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md ${
              matchInfo.isAllergic
                ? 'bg-rose-600 text-white border border-rose-300'
                : matchInfo.score >= 80
                ? 'bg-teal-900/90 text-emerald-200 border border-teal-400/30'
                : 'bg-slate-900/90 text-amber-300 border border-amber-400/30'
            }`}
          >
            {matchInfo.isAllergic ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-100" />
                <span>Chứa dị ứng!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>{matchInfo.score}% Hợp gu</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Metadata line with typographic separators */}
          <div className="flex items-center gap-2 text-xs font-semibold mb-2 flex-wrap text-slate-500">
            <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              {dish.cuisine}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{dish.dietTags[0] || 'Phổ thông'}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="capitalize">{dish.difficulty}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => setActiveDishModal(dish)}
            className="font-serif font-bold text-base sm:text-lg text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {dish.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed font-normal">
            {dish.description}
          </p>

          {/* Allergen Warning Banner if applicable */}
          {matchInfo.isAllergic && (
            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5 font-medium animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Cảnh báo: Có <strong>{dish.allergenWarnings.join(', ')}</strong> theo hồ sơ bạn.
              </span>
            </div>
          )}
        </div>

        {/* Card Footer: Nutrition & Actions */}
        <div className="pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-3.5">
            <div className="flex items-center gap-1 font-bold text-teal-800 bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-100">
              <Leaf className="w-3.5 h-3.5 text-teal-600" />
              <span>{dish.calories} kcal</span>
            </div>

            <div className="flex items-center gap-1 font-medium text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{dish.cookTimeMinutes} phút</span>
            </div>

            <div className="flex items-center gap-1 font-bold text-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{dish.rating}</span>
              <span className="text-slate-400 text-[10px] font-normal">({dish.ratingCount})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveDishModal(dish)}
              className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-center cursor-pointer"
            >
              Xem công thức
            </button>
            <button
              onClick={() => setCookingDish(dish)}
              className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-sm transition-all flex items-center justify-center gap-1 text-center cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Nấu ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
