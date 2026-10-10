import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TasteProfile, SpiceLevel } from '../types';
import { metaApi } from '../api/metaApi';
import {
  X,
  Sliders,
  Check,
  AlertOctagon,
  Flame,
  Heart,
  Droplet,
  Utensils,
  Sparkles,
} from 'lucide-react';

const DIET_OPTIONS = [
  'Bình thường',
  'Eat Clean',
  'Ăn chay',
  'Thuần chay',
  'Keto / Low-Carb',
  'Tăng cơ (High Protein)',
  'Tiểu đường / Ít đường',
];

const ALLERGY_OPTIONS = [
  'Đậu phộng',
  'Hải sản',
  'Sữa bò / Lactose',
  'Gluten',
  'Trứng',
  'Đậu nành',
  'Vừng mè',
];

const DISLIKE_OPTIONS = [
  'Hành lá',
  'Rau mùi / ngò',
  'Ớt cay',
  'Mướp đắng',
  'Măng chua',
  'Nội tạng',
  'Tiêu đen',
  'Sầu riêng',
];

const SPICE_LEVELS: SpiceLevel[] = ['Không cay', 'Cay nhẹ', 'Cay vừa', 'Rất cay'];

const CUISINE_OPTIONS = [
  'Việt Nam',
  'Âu / Eat Clean',
  'Âu / Pháp',
  'Ý / Địa Trung Hải',
  'Ăn Chay (Vegetarian)',
  'Hàn Quốc',
  'Nhật Bản',
];

