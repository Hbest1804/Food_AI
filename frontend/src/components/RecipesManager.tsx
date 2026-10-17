// src/components/RecipesManager.tsx
// Trang chuyên dụng Quản lý công thức món ăn và nguyên liệu chế biến

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChefHat, Search, Plus, Trash2, Edit3, Eye, Check, X,
  Clock, AlertTriangle, Sparkles, Loader2, BookOpen,
  Filter, UtensilsCrossed, Info, ArrowRight,
} from 'lucide-react';
import { adminDishesApi, adminCategoriesApi, type AdminDish } from '../api/adminApi';
import { metaApi } from '../api/metaApi';
import { ingredientsApi } from '../api/ingredientsApi';

interface RecipesManagerProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
  initialDishId?: string | null;
  onClearInitialDishId?: () => void;
}

export const RecipesManager: React.FC<RecipesManagerProps> = ({
  showToast,
  showConfirm,
  initialDishId,
  onClearInitialDishId,
}) => {
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [q, setQ] = useState('');
  const [filterRecipe, setFilterRecipe] = useState<string>(''); // '' | 'true' | 'false'
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [ingredientOptions, setIngredientOptions] = useState<Array<{ id: number; name: string; default_unit?: string }>>([]);

  // Modals state
  const [editingDish, setEditingDish] = useState<AdminDish | null>(null);
  const [previewDish, setPreviewDish] = useState<AdminDish | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Recipe Form state
  const [ingredients, setIngredients] = useState<Array<{
    name: string;
    ingredient_id?: string;
    quantity: string;
    unit: string;
    is_optional: boolean;
  }>>([]);

  const [steps, setSteps] = useState<Array<{
    order: number;
    content: string;
    duration_minutes: string;
  }>>([]);

  // Preview data state
  const [previewData, setPreviewData] = useState<{
    ingredients: Array<{ name: string; quantity: number | null; unit: string; is_optional: boolean }>;
    steps: Array<{ order: number; content: string; duration_minutes?: number }>;
  } | null>(null);

  // Load master data (Categories & Ingredients)
  useEffect(() => {
    adminCategoriesApi.getCategories({ limit: 100 }).then(res => {
      if (res.success && res.data) {
        setCategories(res.data.map(c => ({ id: c.id, name: c.name })));
      }
    }).catch(() => {
      metaApi.getCategories().then(res => {
        if (res.success && res.data) setCategories(res.data);
      }).catch(() => {});
    });

    ingredientsApi.getIngredients({ limit: 500 }).then(res => {
      if (res.success && res.data) {
        setIngredientOptions(res.data.map((i: any) => ({
          id: i.id,
          name: i.name,
          default_unit: i.default_unit || i.unit || 'g',
        })));
      }
    }).catch(() => {});
  }, []);

  // Load dishes list
  const loadDishes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminDishesApi.getDishes({
        q: q || undefined,
        has_recipe: filterRecipe !== '' ? filterRecipe === 'true' : undefined,
        category_id: filterCategory ? parseInt(filterCategory) : undefined,
        page,
        limit: 15,
      });

      if (res.success) {
        setDishes(res.data);
        setTotalPages(res.meta.total_pages);
        setTotalCount(res.meta.total);
      }
    } catch {
      showToast('Lỗi khi tải danh sách món ăn và công thức', 'error');
    } finally {
      setLoading(false);
    }
  }, [q, filterRecipe, filterCategory, page, showToast]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  // Open recipe editor
  const handleOpenEditor = useCallback(async (dish: AdminDish) => {
    setEditingDish(dish);
    setRecipeLoading(true);
    setIngredients([]);
    setSteps([]);

    try {
      const res = await adminDishesApi.getRecipe(dish.id);
      if (res.success && res.data) {
        const d = res.data;
        const mappedIngs = (d.ingredients || []).map((i: any) => ({
          name: i.name || '',
          ingredient_id: i.ingredient_id?.toString() || '',
          quantity: i.quantity != null ? i.quantity.toString() : '',
          unit: i.unit || '',
          is_optional: Boolean(i.is_optional),
        }));

        const mappedSteps = (d.steps || []).map((s: any, idx: number) => ({
          order: s.order ?? idx + 1,
          content: s.content || s.instruction || '',
          duration_minutes: s.duration_minutes != null ? s.duration_minutes.toString() : '',
        }));

        setIngredients(mappedIngs.length > 0 ? mappedIngs : [{ name: '', ingredient_id: '', quantity: '', unit: '', is_optional: false }]);
        setSteps(mappedSteps.length > 0 ? mappedSteps : [{ order: 1, content: '', duration_minutes: '' }]);
      } else {
        setIngredients([{ name: '', ingredient_id: '', quantity: '', unit: '', is_optional: false }]);
        setSteps([{ order: 1, content: '', duration_minutes: '' }]);
      }
    } catch (err) {
      console.warn('Lỗi lấy công thức hiện tại, mở form trống:', err);
      setIngredients([{ name: '', ingredient_id: '', quantity: '', unit: '', is_optional: false }]);
      setSteps([{ order: 1, content: '', duration_minutes: '' }]);
    } finally {
      setRecipeLoading(false);
    }
  }, []);

  // Handle initial dish id if redirected from dishes manager
  useEffect(() => {
    if (initialDishId && dishes.length > 0) {
      const target = dishes.find(d => d.id === initialDishId);
      if (target) {
        handleOpenEditor(target);
      }
      if (onClearInitialDishId) onClearInitialDishId();
    }
  }, [initialDishId, dishes, handleOpenEditor, onClearInitialDishId]);

  // Open recipe preview
  const handleOpenPreview = async (dish: AdminDish) => {
    setPreviewDish(dish);
    setPreviewData(null);
    setRecipeLoading(true);

    try {
      const res = await adminDishesApi.getRecipe(dish.id);
      if (res.success && res.data) {
        setPreviewData({
          ingredients: res.data.ingredients || [],
          steps: res.data.steps || [],
        });
      }
    } catch {
      showToast('Không thể tải chi tiết công thức', 'error');
    } finally {
      setRecipeLoading(false);
    }
  };

  // Add ingredient row
  const handleAddIngredient = () => {
    setIngredients(p => [...p, { name: '', ingredient_id: '', quantity: '', unit: '', is_optional: false }]);
  };

  // Remove ingredient row
  const handleRemoveIngredient = (idx: number) => {
    setIngredients(p => p.filter((_, i) => i !== idx));
  };

  // On change ingredient name -> auto detect matching existing ingredient & default unit
  const handleIngredientNameChange = (idx: number, name: string) => {
    const matched = ingredientOptions.find(o => o.name.toLowerCase() === name.trim().toLowerCase());
    setIngredients(p => p.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        name,
        ingredient_id: matched ? matched.id.toString() : '',
        unit: item.unit || matched?.default_unit || '',
      };
    }));
  };

  // Add step row
  const handleAddStep = () => {
    setSteps(p => [...p, { order: p.length + 1, content: '', duration_minutes: '' }]);
  };

  // Remove step row
  const handleRemoveStep = (idx: number) => {
    setSteps(p => p.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  };

  // Save recipe
  const handleSaveRecipe = async () => {
    if (!editingDish) return;

    // Kiểm tra dữ liệu đầu vào công thức
    const validIngredients = ingredients.filter(i => i.name && i.name.trim() !== '');
    if (validIngredients.length === 0) {
      showToast('Vui lòng nhập tên cho ít nhất một nguyên liệu.', 'error');
      return;
    }

    // Check duplicate ingredients by name
    const ingNames = validIngredients.map(i => i.name.trim().toLowerCase());
    if (new Set(ingNames).size !== ingNames.length) {
      showToast('Có nguyên liệu bị trùng lặp tên. Vui lòng kiểm tra lại.', 'error');
      return;
    }

    const validSteps = steps.filter(s => s.content && s.content.trim() !== '');
    if (validSteps.length === 0) {
      showToast('Vui lòng nhập nội dung cho ít nhất một bước chế biến.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ingredients: validIngredients.map(i => ({
          ingredient_id: i.ingredient_id ? parseInt(i.ingredient_id) : undefined,
          name: i.name.trim(),
          quantity: i.quantity ? parseFloat(i.quantity) : undefined,
          unit: i.unit?.trim() || undefined,
          is_optional: i.is_optional,
        })),
        steps: validSteps.map((s, idx) => ({
          order: idx + 1,
          content: s.content.trim(),
          duration_minutes: s.duration_minutes ? parseInt(s.duration_minutes) : undefined,
        })),
      };

      const res = await adminDishesApi.updateRecipe(editingDish.id, payload);
      if (res.success) {
        showToast(`Đã lưu công thức cho "${editingDish.name}" thành công!`, 'success');
        setEditingDish(null);
        loadDishes();
      } else {
        showToast('Không thể lưu công thức.', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Lỗi khi lưu công thức.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete recipe
  const handleDeleteRecipe = (dish: AdminDish) => {
    showConfirm(
      'Xóa công thức',
      `Bạn có chắc chắn muốn xóa toàn bộ công thức của món "${dish.name}"? Món này sẽ tự động chuyển về trạng thái ẩn khỏi người dùng theo quy định.`,
      async () => {
        try {
          const res = await adminDishesApi.deleteRecipe(dish.id);
          if (res.success) {
            showToast(`Đã xóa công thức của "${dish.name}". Món ăn đã được ẩn khỏi công khai.`, 'success');
            loadDishes();
          }
        } catch (err: any) {
          showToast(err.response?.data?.error?.message || 'Lỗi khi xóa công thức.', 'error');
        }
      },
      true
    );
  };

  // Stats calculation
  const stats = useMemo(() => {
    const withRecipe = dishes.filter(d => d.has_recipe).length;
    const withoutRecipe = dishes.length - withRecipe;
    return { withRecipe, withoutRecipe };
  }, [dishes]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-stone-900">{totalCount}</div>
            <div className="text-xs text-stone-500 font-medium">Tổng số món ăn</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{stats.withRecipe} / {dishes.length}</div>
            <div className="text-xs text-stone-500 font-medium">Đã có công thức (Được hiển thị)</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.withoutRecipe} / {dishes.length}</div>
            <div className="text-xs text-stone-500 font-medium">Chưa có công thức (Cần bổ sung)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Tìm món ăn cần quản lý công thức..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              value={filterRecipe}
              onChange={e => { setFilterRecipe(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-hidden cursor-pointer bg-white"
            >
              <option value="">Tất cả trạng thái công thức</option>
              <option value="true">✓ Đã có công thức</option>
              <option value="false">⚠️ Chưa có công thức</option>
            </select>
          </div>

          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-hidden cursor-pointer bg-white"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Dishes & Recipes List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
            <span className="text-sm font-semibold">Đang tải danh sách công thức...</span>
          </div>
        ) : dishes.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <BookOpen className="w-12 h-12 mx-auto text-stone-300 mb-2" />
            <p className="font-semibold text-stone-700">Không tìm thấy món ăn nào</p>
            <p className="text-xs text-stone-400 mt-1">Hãy thử thay đổi từ khóa hoặc bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Món ăn</th>
                  <th className="px-4 py-3.5">Danh mục</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái công thức</th>
                  <th className="px-4 py-3.5 text-center">Hiển thị công khai</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {dishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {dish.image_url ? (
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                            <ChefHat className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-stone-900">{dish.name}</div>
                          <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                            {dish.cook_time_minutes ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {dish.cook_time_minutes} phút
                              </span>
                            ) : null}
                            {dish.servings ? (
                              <span>• {dish.servings} phần ăn</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-stone-600">
                      <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-semibold text-stone-700">
                        {dish.category?.name || 'Chưa phân loại'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {dish.has_recipe ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Đã có công thức
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          Chưa có công thức
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {dish.is_published ? (
                        <span className="text-xs font-bold text-emerald-600">Công khai</span>
                      ) : (
                        <span className="text-xs font-semibold text-stone-400">Đang ẩn</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {dish.has_recipe && (
                          <button
                            onClick={() => handleOpenPreview(dish)}
                            title="Xem chi tiết công thức"
                            className="p-2 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-xl cursor-pointer transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditor(dish)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            dish.has_recipe
                              ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {dish.has_recipe ? 'Sửa công thức' : 'Soạn công thức'}
                        </button>

                        {dish.has_recipe && (
                          <button
                            onClick={() => handleDeleteRecipe(dish)}
                            title="Xóa công thức"
                            className="p-2 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-xl cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Trang {page} / {totalPages} (Tổng {totalCount} món)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 cursor-pointer font-bold"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 cursor-pointer font-bold"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL SOẠN / SỬA CÔNG THỨC ────────────────────────────────────── */}
      {editingDish && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Công thức: {editingDish.name}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {editingDish.category?.name} • {editingDish.cook_time_minutes || 30} phút • Khẩu phần: {editingDish.servings || 2} người
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDish(null)}
                className="p-2 hover:bg-stone-200/60 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {recipeLoading ? (
                <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
                  <span className="text-xs font-semibold">Đang tải công thức...</span>
                </div>
              ) : (
                <>
                  {/* PHẦN 1: NGUYÊN LIỆU ĐỊNH LƯỢNG */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <UtensilsCrossed className="w-4 h-4 text-purple-600" />
                          1. Danh sách nguyên liệu định lượng <span className="text-rose-500">*</span>
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          Nhập tên nguyên liệu trực tiếp (tự động gợi ý nếu đã có trong hệ thống), điền định lượng và đơn vị tương ứng
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-xl cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm nguyên liệu
                      </button>
                    </div>

                    <div className="space-y-2">
                      {ingredients.map((ing, idx) => (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200">
                          <span className="w-5 text-xs font-bold text-stone-400 text-center shrink-0">
                            {idx + 1}.
                          </span>

                          <div className="flex-1 min-w-[160px] relative">
                            <input
                              type="text"
                              list={`ingredient-options-${idx}`}
                              value={ing.name}
                              onChange={e => handleIngredientNameChange(idx, e.target.value)}
                              placeholder="Nhập tên nguyên liệu (vd: Cá hồi, Tỏi, Chanh...)"
                              className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-400 bg-white"
                            />
                            <datalist id={`ingredient-options-${idx}`}>
                              {ingredientOptions.map(o => (
                                <option key={o.id} value={o.name}>
                                  {o.default_unit ? `Đơn vị gợi ý: ${o.default_unit}` : ''}
                                </option>
                              ))}
                            </datalist>
                          </div>

                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={ing.quantity}
                            onChange={e => setIngredients(p => p.map((x, i) => i === idx ? { ...x, quantity: e.target.value } : x))}
                            placeholder="Số lượng"
                            className="w-20 px-2 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                          />

                          <input
                            type="text"
                            value={ing.unit}
                            onChange={e => setIngredients(p => p.map((x, i) => i === idx ? { ...x, unit: e.target.value } : x))}
                            placeholder="Đơn vị (g, ml, quả...)"
                            className="w-24 px-2 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                          />

                          <label className="flex items-center gap-1.5 text-xs text-stone-600 px-2 cursor-pointer select-none shrink-0">
                            <input
                              type="checkbox"
                              checked={ing.is_optional}
                              onChange={e => setIngredients(p => p.map((x, i) => i === idx ? { ...x, is_optional: e.target.checked } : x))}
                              className="rounded border-stone-300 text-purple-600 focus:ring-purple-400 cursor-pointer"
                            />
                            <span>Tùy chọn</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            disabled={ingredients.length <= 1}
                            className="p-1.5 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PHẦN 2: CÁC BƯỚC CHẾ BIẾN */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          2. Hướng dẫn các bước chế biến theo thứ tự <span className="text-rose-500">*</span>
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          Mô tả chi tiết cách sơ chế, tẩm ướp và thực hiện từng bước
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddStep}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-xl cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm bước làm
                      </button>
                    </div>

                    <div className="space-y-3">
                      {steps.map((step, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                            {idx + 1}
                          </div>

                          <div className="flex-1 space-y-2">
                            <textarea
                              value={step.content}
                              onChange={e => setSteps(p => p.map((x, i) => i === idx ? { ...x, content: e.target.value } : x))}
                              placeholder={`Nội dung chi tiết bước ${idx + 1}... (VD: Thịt bò thái mỏng ướp gia vị)`}
                              rows={2}
                              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-400 resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span className="text-[11px] text-stone-500 font-medium">Thời gian ước tính:</span>
                              <input
                                type="number"
                                min="0"
                                value={step.duration_minutes}
                                onChange={e => setSteps(p => p.map((x, i) => i === idx ? { ...x, duration_minutes: e.target.value } : x))}
                                placeholder="10"
                                className="w-16 px-2 py-1 text-xs border border-stone-200 rounded-lg focus:outline-hidden"
                              />
                              <span className="text-[11px] text-stone-500">phút</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            disabled={steps.length <= 1}
                            className="p-1.5 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div>
                <p className="text-[11px] text-stone-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-purple-600" />
                  Món ăn có đủ công thức mới đủ điều kiện hiển thị công khai trên ứng dụng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 rounded-xl cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  disabled={isSaving || recipeLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang lưu công thức...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Lưu công thức
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL XEM CHI TIẾT CÔNG THỨC (PREVIEW) ────────────────────────── */}
      {previewDish && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">{previewDish.name}</h3>
                  <p className="text-xs text-stone-500">Xem trước công thức thực tế</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDish(null)}
                className="p-2 hover:bg-stone-200/60 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {recipeLoading || !previewData ? (
                <div className="py-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs font-semibold">Đang tải chi tiết...</span>
                </div>
              ) : (
                <>
                  {/* Nguyên liệu */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-purple-600" />
                      Nguyên liệu cần chuẩn bị ({previewData.ingredients.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {previewData.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                          <span className="font-semibold text-stone-800">{ing.name}</span>
                          <span className="text-purple-700 font-bold">
                            {ing.quantity ? `${ing.quantity} ` : ''}{ing.unit || ''}
                            {ing.is_optional && <span className="text-[10px] text-stone-400 font-normal ml-1">(tùy chọn)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Các bước */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-purple-600" />
                      Các bước chế biến ({previewData.steps.length} bước)
                    </h4>
                    <div className="space-y-3">
                      {previewData.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100 text-xs">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px] shadow-2xs mt-0.5">
                            {st.order || i + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-stone-800 leading-relaxed font-medium">{st.content}</p>
                            {st.duration_minutes ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 font-semibold mt-1">
                                <Clock className="w-3 h-3" /> {st.duration_minutes} phút
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-stone-200 flex justify-end gap-2 bg-stone-50/50">
              <button
                type="button"
                onClick={() => setPreviewDish(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewDish;
                  setPreviewDish(null);
                  handleOpenEditor(target);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa công thức này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
