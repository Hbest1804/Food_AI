import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { metaApi, FilterMeta } from '../api/metaApi';
import { ingredientsApi, Ingredient } from '../api/ingredientsApi';
import { apiGetTasteProfile, apiSaveTasteProfile } from '../api/tasteProfileApi';
import { SaveTasteProfilePayload } from '../types';
import {
  X,
  Sliders,
  Check,
  AlertOctagon,
  Flame,
  Heart,
  Utensils,
  MapPin,
  Users,
  DollarSign,
  Activity,
  AlertCircle,
  Loader2,
  Plus,
  LogIn,
  Search,
  Sparkles,
} from 'lucide-react';

const FALLBACK_META: FilterMeta = {
  regions: [
    { id: 1, code: 'north', name: 'Miền Bắc' },
    { id: 2, code: 'central', name: 'Miền Trung' },
    { id: 3, code: 'south', name: 'Miền Nam' },
  ],
  categories: [],
  tags: [],
  diet_types: [
    { id: 1, code: 'normal', name: 'Bình thường' },
    { id: 2, code: 'eat_clean', name: 'Ăn sạch (Eat Clean)' },
    { id: 3, code: 'vegetarian', name: 'Ăn chay' },
    { id: 4, code: 'vegan', name: 'Thuần chay' },
    { id: 5, code: 'keto', name: 'Ít tinh bột (Low-Carb / Keto)' },
    { id: 6, code: 'high_protein', name: 'Giàu đạm (Tăng cơ)' },
    { id: 7, code: 'low_sugar', name: 'Ít đường / Tiểu đường' },
  ],
  allergen_groups: [
    { id: 1, code: 'seafood', name: 'Hải sản có vỏ' },
    { id: 2, code: 'peanut', name: 'Đậu phộng' },
    { id: 3, code: 'dairy', name: 'Sữa & chế phẩm' },
    { id: 4, code: 'gluten', name: 'Gluten / Bột mì' },
    { id: 5, code: 'egg', name: 'Trứng' },
    { id: 6, code: 'soy', name: 'Đậu nành' },
    { id: 7, code: 'sesame', name: 'Mè / Vừng' },
    { id: 22, code: 'fish', name: 'Cá' },
    { id: 23, code: 'tree_nuts', name: 'Hạt cây' },
    { id: 24, code: 'molluscs', name: 'Mực, ốc, sò' },
    { id: 25, code: 'msg', name: 'Bột ngọt' },
    { id: 26, code: 'insects', name: 'Côn trùng / Nhộng' },
  ],
};

// Loại bỏ các chú thích dài dòng trong ngoặc đơn để tên hiển thị ngắn gọn, súc tích
const cleanAllergenName = (name: string): string => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

const CALORIE_PRESETS = [
  { label: 'Giảm cân', val: 1200 },
  { label: 'Giảm mỡ', val: 1500 },
  { label: 'Duy trì', val: 1800 },
  { label: 'Năng động', val: 2200 },
  { label: 'Tăng cơ', val: 2500 },
];

const BUDGET_PRESETS = [
  { label: 'Tiết kiệm', min: '25000', max: '50000' },
  { label: 'Bình dân', min: '35000', max: '70000' },
  { label: 'Tiêu chuẩn', min: '50000', max: '100000' },
  { label: 'Thoải mái', min: '100000', max: '180000' },
  { label: 'Cao cấp', min: '180000', max: '300000' },
];

const QUICK_BUDGET_MIN_CHIPS = ['20000', '30000', '50000', '70000'];
const QUICK_BUDGET_MAX_CHIPS = ['50000', '80000', '120000', '200000'];