export const TasteProfileModal: React.FC = () => {
  const {
    isTasteProfileModalOpen,
    setIsTasteProfileModalOpen,
    currentUser,
    updateTasteProfile,
  } = useApp();

  const [dietOptions, setDietOptions] = useState<string[]>(DIET_OPTIONS);
  const [allergyOptions, setAllergyOptions] = useState<string[]>(ALLERGY_OPTIONS);

  React.useEffect(() => {
    if (isTasteProfileModalOpen) {
      metaApi.getFilters().then(res => {
        if (res.success && res.data) {
          if (res.data.diet_types?.length > 0) {
            setDietOptions(res.data.diet_types.map(d => d.name));
          }
          if (res.data.allergen_groups?.length > 0) {
            setAllergyOptions(res.data.allergen_groups.map(a => a.name));
          }
        }
      }).catch(console.error);
    }
  }, [isTasteProfileModalOpen]);

  const currentTaste = currentUser?.tasteProfile || {
    name: 'Bạn',
    diet: 'Bình thường',
    allergies: [],
    dislikes: [],
    spiceTolerance: 'Cay nhẹ' as SpiceLevel,
    targetCalories: 1800,
    healthGoal: 'Duy trì vóc dáng & ăn ngon',
    favoriteCuisines: ['Việt Nam'],
    waterTargetLiters: 2.0,
    dailyMealsCount: 3,
  };

  const [diet, setDiet] = useState<string>(currentTaste.diet);
  const [allergies, setAllergies] = useState<string[]>(currentTaste.allergies || []);
  const [dislikes, setDislikes] = useState<string[]>(currentTaste.dislikes || []);
  const [spiceTolerance, setSpiceTolerance] = useState<SpiceLevel>(currentTaste.spiceTolerance);
  const [targetCalories, setTargetCalories] = useState<number>(currentTaste.targetCalories || 1800);
  const [healthGoal, setHealthGoal] = useState<string>(currentTaste.healthGoal || 'Ăn lành mạnh');
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(currentTaste.favoriteCuisines || ['Việt Nam']);
  const [waterTarget, setWaterTarget] = useState<number>(currentTaste.waterTargetLiters || 2.0);
  const [customDislike, setCustomDislike] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isTasteProfileModalOpen) return null;

  const toggleAllergy = (item: string) => {
    setAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleDislike = (item: string) => {
    setDislikes((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  const addCustomDislike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDislike.trim()) return;
    if (!dislikes.includes(customDislike.trim())) {
      setDislikes((prev) => [...prev, customDislike.trim()]);
    }
    setCustomDislike('');
  };

  const toggleCuisine = (item: string) => {
    setFavoriteCuisines((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    const updated: Partial<TasteProfile> = {
      diet,
      allergies,
      dislikes,
      spiceTolerance,
      targetCalories,
      healthGoal,
      favoriteCuisines,
      waterTargetLiters: waterTarget,
    };
    updateTasteProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsTasteProfileModalOpen(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Phần Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Hồ Sơ Khẩu Vị & Mục Tiêu Dinh Dưỡng
              </h2>
              <p className="text-xs text-stone-500">
                AI CulinaAI sẽ dựa vào đây để lọc món và đề xuất thực đơn chính xác 100%
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTasteProfileModalOpen(false)}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phần Body có thể cuộn được chứa Form */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Mục Chế độ ăn uống */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-teal-700" />
              1. Chế độ ăn uống hiện tại
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dietOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDiet(item)}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                    diet === item
                      ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Mục Dị ứng (An toàn tuyệt đối) */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-800 mb-1 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              2. Dị ứng thực phẩm (Bắt buộc tránh tuyệt đối)
            </label>
            <p className="text-[11px] text-rose-700 mb-3">
              Món ăn chứa bất kỳ chất nào dưới đây sẽ bị đánh dấu Cảnh Báo Đỏ và loại bỏ khỏi gợi ý.
            </p>
            <div className="flex flex-wrap gap-2">
              {allergyOptions.map((item) => {
                const isSelected = allergies.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAllergy(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white hover:bg-rose-100/50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nguyên liệu không thích */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              3. Món hoặc nguyên liệu kiêng / không thích ăn
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DISLIKE_OPTIONS.map((item) => {
                const isSelected = dislikes.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleDislike(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    {isSelected ? '✕ ' : '+ '}
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Thêm món kiêng tự do */}
            <form onSubmit={addCustomDislike} className="flex gap-2">
              <input
                type="text"
                value={customDislike}
                onChange={(e) => setCustomDislike(e.target.value)}
                placeholder="Thêm món kiêng khác (ví dụ: mắm tôm, bạc hà)..."
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs rounded-xl transition-colors"
              >
                Thêm
              </button>
            </form>
          </div>

          {/* Mức độ ăn cay */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-teal-700" />
              4. Mức độ ăn cay ưa thích
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SPICE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpiceTolerance(level)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                    spiceTolerance === level
                      ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Mục tiêu Calo & Thể trạng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                <span>Mục tiêu Calo mỗi ngày</span>
                <span className="text-teal-800 font-mono text-sm">{targetCalories} kcal</span>
              </div>
              <input
                type="range"
                min="1200"
                max="3200"
                step="50"
                value={targetCalories}
                onChange={(e) => setTargetCalories(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>1200 (Giảm cân nhanh)</span>
                <span>2000 (Trung bình)</span>
                <span>3200 (Tăng cân)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Mục tiêu thể trạng
              </label>
              <select
                value={healthGoal}
                onChange={(e) => setHealthGoal(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="Giảm mỡ giữ cơ & Sống khỏe">Giảm mỡ giữ cơ & Sống khỏe</option>
                <option value="Tăng cơ bắp & Thể lực thể thao">Tăng cơ bắp & Thể lực thể thao</option>
                <option value="Duy trì vóc dáng & ăn ngon">Duy trì vóc dáng & ăn ngon</option>
                <option value="Thanh lọc cơ thể & Ăn lành">Thanh lọc cơ thể & Ăn lành</option>
                <option value="Kiểm soát đường huyết & tim mạch">Kiểm soát đường huyết & tim mạch</option>
              </select>
            </div>
          </div>

          {/* Các thể loại ẩm thực yêu thích */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-700" />
              5. Thể loại ẩm thực yêu thích
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((c) => {
                const isSelected = favoriteCuisines.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCuisine(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mục tiêu uống nước */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-600" />
              <span className="font-semibold">Mục tiêu uống nước:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={waterTarget}
                onChange={(e) => setWaterTarget(Number(e.target.value))}
                className="w-16 text-center font-bold bg-white border border-sky-300 rounded-lg p-1 text-sky-950 focus:outline-hidden"
              />
              <span>lít/ngày</span>
            </div>
          </div>
        </div>

        {/* Phần Footer */}
        <div className="p-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={() => setIsTasteProfileModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-xl border border-stone-300 transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-md flex items-center gap-1.5 ${
              savedSuccess
                ? 'bg-emerald-600'
                : 'bg-teal-800 hover:bg-teal-900'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã lưu thành công!</span>
              </>
            ) : (
              <span>Lưu hồ sơ khẩu vị</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
