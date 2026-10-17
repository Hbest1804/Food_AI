import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import { DishCard } from './DishCard';
import { ingredientsApi, Ingredient } from '../api/ingredientsApi';
import { dishesApi, DishListItem } from '../api/dishesApi';
import { dishListItemToDish } from '../utils/dishAdapter';
import { Dish } from '../types';

export const FridgeSearchModal: React.FC = () => {
  const {
    isFridgeModalOpen,
    setIsFridgeModalOpen,
    openChatWithPrompt,
    setActiveTab,
    setIsChatOpen,
  } = useApp();

  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [commonIngredients, setCommonIngredients] = useState<Ingredient[]>([]);
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Món ăn khớp từ API /dishes?ingredient_ids=...
  const [matchedDishes, setMatchedDishes] = useState<Dish[]>([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState<boolean>(false);
  const [suggestAi, setSuggestAi] = useState<boolean>(false);
  const [onlyReadyToCook, setOnlyReadyToCook] = useState<boolean>(false);

  // Lấy danh sách nguyên liệu phổ biến
  useEffect(() => {
    if (isFridgeModalOpen) {
      ingredientsApi
        .getIngredients({ limit: 30 })
        .then((res) => {
          if (res.success && res.data?.length > 0) {
            setCommonIngredients(res.data);
          }
        })
        .catch(console.error);
    }
  }, [isFridgeModalOpen]);

  // Autocomplete nguyên liệu khi gõ
  useEffect(() => {
    if (customInput.trim().length >= 2) {
      const delayFn = setTimeout(() => {
        ingredientsApi
          .getIngredients({ q: customInput.trim(), limit: 10 })
          .then((res) => {
            if (res.success && res.data) {
              setSuggestions(res.data);
              setShowSuggestions(true);
            }
          })
          .catch(console.error);
      }, 300);
      return () => clearTimeout(delayFn);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [customInput]);

  // Gọi API /dishes?ingredient_ids=... khi nguyên liệu trong tủ lạnh thay đổi
  useEffect(() => {
    if (!isFridgeModalOpen || selectedIngredients.length === 0) {
      setMatchedDishes([]);
      setSuggestAi(false);
      return;
    }

    const validDbIds = selectedIngredients.filter((i) => i.id > 0).map((i) => i.id);
    if (validDbIds.length === 0) {
      setMatchedDishes([]);
      setSuggestAi(true);
      return;
    }

    const ingIds = validDbIds.join(',');
    setIsLoadingDishes(true);

    const params: any = {
      ingredient_ids: ingIds,
      limit: 30,
    };

    if (onlyReadyToCook) {
      params.min_match_ratio = 1;
    }

    dishesApi
      .getDishes(params)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(dishListItemToDish);
          setMatchedDishes(mapped);
          setSuggestAi(res.meta?.suggest_ai || mapped.length === 0);
        }
      })
      .catch((err) => {
        console.error('Lỗi tìm món theo tủ lạnh:', err);
      })
      .finally(() => {
        setIsLoadingDishes(false);
      });
  }, [selectedIngredients, onlyReadyToCook, isFridgeModalOpen]);

  if (!isFridgeModalOpen) return null;

  const toggleIngredient = (item: Ingredient) => {
    setSelectedIngredients((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    // Tìm trong danh mục gợi ý
    const matched = suggestions.find(
      (s) => s.name.toLowerCase() === customInput.trim().toLowerCase()
    );

    if (matched) {
      if (!selectedIngredients.some((i) => i.id === matched.id)) {
        setSelectedIngredients((prev) => [...prev, matched]);
      }
    } else {
      // Nguyên liệu nhập tay không có id (theo đặc tả UC02 luồng 1b)
      const virtualIng: Ingredient = {
        id: -Date.now(),
        name: customInput.trim(),
        default_unit: 'phần',
      };
      setSelectedIngredients((prev) => [...prev, virtualIng]);
    }
    setCustomInput('');
  };

  const handleAskAIChef = () => {
    setIsFridgeModalOpen(false);
    const validDbIds = selectedIngredients.filter((i) => i.id > 0).map((i) => i.id);
    const customNames = selectedIngredients.filter((i) => i.id <= 0).map((i) => i.name);

    const fridgePayload = {
      ingredient_ids: validDbIds,
      custom_ingredients: customNames,
    };

    if (selectedIngredients.length > 0) {
      const ingNames = selectedIngredients.map((i) => i.name).join(', ');
      openChatWithPrompt(
        `Tôi đang có các nguyên liệu có sẵn gồm: ${ingNames}. Bạn hãy gợi ý hoặc sáng tạo công thức món ăn mới phù hợp và hướng dẫn chi tiết cách nấu cho tôi nhé!`,
        fridgePayload
      );
    } else {
      openChatWithPrompt('Gợi ý cho tôi món ăn ngon và dễ nấu hôm nay nhé!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Phần Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
              <Refrigerator className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Nguyên liệu có sẵn
              </h2>
              <p className="text-xs text-stone-500">
                Chọn các nguyên liệu bạn đang có sẵn, hệ thống sẽ đối chiếu công thức và xếp hạng món nấu được
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFridgeModalOpen(false)}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phần Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Lựa chọn nhanh nguyên liệu phổ biến */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Nguyên liệu có sẵn phổ biến (Nhấn để chọn nhanh):
            </label>
            <div className="flex flex-wrap gap-2">
              {commonIngredients.slice(0, 15).map((item) => {
                const isSelected = selectedIngredients.some((i) => i.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleIngredient(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ô nhập nguyên liệu tùy chỉnh */}
          <div className="relative">
            <form onSubmit={handleAddCustom} className="flex gap-2 relative z-10">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Nhập nguyên liệu khác có sẵn (vd: cà chua, tỏi, nước mắm)..."
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </form>

            {/* Gợi ý Tự động điền (Autocomplete) */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-[80px] bg-white border border-stone-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-emerald-50 border-b border-stone-100 last:border-0 cursor-pointer text-stone-800"
                    onClick={() => {
                      if (!selectedIngredients.some((i) => i.id === suggestion.id)) {
                        setSelectedIngredients((prev) => [...prev, suggestion]);
                      }
                      setCustomInput('');
                      setShowSuggestions(false);
                    }}
                  >
                    🔍 <strong>{suggestion.name}</strong> ({suggestion.default_unit})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tóm tắt các nguyên liệu đã chọn */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-950">
                Nguyên liệu đang có ({selectedIngredients.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedIngredients.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-emerald-900 shadow-2xs"
                  >
                    {item.name}
                    <button
                      onClick={() => toggleIngredient(item)}
                      className="hover:text-rose-600 transition-colors ml-1 cursor-pointer"
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
                className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Bộ lọc nấu được ngay (min_match_ratio = 1) */}
          {selectedIngredients.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-stone-500" />
                <span className="font-semibold text-stone-700">Bộ lọc độ khớp:</span>
                <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyReadyToCook}
                    onChange={(e) => setOnlyReadyToCook(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                  />
                  <span className="text-stone-800 font-medium">
                    Chỉ hiện món đủ 100% nguyên liệu (Nấu được ngay)
                  </span>
                </label>
              </div>

              <span className="text-[11px] text-stone-500 italic">
                (Sắp xếp mặc định: Món khớp nhiều nhất trước)
              </span>
            </div>
          )}

          {/* Danh sách món ăn phù hợp trong thư viện */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Món ăn nấu được từ nguyên liệu trên ({matchedDishes.length})
              </h3>
            </div>

            {isLoadingDishes ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                <p className="text-xs font-medium">Đang tìm các món phù hợp với nguyên liệu của bạn...</p>
              </div>
            ) : matchedDishes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchedDishes.map((dish) => (
                  <div key={dish.id} className="relative flex flex-col">
                    {/* Badge tỷ lệ khớp nguyên liệu */}
                    {dish.match && (
                      <div className="mb-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {dish.match.ratio === 1 ? (
                            <span className="font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                              ✨ Nấu được ngay! (100%)
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-900">
                              Đã có {dish.match.matched_count} nguyên liệu ({Math.round(dish.match.ratio * 100)}%)
                            </span>
                          )}
                        </div>
                        {dish.match.missing_count > 0 && (
                          <span className="text-[11px] text-stone-500 line-clamp-1">
                            Thiếu: {dish.match.missing_ingredients.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                    <DishCard dish={dish} />
                  </div>
                ))}
              </div>
            ) : selectedIngredients.length > 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <ChefHat className="w-10 h-10 text-stone-400 mx-auto" />
                <h4 className="font-serif font-bold text-sm text-stone-800">
                  {onlyReadyToCook
                    ? 'Không có món nào đủ 100% nguyên liệu này.'
                    : 'Chưa có công thức cố định khớp với tổ hợp nguyên liệu này trong thư viện.'}
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {suggestAi
                    ? 'Bạn có thể nhờ Trợ lý AI sáng tạo món ăn hoàn toàn mới từ các nguyên liệu đang có sẵn!'
                    : 'Thử thêm các nguyên liệu thông dụng khác hoặc bỏ bộ lọc 100% để xem thêm gợi ý.'}
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleAskAIChef}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 text-emerald-200" />
                    <span>Chuyển sang Chatbot AI với nguyên liệu này</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                Chọn ít nhất 1 nguyên liệu phía trên để bắt đầu tìm món nấu được từ nguyên liệu có sẵn.
              </div>
            )}
          </div>
        </div>

        {/* Phần Footer */}
        <div className="p-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={() => setIsFridgeModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-xl border border-stone-300 transition-colors cursor-pointer"
          >
            Đóng lại
          </button>

          <button
            onClick={handleAskAIChef}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>Chuyển sang Chatbot AI với nguyên liệu này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
