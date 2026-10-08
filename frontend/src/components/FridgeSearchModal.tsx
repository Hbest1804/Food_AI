import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Refrigerator,
  Sparkles,
  Plus,
  Trash2,
  ChefHat,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { DishCard } from './DishCard';

const COMMON_FRIDGE_ITEMS = [
  'Ức gà',
  'Thịt bò',
  'Trứng gà',
  'Cá hồi',
  'Đậu hũ non',
  'Cà chua',
  'Nấm hương',
  'Măng tây',
  'Bông cải xanh',
  'Dưa leo',
  'Bơ sáp',
  'Xà lách',
  'Gạo lứt',
  'Mì Ý',
];

export const FridgeSearchModal: React.FC = () => {
  const {
    isFridgeModalOpen,
    setIsFridgeModalOpen,
    dishes,
    setActiveTab,
    setIsChatOpen,
  } = useApp();

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  if (!isFridgeModalOpen) return null;

  const toggleIngredient = (item: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    if (!selectedIngredients.includes(customInput.trim())) {
      setSelectedIngredients((prev) => [...prev, customInput.trim()]);
    }
    setCustomInput('');
  };

  // Find matching dishes that contain at least one of the selected ingredients
  const matchedDishes = dishes.filter((dish) => {
    if (selectedIngredients.length === 0) return false;
    return selectedIngredients.some((ing) =>
      dish.ingredients.some((dishIng) =>
        dishIng.name.toLowerCase().includes(ing.toLowerCase())
      ) ||
      dish.name.toLowerCase().includes(ing.toLowerCase())
    );
  });

  const handleAskAIChef = () => {
    setIsFridgeModalOpen(false);
    setActiveTab('chat');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Refrigerator className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Tủ Lạnh Thông Minh (Tìm món & Chống lãng phí)
              </h2>
              <p className="text-xs text-stone-500">
                Chọn các nguyên liệu bạn đang có sẵn, AI sẽ tìm món hoặc sáng tạo công thức mới
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFridgeModalOpen(false)}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Quick Select Common Fridge Items */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Nguyên liệu phổ biến (Nhấn để chọn nhanh):
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_FRIDGE_ITEMS.map((item) => {
                const isSelected = selectedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleIngredient(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom ingredient input */}
          <form onSubmit={handleAddCustom} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Nhập nguyên liệu khác trong tủ lạnh (vd: súp lơ, hành tây)..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </form>

          {/* Selected items summary */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950">
                Đang có trong tủ lạnh ({selectedIngredients.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedIngredients.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-900 shadow-2xs"
                  >
                    {item}
                    <button
                      onClick={() => toggleIngredient(item)}
                      className="hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {selectedIngredients.length > 0 && (
              <button
                onClick={() => setSelectedIngredients([])}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Matched Dishes in library */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Món ăn nấu được từ nguyên liệu trên ({matchedDishes.length})
              </h3>

              <button
                onClick={handleAskAIChef}
                className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Nhờ AI sáng tạo món mới từ tủ lạnh</span>
              </button>
            </div>

            {matchedDishes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200/80">
                <ChefHat className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-stone-600 font-medium">
                  Chưa có công thức cố định khớp hoàn toàn với tổ hợp nguyên liệu này trong thư viện.
                </p>
                <button
                  onClick={handleAskAIChef}
                  className="mt-3 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Hỏi AI Chef công thức biến tấu ngay!</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={() => setIsFridgeModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-xl border border-stone-300 transition-colors"
          >
            Đóng lại
          </button>

          <button
            onClick={handleAskAIChef}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <ChefHat className="w-4 h-4" />
            <span>Chuyển sang Chatbot AI với nguyên liệu này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