export const TasteProfileModal: React.FC = () => {
  const {
    isTasteProfileModalOpen,
    setIsTasteProfileModalOpen,
    currentUser,
    setAuthModalType,
    refreshTasteProfile,
  } = useApp();

  // ── Dữ liệu danh mục tra cứu từ Backend ──────────────────────────────────
  const [meta, setMeta] = useState<FilterMeta>(FALLBACK_META);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);

  // ── Form State (Khớp Mục 4.5.2) ──────────────────────────────────────────
  const [preferredRegionId, setPreferredRegionId] = useState<number | null>(null);
  const [selectedDietIds, setSelectedDietIds] = useState<number[]>([]);
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<number[]>([]);
  const [spicyLevel, setSpicyLevel] = useState<number>(1);
  const [saltyLevel, setSaltyLevel] = useState<number>(2);
  const [sweetLevel, setSweetLevel] = useState<number>(2);
  const [sourLevel, setSourLevel] = useState<number>(1);
  const [likedIngredientIds, setLikedIngredientIds] = useState<number[]>([]);
  const [dislikedIngredientIds, setDislikedIngredientIds] = useState<number[]>([]);
  const [calorieGoal, setCalorieGoal] = useState<string>('1800');
  const [budgetMin, setBudgetMin] = useState<string>('30000');
  const [budgetMax, setBudgetMax] = useState<string>('120000');
  const [householdSize, setHouseholdSize] = useState<number>(1);

  // ── Tìm kiếm & Gợi ý (Hỗ trợ vừa nhập vừa chọn) ───────────────────────────
  const [likedSearch, setLikedSearch] = useState<string>('');
  const [dislikedSearch, setDislikedSearch] = useState<string>('');
  const [dietSearch, setDietSearch] = useState<string>('');
  const [allergenSearch, setAllergenSearch] = useState<string>('');

  // ── UI & Async State ─────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverDetails, setServerDetails] = useState<any>(null);

  // ── Tải dữ liệu ban đầu khi mở Modal ──────────────────────────────────────
  useEffect(() => {
    if (!isTasteProfileModalOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setServerError(null);
    setServerDetails(null);

    // 1. Tải danh mục tra cứu an toàn
    Promise.all([
      metaApi.getFilters().catch((err) => {
        console.warn('Load meta error:', err);
        return null;
      }),
      ingredientsApi.getIngredients({ limit: 100 }).catch((err) => {
        console.warn('Load ingredients error:', err);
        return null;
      }),
      currentUser
        ? apiGetTasteProfile().catch((err) => {
          console.warn('Load profile error:', err);
          return null;
        })
        : Promise.resolve(null),
    ])
      .then(([metaRes, ingRes, profileRes]) => {
        if (!isMounted) return;

        // Bóc tách dữ liệu linh hoạt (hỗ trợ cả Axios response và data trực tiếp)
        const filterData =
          (metaRes as any)?.data?.regions ? (metaRes as any).data :
            (metaRes as any)?.regions ? (metaRes as any) :
              (metaRes as any)?.data?.data?.regions ? (metaRes as any).data.data : null;

        if (filterData && Array.isArray(filterData.regions) && filterData.regions.length > 0) {
          setMeta(filterData);
        } else if (metaRes?.success && metaRes?.data) {
          setMeta(metaRes.data);
        }

        if (ingRes && (ingRes as any).success && (ingRes as any).data) {
          setAvailableIngredients((ingRes as any).data);
        } else if (Array.isArray(ingRes)) {
          setAvailableIngredients(ingRes);
        }

        // Nếu đã đăng nhập và có hồ sơ từ backend
        if (profileRes && profileRes.success && profileRes.data) {
          const p = profileRes.data;
          setPreferredRegionId(p.preferred_region_id);
          setSelectedDietIds(p.diet_type_ids || []);
          setSelectedAllergenIds(p.allergen_group_ids || []);
          if (p.taste_prefs) {
            setSpicyLevel(p.taste_prefs.spicy_level ?? 1);
            setSaltyLevel(p.taste_prefs.salty_level ?? 2);
            setSweetLevel(p.taste_prefs.sweet_level ?? 2);
            setSourLevel(p.taste_prefs.sour_level ?? 1);
            setLikedIngredientIds(p.taste_prefs.liked_ingredient_ids || []);
          }
          setDislikedIngredientIds(p.disliked_ingredient_ids || []);
          setCalorieGoal(p.calorie_goal ? String(p.calorie_goal) : '1800');
          setBudgetMin(p.budget_min ? String(p.budget_min) : '30000');
          setBudgetMax(p.budget_max ? String(p.budget_max) : '120000');
          setHouseholdSize(p.household_size || 1);
        }
      })
      .catch((err) => {
        console.error('Error loading taste profile:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isTasteProfileModalOpen, currentUser]);

  // ── Kiểm tra mâu thuẫn theo thời gian thực (Luồng 5a) ────────────────────
  const budgetConflict = useMemo(() => {
    const min = Number(budgetMin);
    const max = Number(budgetMax);
    if (!isNaN(min) && !isNaN(max) && min > 0 && max > 0) {
      return min > max;
    }
    return false;
  }, [budgetMin, budgetMax]);

  const ingredientOverlapIds = useMemo(() => {
    return likedIngredientIds.filter((id) => dislikedIngredientIds.includes(id));
  }, [likedIngredientIds, dislikedIngredientIds]);

  // ── Xử lý gợi ý & Danh sách đã chọn (Vừa nhập vừa chọn) ──────────────────
  const filteredLikedSuggestions = useMemo(() => {
    const q = likedSearch.trim().toLowerCase();
    if (!q) return [];
    return availableIngredients.filter(
      (ing) => ing.name.toLowerCase().includes(q) && !likedIngredientIds.includes(ing.id)
    );
  }, [likedSearch, availableIngredients, likedIngredientIds]);

  const filteredDislikedSuggestions = useMemo(() => {
    const q = dislikedSearch.trim().toLowerCase();
    if (!q) return [];
    return availableIngredients.filter(
      (ing) => ing.name.toLowerCase().includes(q) && !dislikedIngredientIds.includes(ing.id)
    );
  }, [dislikedSearch, availableIngredients, dislikedIngredientIds]);

  const selectedLikedItems = useMemo(() => {
    return likedIngredientIds.map((id) => {
      const found = availableIngredients.find((i) => i.id === id);
      return { id, name: found ? found.name : `Nguyên liệu #${id}` };
    });
  }, [likedIngredientIds, availableIngredients]);

  const selectedDislikedItems = useMemo(() => {
    return dislikedIngredientIds.map((id) => {
      const found = availableIngredients.find((i) => i.id === id);
      return { id, name: found ? found.name : `Nguyên liệu #${id}` };
    });
  }, [dislikedIngredientIds, availableIngredients]);

  const visibleDiets = useMemo(() => {
    const q = dietSearch.trim().toLowerCase();
    if (!q) return meta.diet_types;
    return meta.diet_types.filter((d) => d.name.toLowerCase().includes(q));
  }, [meta.diet_types, dietSearch]);

  const visibleAllergens = useMemo(() => {
    const list = meta?.allergen_groups || [];
    const q = allergenSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const clean = cleanAllergenName(a?.name || '').toLowerCase();
      return clean.includes(q) || (a?.name && a.name.toLowerCase().includes(q));
    });
  }, [meta?.allergen_groups, allergenSearch]);

  if (!isTasteProfileModalOpen) return null;

  // ── Handlers Toggle ──────────────────────────────────────────────────────
  const toggleDiet = (id: number) => {
    setSelectedDietIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleAllergen = (id: number) => {
    setSelectedAllergenIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleLikedIngredient = (id: number) => {
    setLikedIngredientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleDislikedIngredient = (id: number) => {
    setDislikedIngredientIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ── Xử lý Lưu hồ sơ khẩu vị (PUT /me/taste-profile) ─────────────────────
  const handleSave = async () => {
    if (!currentUser) {
      setServerError('Vui lòng đăng nhập để lưu hồ sơ khẩu vị lên hệ thống.');
      return;
    }

    if (budgetConflict) {
      setServerError('Mâu thuẫn: Ngân sách tối thiểu không được lớn hơn ngân sách tối đa.');
      return;
    }

    if (ingredientOverlapIds.length > 0) {
      setServerError('Mâu thuẫn: Nguyên liệu không thể vừa nằm trong danh sách yêu thích vừa trong danh sách kiêng.');
      return;
    }

    setIsSaving(true);
    setServerError(null);
    setServerDetails(null);

    const payload: SaveTasteProfilePayload = {
      preferred_region_id: null,
      taste_prefs: {
        spicy_level: Number(spicyLevel),
        salty_level: Number(saltyLevel),
        sweet_level: Number(sweetLevel),
        sour_level: Number(sourLevel),
        liked_ingredient_ids: likedIngredientIds,
      },
      calorie_goal: calorieGoal ? Number(calorieGoal) : null,
      budget_min: budgetMin ? Number(budgetMin) : null,
      budget_max: budgetMax ? Number(budgetMax) : null,
      household_size: Number(householdSize),
      diet_type_ids: selectedDietIds,
      allergen_group_ids: selectedAllergenIds,
      disliked_ingredient_ids: dislikedIngredientIds,
    };

    try {
      const res = await apiSaveTasteProfile(payload);
      if (res.success) {
        setSavedSuccess(true);
        refreshTasteProfile();
        setTimeout(() => {
          setSavedSuccess(false);
          setIsTasteProfileModalOpen(false);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Save taste profile error:', err);
      const code = err?.error?.code;
      const msg = err?.error?.message || 'Lỗi khi lưu hồ sơ khẩu vị. Vui lòng thử lại.';
      setServerError(msg);
      if (err?.error?.details) {
        setServerDetails(err.error.details);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200 text-stone-900">
        {/* Phần Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-emerald-300 flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Hồ Sơ Khẩu Vị & Sở Thích Ăn Uống
              </h2>
              <p className="text-xs text-stone-500">
                Ngữ cảnh cho Chatbot AI và Thuật toán gợi ý thực đơn chính xác 100%
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTasteProfileModalOpen(false)}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo lỗi từ Server hoặc Mâu thuẫn nghiệp vụ */}
        {serverError && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">{serverError}</span>
              {serverDetails && (
                <div className="mt-1 text-[11px] text-rose-600 font-mono">
                  {JSON.stringify(serverDetails)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body Form */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-stone-800">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-700 mx-auto" />
              <p className="text-xs text-stone-500">Đang tải dữ liệu hồ sơ khẩu vị...</p>
            </div>
          ) : (
            <>
              {/* 1. Chế độ ăn uống (Vừa chọn có sẵn vừa tìm kiếm lọc) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-teal-700" />
                    1. Chế độ ăn uống hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={dietSearch}
                      onChange={(e) => setDietSearch(e.target.value)}
                      placeholder="Lọc chế độ..."
                      className="px-2.5 py-1 text-[11px] rounded-lg border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-teal-700 w-28 focus:w-36 transition-all"
                    />
                    {dietSearch && (
                      <button
                        type="button"
                        onClick={() => setDietSearch('')}
                        className="absolute right-1.5 top-1 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(visibleDiets || []).map((diet) => {
                    const isSelected = selectedDietIds.includes(diet.id);
                    return (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => toggleDiet(diet.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {diet.name}
                      </button>
                    );
                  })}
                  {(visibleDiets || []).length === 0 && (
                    <span className="text-xs text-stone-400 py-1">Không tìm thấy chế độ ăn phù hợp.</span>
                  )}
                </div>
              </div>

              {/* 2. Dị ứng thực phẩm cần tránh */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    2. Dị ứng thực phẩm cần tránh
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={allergenSearch}
                      onChange={(e) => setAllergenSearch(e.target.value)}
                      placeholder="Tìm dị ứng..."
                      className="px-2.5 py-1 text-[11px] rounded-lg border border-amber-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-amber-600 w-28 focus:w-36 transition-all"
                    />
                    {allergenSearch && (
                      <button
                        type="button"
                        onClick={() => setAllergenSearch('')}
                        className="absolute right-1.5 top-1 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-stone-600 mb-3">
                  Chọn các thực phẩm bạn hoặc người thân bị dị ứng để Chatbot và hệ thống không gợi ý.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(visibleAllergens || []).map((allergen) => {
                    const isSelected = selectedAllergenIds.includes(allergen.id);
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleAllergen(allergen.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-semibold'
                            : 'bg-white hover:bg-amber-100/70 border-amber-200 text-stone-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {cleanAllergenName(allergen.name)}
                      </button>
                    );
                  })}
                  {(visibleAllergens || []).length === 0 && (
                    <span className="text-xs text-stone-400 py-1">Không tìm thấy nhóm dị ứng phù hợp.</span>
                  )}
                </div>
              </div>

              {/* 3. Mức độ ưa thích vị (0 - 5) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-teal-700" />
                  3. Mức độ ưa thích vị (Thang điểm 0 - 5)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cay */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-700">🌶️ Vị Cay</span>
                      <span className="font-bold text-teal-800">{spicyLevel} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={spicyLevel}
                      onChange={(e) => setSpicyLevel(Number(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>0: Không cay</span>
                      <span>5: Cực cay</span>
                    </div>
                  </div>

                  {/* Mặn */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-700">🧂 Vị Mặn</span>
                      <span className="font-bold text-teal-800">{saltyLevel} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={saltyLevel}
                      onChange={(e) => setSaltyLevel(Number(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>0: Nhạt thanh</span>
                      <span>5: Đậm đà</span>
                    </div>
                  </div>

                  {/* Ngọt */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-700">🍯 Vị Ngọt</span>
                      <span className="font-bold text-teal-800">{sweetLevel} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={sweetLevel}
                      onChange={(e) => setSweetLevel(Number(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>0: Không ngọt</span>
                      <span>5: Ngọt đậm</span>
                    </div>
                  </div>

                  {/* Chua */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-700">🍋 Vị Chua</span>
                      <span className="font-bold text-teal-800">{sourLevel} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={sourLevel}
                      onChange={(e) => setSourLevel(Number(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>0: Không chua</span>
                      <span>5: Chua gắt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Nguyên liệu yêu thích & Nguyên liệu kiêng (Vừa nhập tìm kiếm vừa chọn gợi ý) */}
              <div className="space-y-4">
                {/* 4a. Nguyên liệu yêu thích */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-emerald-600" />
                      4a. Nguyên liệu yêu thích
                    </label>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Đã chọn: {likedIngredientIds.length}
                    </span>
                  </div>

                  {/* Danh sách thẻ tag nguyên liệu đã chọn */}
                  {selectedLikedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                      {selectedLikedItems.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium animate-in fade-in"
                        >
                          ❤️ {item.name}
                          <button
                            type="button"
                            onClick={() => toggleLikedIngredient(item.id)}
                            className="p-0.5 hover:bg-emerald-200 rounded-full cursor-pointer transition-colors text-emerald-700"
                            title="Bỏ chọn nguyên liệu này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ô nhập tìm kiếm nguyên liệu yêu thích */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={likedSearch}
                        onChange={(e) => setLikedSearch(e.target.value)}
                        placeholder="Nhập tên nguyên liệu để tìm kiếm (vd: thịt bò, nấm, tôm...)..."
                        className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-emerald-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30"
                      />
                      {likedSearch && (
                        <button
                          type="button"
                          onClick={() => setLikedSearch('')}
                          className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown danh sách gợi ý khi gõ */}
                    {likedSearch.trim() && (
                      <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white rounded-xl border border-emerald-200 shadow-xl p-1.5 space-y-1">
                        {filteredLikedSuggestions.length > 0 ? (
                          filteredLikedSuggestions.map((ing) => (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => {
                                toggleLikedIngredient(ing.id);
                                setLikedSearch('');
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-50 text-stone-700 flex items-center justify-between cursor-pointer"
                            >
                              <span>+ {ing.name}</span>
                              <span className="text-[10px] text-emerald-700 font-medium">Bấm để chọn</span>
                            </button>
                          ))
                        ) : (
                          <div className="py-2 text-center text-[11px] text-stone-400">
                            Không tìm thấy nguyên liệu phù hợp trong danh mục.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Gợi ý nguyên liệu phổ biến có sẵn (Bấm chọn nhanh) */}
                  <div>
                    <span className="block text-[11px] font-semibold text-emerald-800 mb-1.5">
                      Gợi ý phổ biến (bấm chọn nhanh):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(availableIngredients || []).slice(0, 14).map((ing) => {
                        const isLiked = likedIngredientIds.includes(ing.id);
                        return (
                          <button
                            key={ing.id}
                            type="button"
                            onClick={() => toggleLikedIngredient(ing.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                              isLiked
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold'
                                : 'bg-white hover:bg-emerald-100/70 border border-emerald-200 text-stone-700'
                            }`}
                          >
                            {isLiked ? '✓ ' : '+ '}
                            {ing.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4b. Nguyên liệu kiêng / không thích ăn */}
                <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-stone-500" />
                      4b. Nguyên liệu kiêng / không thích ăn
                    </label>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Đã chọn: {dislikedIngredientIds.length}
                    </span>
                  </div>

                  {/* Danh sách thẻ tag nguyên liệu kiêng đã chọn */}
                  {selectedDislikedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white border border-stone-200 shadow-2xs">
                      {selectedDislikedItems.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-200 text-stone-800 border border-stone-300 text-xs font-medium animate-in fade-in"
                        >
                          ✕ {item.name}
                          <button
                            type="button"
                            onClick={() => toggleDislikedIngredient(item.id)}
                            className="p-0.5 hover:bg-stone-300 rounded-full cursor-pointer transition-colors text-stone-600"
                            title="Bỏ kiêng nguyên liệu này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ô nhập tìm kiếm nguyên liệu kiêng */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={dislikedSearch}
                        onChange={(e) => setDislikedSearch(e.target.value)}
                        placeholder="Nhập tên nguyên liệu muốn kiêng (vd: hành lá, ớt, tỏi, mắm...)..."
                        className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-400/30"
                      />
                      {dislikedSearch && (
                        <button
                          type="button"
                          onClick={() => setDislikedSearch('')}
                          className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown danh sách gợi ý khi gõ */}
                    {dislikedSearch.trim() && (
                      <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-xl p-1.5 space-y-1">
                        {filteredDislikedSuggestions.length > 0 ? (
                          filteredDislikedSuggestions.map((ing) => (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => {
                                toggleDislikedIngredient(ing.id);
                                setDislikedSearch('');
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-stone-100 text-stone-700 flex items-center justify-between cursor-pointer"
                            >
                              <span>+ {ing.name}</span>
                              <span className="text-[10px] text-stone-500 font-medium">Bấm để kiêng</span>
                            </button>
                          ))
                        ) : (
                          <div className="py-2 text-center text-[11px] text-stone-400">
                            Không tìm thấy nguyên liệu phù hợp trong danh mục.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Gợi ý nguyên liệu phổ biến có sẵn (Bấm chọn nhanh) */}
                  <div>
                    <span className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                      Gợi ý phổ biến (bấm chọn nhanh):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(availableIngredients || []).slice(0, 14).map((ing) => {
                        const isDisliked = dislikedIngredientIds.includes(ing.id);
                        return (
                          <button
                            key={ing.id}
                            type="button"
                            onClick={() => toggleDislikedIngredient(ing.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                              isDisliked
                                ? 'bg-stone-700 text-white border-stone-700 shadow-xs font-semibold'
                                : 'bg-white hover:bg-stone-200/60 border border-stone-200 text-stone-700'
                            }`}
                          >
                            {isDisliked ? '✕ ' : '+ '}
                            {ing.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cảnh báo mâu thuẫn vừa thích vừa kiêng */}
                  {ingredientOverlapIds.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Mâu thuẫn: Có {ingredientOverlapIds.length} nguyên liệu vừa được chọn yêu thích vừa bị kiêng!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Mục tiêu Calo & Ngân sách mỗi bữa & Số người (Vừa chọn gợi ý vừa tự nhập) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-700" />
                    5. Mục tiêu Calo, Ngân sách & Quy mô bữa ăn
                  </label>
                  <span className="text-[11px] text-teal-800 font-semibold">Vừa chọn gợi ý vừa tự nhập</span>
                </div>

                {/* 6.1: Mục tiêu Calo */}
                <div className="space-y-2 p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      Mục tiêu Calo mỗi ngày (kcal)
                    </label>
                    <span className="text-xs font-bold text-teal-800">
                      {Number(calorieGoal) > 0 ? `${Number(calorieGoal).toLocaleString()} kcal` : 'Chưa đặt'}
                    </span>
                  </div>

                  {/* Nút chọn nhanh các mức calo có sẵn */}
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">Mức gợi ý phổ biến:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CALORIE_PRESETS.map((p) => {
                        const isActive = Number(calorieGoal) === p.val;
                        return (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setCalorieGoal(String(p.val))}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all border cursor-pointer ${
                              isActive
                                ? 'bg-teal-800 text-white border-teal-800 shadow-xs font-semibold'
                                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                            }`}
                          >
                            {p.val} kcal ({p.label})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ô tự nhập số Calo */}
                  <div className="pt-1">
                    <div className="text-[11px] text-stone-500 mb-1">Hoặc tự nhập số calo chính xác:</div>
                    <input
                      type="number"
                      min={500}
                      max={5000}
                      step={50}
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                      placeholder="Ví dụ: 1850"
                    />
                  </div>
                </div>

                {/* 6.2: Ngân sách mỗi bữa (Min & Max) */}
                <div className="space-y-2.5 p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Khoảng ngân sách cho mỗi bữa ăn (VND)
                    </label>
                    <span className="text-xs font-bold text-emerald-700">
                      {Number(budgetMin).toLocaleString()}đ – {Number(budgetMax).toLocaleString()}đ
                    </span>
                  </div>

                  {/* Gói ngân sách chọn nhanh có sẵn */}
                  <div>
                    <span className="text-[11px] text-stone-500 block mb-1">Gói ngân sách gợi ý có sẵn:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {BUDGET_PRESETS.map((bp) => {
                        const isCurrent = budgetMin === bp.min && budgetMax === bp.max;
                        return (
                          <button
                            key={bp.label}
                            type="button"
                            onClick={() => {
                              setBudgetMin(bp.min);
                              setBudgetMax(bp.max);
                            }}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all border cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold'
                                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                            }`}
                          >
                            {bp.label} ({Number(bp.min) / 1000}k - {Number(bp.max) / 1000}k)
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hai ô tự nhập số tiền Min và Max */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Ngân sách tối thiểu (VND):
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border bg-stone-50/50 text-stone-800 placeholder:text-stone-400 focus:outline-hidden ${
                          budgetConflict ? 'border-rose-400 focus:ring-rose-400/20' : 'border-stone-200 focus:border-emerald-600'
                        }`}
                        placeholder="30000"
                      />
                      {/* Chip gợi ý tiền min */}
                      <div className="flex gap-1 mt-1">
                        {QUICK_BUDGET_MIN_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setBudgetMin(chip)}
                            className="px-1.5 py-0.5 text-[10px] rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                          >
                            {Number(chip) / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Ngân sách tối đa (VND):
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        className={`w-full px-3 py-1.5 text-xs rounded-xl border bg-stone-50/50 text-stone-800 placeholder:text-stone-400 focus:outline-hidden ${
                          budgetConflict ? 'border-rose-400 focus:ring-rose-400/20' : 'border-stone-200 focus:border-emerald-600'
                        }`}
                        placeholder="120000"
                      />
                      {/* Chip gợi ý tiền max */}
                      <div className="flex gap-1 mt-1">
                        {QUICK_BUDGET_MAX_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setBudgetMax(chip)}
                            className="px-1.5 py-0.5 text-[10px] rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                          >
                            {Number(chip) / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {budgetConflict && (
                    <div className="text-[11px] font-bold text-rose-600 animate-in fade-in">
                      ⚠️ Ngân sách tối thiểu ({Number(budgetMin).toLocaleString()}đ) không được lớn hơn ngân sách tối đa ({Number(budgetMax).toLocaleString()}đ)!
                    </div>
                  )}
                </div>

                {/* 6.3: Số người trong gia đình */}
                <div className="space-y-2 p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-700" />
                      Số người trong gia đình
                    </label>
                    <span className="text-xs font-bold text-teal-800">{householdSize} người</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map((num) => {
                        const isSelected = householdSize === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setHouseholdSize(num)}
                            className={`w-9 h-8 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-stone-500 pl-2 border-l border-stone-200">
                      <span>Hoặc tự nhập:</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={householdSize}
                        onChange={(e) => setHouseholdSize(Math.max(1, Number(e.target.value) || 1))}
                        className="w-14 px-2 py-1 text-xs rounded-lg border border-stone-200 text-center font-bold text-stone-800 bg-stone-50/50 focus:outline-hidden"
                      />
                      <span>người</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50/90 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsTasteProfileModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer"
          >
            Đóng lại
          </button>

          {!currentUser ? (
            <button
              type="button"
              onClick={() => {
                setIsTasteProfileModalOpen(false);
                setAuthModalType('login');
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập để lưu hồ sơ</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving || budgetConflict || ingredientOverlapIds.length > 0}
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : isSaving || budgetConflict || ingredientOverlapIds.length > 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                  : 'bg-teal-800 hover:bg-teal-900 text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Lưu Hồ Sơ Khẩu Vị</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
