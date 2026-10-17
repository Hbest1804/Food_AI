import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck, UtensilsCrossed, Users, Bot, BarChart3,
  Plus, Search, Trash2, Edit3, Eye, EyeOff, UserCheck, UserX,
  ChevronLeft, ChevronRight, RefreshCw, X, Check, AlertTriangle,
  MessageSquare, Clock, ThumbsUp, ThumbsDown, Star,
  TrendingUp, ChefHat, Settings, Save, Flame, Heart, Zap,
  Upload, Loader2, Download, Flag, MessageCircle,
  ExternalLink, LogOut, Menu, Activity, Sparkles,
} from 'lucide-react';
import {
  adminDishesApi, adminUsersApi, adminChatbotApi, adminStatsApi,
  type AdminDish, type AdminUser,
  type AdminChatSession, type AdminChatSessionDetail, type AdminChatbotOverview, type AdminStats,
  type AdminChatbotConfig,
} from '../api/adminApi';
import { metaApi } from '../api/metaApi';
import { ingredientsApi } from '../api/ingredientsApi';

import { RecipesManager } from './RecipesManager';

// ─── Toast notification ──────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold transition-all animate-in slide-in-from-top-4 ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
    {type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
  </div>
);

// ─── Confirm dialog ──────────────────────────────────────────────────────────
const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}> = ({ title, message, onConfirm, onCancel, danger }) => (
  <div className="fixed inset-0 z-[90] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 p-6">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-rose-100' : 'bg-amber-100'}`}>
        <AlertTriangle className={`w-6 h-6 ${danger ? 'text-rose-600' : 'text-amber-600'}`} />
      </div>
      <h3 className="text-lg font-bold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-2xl transition-all cursor-pointer">Hủy</button>
        <button onClick={onConfirm} className={`flex-1 py-2.5 font-bold text-sm rounded-2xl text-white transition-all cursor-pointer ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}>Xác nhận</button>
      </div>
    </div>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination: React.FC<{ page: number; totalPages: number; onPageChange: (p: number) => void }> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 cursor-pointer transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-bold text-stone-700 px-3">{page} / {totalPages}</span>
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 cursor-pointer transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── Main AdminPortal component ───────────────────────────────────────────────
export const AdminPortal: React.FC = () => {
  const { currentUser, setActiveTab, logout } = useApp();
  const [activeAdminTab, setActiveAdminTab] = useState<'dishes' | 'recipes' | 'users' | 'chatbot' | 'stats'>('dishes');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void; danger?: boolean } | null>(null);
  const [recipeTargetDishId, setRecipeTargetDishId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, danger = true) => {
    setConfirm({ title, message, onConfirm, danger });
  };

  const handleNavigateToRecipe = (dishId?: string) => {
    if (dishId) {
      setRecipeTargetDishId(dishId);
    }
    setActiveAdminTab('recipes');
  };

  const ADMIN_TABS = [
    {
      id: 'dishes',
      label: 'Quản lý Món ăn',
      desc: 'Kho món ăn, hình ảnh, calo & tự động đồng bộ danh mục',
      icon: UtensilsCrossed,
    },
    {
      id: 'recipes',
      label: 'Quản lý Công thức',
      desc: 'Soạn thảo các bước thực hiện & định lượng nguyên liệu chi tiết',
      icon: ChefHat,
    },
    {
      id: 'users',
      label: 'Quản lý Người dùng',
      desc: 'Phân quyền, trạng thái tài khoản & nhật ký kiểm toán bảo mật',
      icon: Users,
    },
    {
      id: 'chatbot',
      label: 'Giám sát Chatbot AI',
      desc: 'Lịch sử hỏi đáp, gắn cờ vi phạm & cấu hình giới hạn phiên',
      icon: Bot,
    },
    {
      id: 'stats',
      label: 'Báo cáo & Thống kê',
      desc: 'Chỉ số tương tác, món yêu thích & xuất báo cáo CSV',
      icon: BarChart3,
    },
  ] as const;

  const currentTabInfo = ADMIN_TABS.find(t => t.id === activeAdminTab);

  const handleLogoutAdmin = () => {
    showConfirm(
      'Đăng xuất khỏi Quản trị',
      'Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị hệ thống?',
      async () => {
        await logout();
        setActiveTab('browse');
      }
    );
  };

  return (
    <div className="h-screen w-screen flex bg-stone-50/80 text-stone-900 font-sans antialiased overflow-hidden selection:bg-purple-200">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* ── SIDEBAR CỐ ĐỊNH CHUYÊN BIỆT CHO QUẢN TRỊ VIÊN (LIGHT & FRESH THEME) ── */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white text-stone-800 flex flex-col justify-between border-r border-stone-200/90 shadow-sm transition-transform duration-300 ease-in-out shrink-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Top Logo / Brand Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">Culina<span className="text-purple-600">Admin</span></span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200/80">v2.0</span>
                </div>
                <p className="text-[11px] text-stone-400 font-medium">Cổng Quản Trị Hệ Thống</p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Profile Box */}
          <div className="p-3.5 mx-3.5 my-3.5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-stone-50/50 to-indigo-50/50 border border-purple-100/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-stone-900 truncate">{currentUser?.name || 'Administrator'}</div>
                <div className="text-[11px] text-stone-500 truncate">{currentUser?.email || 'admin@culina.ai'}</div>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200/60">
                  <ShieldCheck className="w-3 h-3 text-purple-600" /> Quản trị viên
                </div>
              </div>
            </div>
          </div>

          {/* Menu Navigation Items */}
          <div className="px-3.5 py-1">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
              Chức năng quản trị
            </div>
            <nav className="space-y-1">
              {ADMIN_TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeAdminTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveAdminTab(id as any);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-left cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-500/25'
                        : 'text-stone-600 hover:text-purple-700 hover:bg-purple-50/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-purple-600'}`} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Chuyển sang web user & Đăng xuất */}
        <div className="p-3.5 border-t border-stone-100 space-y-2 bg-stone-50/60">
          {/* Nút Xem trang người dùng */}
          <button
            onClick={() => setActiveTab('browse')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-white hover:bg-purple-50 text-stone-700 hover:text-purple-700 border border-stone-200 hover:border-purple-200 transition-all cursor-pointer group shadow-2xs"
            title="Quay lại giao diện website dành cho người dùng"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-purple-600 group-hover:rotate-12 transition-transform" />
              <span>Xem trang Người dùng</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono border border-purple-200/80">Web</span>
          </button>

          {/* Nút Đăng xuất */}
          <button
            onClick={handleLogoutAdmin}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-stone-400 group-hover:text-rose-600 transition-colors" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </aside>

      {/* ── WORKSPACE NỘI DUNG CHÍNH (FULL VIEWPORT) ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Dashboard */}
        <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
              title="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-400 hidden sm:inline">Bảng Quản Trị</span>
                <span className="text-xs text-stone-300 hidden sm:inline">/</span>
                <h1 className="text-base sm:text-lg font-serif font-bold text-stone-900">{currentTabInfo?.label}</h1>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">{currentTabInfo?.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống trực tuyến</span>
            </div>

            {/* Quick Go to User Page */}
            <button
              onClick={() => setActiveTab('browse')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200/60 flex items-center gap-1.5 cursor-pointer"
              title="Quay lại giao diện website người dùng"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trang Người dùng</span>
            </button>

            {/* Nút Đăng xuất tài khoản trực tiếp trên Header */}
            <button
              onClick={handleLogoutAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200/80 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
              title="Đăng xuất khỏi tài khoản Quản trị"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-stone-100/60">
          <div className="max-w-7xl mx-auto">
            {activeAdminTab === 'dishes' && (
              <DishesManager
                showToast={showToast}
                showConfirm={showConfirm}
                onNavigateToRecipe={handleNavigateToRecipe}
              />
            )}
            {activeAdminTab === 'recipes' && (
              <RecipesManager
                showToast={showToast}
                showConfirm={showConfirm}
                initialDishId={recipeTargetDishId}
                onClearInitialDishId={() => setRecipeTargetDishId(null)}
              />
            )}
            {activeAdminTab === 'users' && <UsersManager showToast={showToast} showConfirm={showConfirm} />}
            {activeAdminTab === 'chatbot' && <ChatbotMonitor showToast={showToast} />}
            {activeAdminTab === 'stats' && <StatsView />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// UC11: Quản lý Món ăn
// ═══════════════════════════════════════════════════════════════════════════════
const DishesManager: React.FC<{
  showToast: Function;
  showConfirm: Function;
  onNavigateToRecipe?: (dishId: string) => void;
}> = ({ showToast, showConfirm, onNavigateToRecipe }) => {
  const [dishes, setDishes] = useState<AdminDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [editingDish, setEditingDish] = useState<AdminDish | null | 'new'>('new');
  const [showEditor, setShowEditor] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category_name: string;
    tag_ids: number[];
    image_url: string;
    cook_time_minutes: string;
    difficulty: string;
    servings: string;
    est_cost: string;
    calories: string;
    protein_g: string;
    carbs_g: string;
    fat_g: string;
  }>({
    name: '', description: '', category_name: '',
    tag_ids: [],
    image_url: '', cook_time_minutes: '', difficulty: '',
    servings: '2', est_cost: '', calories: '', protein_g: '',
    carbs_g: '', fat_g: '',
  });
  const dishImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDishImg, setIsUploadingDishImg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminDishesApi.getDishes({
        q: q || undefined,
        is_published: filterPublished !== '' ? filterPublished === 'true' : undefined,
        category_id: filterCategory ? parseInt(filterCategory) : undefined,
        page,
        limit: 15,
      });
      if (res.success) {
        setDishes(res.data);
        setTotalPages(res.meta.total_pages);
      }
    } catch { showToast('Lỗi tải danh sách món ăn', 'error'); }
    finally { setLoading(false); }
  }, [q, filterPublished, filterCategory, page]);

  const loadCategoriesAndFilters = useCallback(async () => {
    try {
      const catRes = await metaApi.getCategories();
      if (catRes.success && catRes.data) {
        setCategories(catRes.data.map(c => ({ id: c.id, name: c.name })));
      }
    } catch {
      // silent
    }

    try {
      const filterRes = await metaApi.getFilters();
      if (filterRes.success && filterRes.data) {
        setAvailableTags(filterRes.data.tags?.map(t => ({ id: t.id, name: t.name })) || []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCategoriesAndFilters(); }, [loadCategoriesAndFilters]);

  const handleOpenNew = () => {
    loadCategoriesAndFilters();
    setEditingDish('new');
    setFormData({
      name: '', description: '', category_name: '',
      tag_ids: [], image_url: '', cook_time_minutes: '',
      difficulty: '', servings: '2', est_cost: '', calories: '', protein_g: '',
      carbs_g: '', fat_g: ''
    });
    setShowEditor(true);
  };

  const handleOpenEdit = (dish: AdminDish) => {
    loadCategoriesAndFilters();
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || '',
      category_name: dish.category?.name || '',
      tag_ids: (dish.tags || []).map(t => t.id),
      image_url: dish.image_url || '',
      cook_time_minutes: dish.cook_time_minutes?.toString() || '',
      difficulty: dish.difficulty || '',
      servings: dish.servings?.toString() || '2',
      est_cost: dish.est_cost?.toString() || '',
      calories: dish.calories?.toString() || '',
      protein_g: dish.protein_g?.toString() || '',
      carbs_g: dish.carbs_g?.toString() || '',
      fat_g: dish.fat_g?.toString() || '',
    });
    setShowEditor(true);
  };

  const handleDishImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ảnh món ăn vượt quá dung lượng cho phép (tối đa 5 MB).', 'error');
      return;
    }

    setIsUploadingDishImg(true);
    try {
      const res = await adminDishesApi.uploadImage(file);
      if (res.success && res.data?.url) {
        setFormData(p => ({ ...p, image_url: res.data.url }));
        showToast('Tải ảnh món ăn từ máy lên thành công!', 'success');
      } else {
        showToast('Không thể tải ảnh món ăn lên.', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Lỗi khi tải ảnh món ăn.';
      showToast(msg, 'error');
    } finally {
      setIsUploadingDishImg(false);
      if (dishImageInputRef.current) dishImageInputRef.current.value = '';
    }
  };

  const handleSaveInfo = async () => {
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên món ăn.', 'error');
      return;
    }
    if (!formData.category_name.trim()) {
      showToast('Vui lòng nhập tên danh mục cho món ăn.', 'error');
      return;
    }
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description || undefined,
        category_name: formData.category_name.trim(),
        tag_ids: formData.tag_ids,
        image_url: formData.image_url || undefined,
        cook_time_minutes: formData.cook_time_minutes ? parseInt(formData.cook_time_minutes) : undefined,
        difficulty: formData.difficulty || undefined,
        servings: parseInt(formData.servings) || 2,
        est_cost: formData.est_cost ? parseFloat(formData.est_cost) : undefined,
        calories: formData.calories ? parseFloat(formData.calories) : undefined,
        protein_g: formData.protein_g ? parseFloat(formData.protein_g) : undefined,
        carbs_g: formData.carbs_g ? parseFloat(formData.carbs_g) : undefined,
        fat_g: formData.fat_g ? parseFloat(formData.fat_g) : undefined,
      };
      if (editingDish === 'new') {
        const res = await adminDishesApi.createDish(payload);
        if (res.success) {
          showToast('Đã thêm món ăn mới');
          setShowEditor(false);
          load();
          loadCategoriesAndFilters();

          // Với món mới, gợi ý chuyển sang thêm công thức chế biến
          if (res.data?.id && onNavigateToRecipe) {
            const createdDishId = res.data.id.toString();
            showConfirm(
              'Thêm công thức cho món mới',
              `Món "${res.data.name}" đã được tạo thành công! Món ăn chỉ có thể hiển thị công khai khi đã có công thức. Bạn có muốn chuyển sang Quản lý công thức để soạn công thức ngay bây giờ không?`,
              () => {
                onNavigateToRecipe(createdDishId);
              },
              false
            );
          }
        }
      } else if (editingDish) {
        const res = await adminDishesApi.updateDish(editingDish.id, payload);
        if (res.success) {
          showToast('Đã cập nhật món ăn');
          setShowEditor(false);
          load();
          loadCategoriesAndFilters();
        }
      }
    } catch (err: any) {
      showToast(err?.error?.message || 'Lỗi lưu món ăn', 'error');
    }
  };

  const handleTogglePublish = async (dish: AdminDish) => {
    try {
      await adminDishesApi.togglePublish(dish.id, !dish.is_published);
      showToast(dish.is_published ? 'Đã ẩn món ăn' : 'Đã hiển thị món ăn');
      load();
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Lỗi cập nhật trạng thái';
      showToast(msg, 'error');
    }
  };

  const handleDelete = (dish: AdminDish) => {
    showConfirm('Xóa món ăn', `Bạn có chắc muốn xóa "${dish.name}"? Nếu đã có đánh giá, món sẽ chỉ bị ẩn.`, async () => {
      try {
        await adminDishesApi.deleteDish(dish.id);
        showToast('Đã xử lý xóa món ăn');
        load();
      } catch (err: any) {
        showToast(err?.error?.message || 'Lỗi xóa món ăn', 'error');
      }
    });
  };

  const DIFFICULTY_OPTIONS = [{ value: 'easy', label: 'Dễ' }, { value: 'medium', label: 'Trung bình' }, { value: 'hard', label: 'Khó' }];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Tìm theo tên món..." className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <select value={filterPublished} onChange={e => { setFilterPublished(e.target.value); setPage(1); }} className="text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hiển thị</option>
          <option value="false">Đang ẩn</option>
        </select>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} className="text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={handleOpenNew} className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Thêm món
        </button>
        <button onClick={() => { load(); loadCategoriesAndFilters(); }} className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors" title="Làm mới"><RefreshCw className="w-4 h-4 text-stone-500" /></button>
      </div>

      {/* Dish list */}
      {loading ? (
        <div className="text-center py-12 text-stone-400 text-sm">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-3 font-bold text-stone-700">Món ăn</th>
                <th className="text-left px-4 py-3 font-bold text-stone-700">Danh mục</th>
                <th className="text-left px-4 py-3 font-bold text-stone-700">Công thức</th>
                <th className="text-left px-4 py-3 font-bold text-stone-700">Trạng thái</th>
                <th className="text-right px-4 py-3 font-bold text-stone-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dishes.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-stone-400">Không tìm thấy món ăn</td></tr>
              )}
              {dishes.map(dish => (
                <tr key={dish.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-10 h-10 rounded-xl object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center"><ChefHat className="w-5 h-5 text-stone-400" /></div>
                      )}
                      <div>
                        <div className="font-bold text-stone-900 line-clamp-1">{dish.name}</div>
                        <div className="text-xs text-stone-400">{dish.calories ? `${dish.calories} kcal` : 'Chưa có dinh dưỡng'} · {dish.difficulty || 'Chưa phân loại'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{dish.category?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {dish.has_recipe ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToRecipe?.(dish.id.toString())}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Bấm để xem/sửa công thức tại trang Quản lý công thức"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                        Có công thức
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigateToRecipe?.(dish.id.toString())}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Chưa có công thức - Bấm để thêm ngay"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-600" />
                        Chưa có (Thêm ngay)
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {dish.is_published ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><Eye className="w-3 h-3" />Hiển thị</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><EyeOff className="w-3 h-3" />Ẩn</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onNavigateToRecipe?.(dish.id.toString())}
                        className="p-1.5 hover:bg-purple-100 text-purple-700 rounded-lg cursor-pointer transition-colors"
                        title="Mở Quản lý công thức món này"
                      >
                        <ChefHat className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenEdit(dish)} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors" title="Sửa thông tin món"><Edit3 className="w-4 h-4 text-stone-500" /></button>
                      <button onClick={() => handleTogglePublish(dish)} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors" title={dish.is_published ? 'Ẩn' : 'Hiển thị'}>
                        {dish.is_published ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-emerald-500" />}
                      </button>
                      <button onClick={() => handleDelete(dish)} className="p-1.5 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors" title="Xóa"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Dish Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  {editingDish === 'new' ? 'Thêm món ăn mới' : `Sửa thông tin: ${(editingDish as AdminDish)?.name}`}
                </h2>
                <p className="text-xs text-stone-500">Thông tin cơ bản, hình ảnh tải từ máy và dinh dưỡng</p>
              </div>
              <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-stone-100 rounded-xl cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {/* Quick recipe banner for existing dish */}
            {editingDish !== 'new' && (
              <div className="mx-5 mt-4 p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-800">Công thức chế biến & Nguyên liệu</div>
                    <div className="text-[11px] text-stone-500">
                      {(editingDish as AdminDish).has_recipe
                        ? 'Món ăn đã có công thức. Quản lý chi tiết tại trang riêng.'
                        : 'Món ăn chưa có công thức (bắt buộc để được hiển thị công khai).'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    onNavigateToRecipe?.((editingDish as AdminDish).id.toString());
                  }}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  {(editingDish as AdminDish).has_recipe ? 'Sửa công thức' : 'Soạn công thức ngay'}
                </button>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Tên món ăn *</label>
                  <input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="VD: Phở bò Hà Nội" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Mô tả</label>
                  <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" rows={2} placeholder="Mô tả ngắn về món ăn..." />
                </div>
                {/* Tự nhập danh mục kèm datalist gợi ý */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Danh mục món ăn *</label>
                  <input
                    type="text"
                    list="dish-category-list"
                    value={formData.category_name}
                    onChange={e => setFormData(p => ({ ...p, category_name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="Nhập tên danh mục (VD: Món canh, Món xào, Món kho, Đồ uống...)"
                  />
                  <datalist id="dish-category-list">
                    {categories.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Nhập trực tiếp danh mục bạn muốn. Nếu danh mục chưa tồn tại, hệ thống sẽ tự động tạo mới vào cơ sở dữ liệu.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Độ khó</label>
                  <select value={formData.difficulty} onChange={e => setFormData(p => ({...p, difficulty: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none cursor-pointer">
                    <option value="">Chọn độ khó</option>
                    {DIFFICULTY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Khẩu phần *</label>
                  <input type="number" min="1" value={formData.servings} onChange={e => setFormData(p => ({...p, servings: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Thời gian nấu (phút)</label>
                  <input type="number" min="0" value={formData.cook_time_minutes} onChange={e => setFormData(p => ({...p, cook_time_minutes: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ước tính chi phí (VNĐ)</label>
                  <input type="number" min="0" value={formData.est_cost} onChange={e => setFormData(p => ({...p, est_cost: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="50000" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Thẻ món ăn (Tags)</label>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-stone-50 rounded-2xl border border-stone-200 min-h-[44px]">
                    {availableTags.length === 0 ? (
                      <span className="text-xs text-stone-400">Không có thẻ</span>
                    ) : (
                      availableTags.map(tag => {
                        const isSelected = formData.tag_ids.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setFormData(p => ({
                                ...p,
                                tag_ids: isSelected
                                  ? p.tag_ids.filter(id => id !== tag.id)
                                  : [...p.tag_ids, tag.id]
                              }));
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-purple-700 text-white shadow-xs'
                                : 'bg-white text-stone-600 border border-stone-200 hover:border-purple-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {tag.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      Hình ảnh món ăn (Tải từ máy tính)
                    </label>
                    {formData.image_url && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Đã lưu trên Supabase Storage
                      </span>
                    )}
                  </div>

                  <input
                    ref={dishImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleDishImageFileChange}
                  />

                  {formData.image_url ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-purple-200 bg-stone-50 group">
                      <img
                        src={formData.image_url}
                        alt="Món ăn preview"
                        className="w-full h-44 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => dishImageInputRef.current?.click()}
                          disabled={isUploadingDishImg}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" /> Đổi ảnh từ máy
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => dishImageInputRef.current?.click()}
                      className={`border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all ${isUploadingDishImg ? 'pointer-events-none opacity-70' : ''}`}
                    >
                      {isUploadingDishImg ? (
                        <div className="flex flex-col items-center justify-center py-2">
                          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                          <span className="text-xs font-bold text-purple-700">Đang đẩy ảnh lên Supabase Storage...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-2">
                          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 shadow-xs">
                            <Upload className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold text-stone-800 mb-1">
                            Nhấp để chọn ảnh món ăn từ máy tính
                          </span>
                          <span className="text-xs text-stone-500">
                            Định dạng JPG, PNG, WEBP (tối đa 5 MB) - Tự động đẩy lên bucket dishes
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Dinh dưỡng */}
                <div className="col-span-2"><div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Thông tin dinh dưỡng (mỗi khẩu phần)</div></div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Calo (kcal)</label>
                  <input type="number" min="0" value={formData.calories} onChange={e => setFormData(p => ({...p, calories: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Protein (g)</label>
                  <input type="number" min="0" step="0.1" value={formData.protein_g} onChange={e => setFormData(p => ({...p, protein_g: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Carbs (g)</label>
                  <input type="number" min="0" step="0.1" value={formData.carbs_g} onChange={e => setFormData(p => ({...p, carbs_g: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Chất béo (g)</label>
                  <input type="number" min="0" step="0.1" value={formData.fat_g} onChange={e => setFormData(p => ({...p, fat_g: e.target.value}))} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEditor(false)} className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl cursor-pointer transition-colors">Hủy</button>
                <button onClick={handleSaveInfo} className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Lưu thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



// ═══════════════════════════════════════════════════════════════════════════════
// UC12: Quản lý Người dùng
// ═══════════════════════════════════════════════════════════════════════════════
const UsersManager: React.FC<{ showToast: Function; showConfirm: Function }> = ({ showToast, showConfirm }) => {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminUsersApi.getUsers({ q: q || undefined, status: filterStatus || undefined, role: filterRole || undefined, page, limit: 20 });
      if (res.success) { setUsers(res.data); setTotalPages(res.meta.total_pages); }
    } catch { showToast('Lỗi tải danh sách người dùng', 'error'); }
    finally { setLoading(false); }
  }, [q, filterStatus, filterRole, page]);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === 'active' ? 'locked' : 'active';
    try {
      await adminUsersApi.updateUser(user.id, { status: newStatus });
      showToast(newStatus === 'locked' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      load();
    } catch (err: any) {
      showToast(err?.error?.message || 'Lỗi cập nhật', 'error');
    }
  };

  const handleChangeRole = async (user: AdminUser, newRole: 'user' | 'admin') => {
    try {
      await adminUsersApi.updateUser(user.id, { role: newRole });
      showToast(`Đã đổi vai trò sang ${newRole === 'admin' ? 'Admin' : 'Người dùng'}`);
      load();
    } catch (err: any) {
      showToast(err?.error?.message || 'Lỗi cập nhật vai trò', 'error');
    }
  };

  const handleDelete = (user: AdminUser) => {
    showConfirm('Xóa tài khoản', `Xóa vĩnh viễn tài khoản "${user.display_name}" (${user.email})? Thao tác không thể hoàn tác.`, async () => {
      try {
        await adminUsersApi.deleteUser(user.id);
        showToast('Đã xóa tài khoản');
        load();
      } catch (err: any) {
        showToast(err?.error?.message || 'Lỗi xóa tài khoản', 'error');
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Tìm theo tên, email..." className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} className="text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer">
          <option value="">Tất cả vai trò</option>
          <option value="user">Người dùng</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={async () => {
            setShowAuditLogs(true);
            setAuditLoading(true);
            try {
              const res = await adminUsersApi.getAuditLogs({ limit: 50 });
              if (res.success) setAuditLogs(res.data);
            } catch {
              showToast('Lỗi tải nhật ký thao tác', 'error');
            } finally {
              setAuditLoading(false);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
          title="Xem lịch sử các thao tác quản trị"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Nhật ký thao tác</span>
        </button>
        <button onClick={load} className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer"><RefreshCw className="w-4 h-4 text-stone-500" /></button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-400 text-sm">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-3 font-bold text-stone-700">Người dùng</th>
                <th className="text-left px-4 py-3 font-bold text-stone-700">Vai trò</th>
                <th className="text-left px-4 py-3 font-bold text-stone-700">Trạng thái</th>
                <th className="text-left px-4 py-3 font-bold text-stone-700">Ngày tạo</th>
                <th className="text-right px-4 py-3 font-bold text-stone-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-stone-400">Không tìm thấy người dùng</td></tr>
              )}
              {users.map(user => (
                <tr key={user.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=0D9488&color=fff`}
                        alt={user.display_name}
                        className="w-8 h-8 rounded-xl"
                      />
                      <div>
                        <div className="font-bold text-stone-900">{user.display_name}</div>
                        <div className="text-xs text-stone-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'}`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Chỉ cho thao tác lên user khác, không tự thao tác lên mình */}
                      {user.id !== currentUser?.id && (
                        <>
                          <button onClick={() => handleToggleStatus(user)} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer" title={user.status === 'active' ? 'Khóa' : 'Mở khóa'}>
                            {user.status === 'active' ? <UserX className="w-4 h-4 text-amber-500" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
                          </button>
                          <button onClick={() => handleChangeRole(user, user.role === 'admin' ? 'user' : 'admin')} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer text-xs font-bold text-purple-600" title="Đổi vai trò">
                            {user.role === 'admin' ? '→User' : '→Admin'}
                          </button>
                          <button onClick={() => handleDelete(user)} className="p-1.5 hover:bg-rose-50 rounded-lg cursor-pointer" title="Xóa tài khoản">
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </>
                      )}
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-stone-300 italic">Bạn</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Audit Logs Modal (UC12 Luồng 2a) */}
      {showAuditLogs && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Nhật ký thao tác quản trị</h3>
                  <p className="text-xs text-stone-500">Lịch sử thay đổi trạng thái, vai trò và dữ liệu hệ thống</p>
                </div>
              </div>
              <button onClick={() => setShowAuditLogs(false)} className="p-1.5 hover:bg-stone-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-stone-400 hover:text-stone-700" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {auditLoading ? (
                <div className="text-center py-12 text-stone-400 text-sm">Đang tải nhật ký...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm">Chưa có bản ghi nhật ký nào.</div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-stone-800 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-mono font-bold uppercase">
                            {log.action}
                          </span>
                          <span>{log.actor?.display_name || 'Quản trị viên'}</span>
                        </span>
                        <span className="text-stone-400 text-[11px] font-mono">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-stone-600">
                        Đối tượng: <span className="font-mono font-semibold text-stone-700">{log.target_type} (#{log.target_id})</span>
                      </div>
                      {log.detail && Object.keys(log.detail).length > 0 && (
                        <div className="mt-1 text-stone-500 font-mono text-[11px] bg-white p-2 rounded-lg border border-stone-100">
                          {JSON.stringify(log.detail)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setShowAuditLogs(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// UC13: Giám sát Chatbot
// ═══════════════════════════════════════════════════════════════════════════════
const ChatbotMonitor: React.FC<{ showToast: Function }> = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sessions' | 'config'>('overview');
  const [overview, setOverview] = useState<AdminChatbotOverview | null>(null);
  const [sessions, setSessions] = useState<AdminChatSession[]>([]);
  const [config, setConfig] = useState<AdminChatbotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [days, setDays] = useState(30);
  const [configForm, setConfigForm] = useState({ guest_query_limit: '5', system_prompt_override: '' });

  const [selectedSession, setSelectedSession] = useState<AdminChatSessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [flaggingMessageId, setFlaggingMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab === 'overview') loadOverview();
    else if (activeSubTab === 'sessions') loadSessions();
    else if (activeSubTab === 'config') loadConfig();
  }, [activeSubTab, days, page]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await adminChatbotApi.getOverview(days);
      if (res.success) setOverview(res.data);
    } catch { showToast('Lỗi tải tổng quan chatbot', 'error'); }
    finally { setLoading(false); }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await adminChatbotApi.getSessions({ page, limit: 20 });
      if (res.success) { setSessions(res.data); setTotalPages(res.meta.total_pages); }
    } catch { showToast('Lỗi tải lịch sử chat', 'error'); }
    finally { setLoading(false); }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await adminChatbotApi.getConfig();
      if (res.success) {
        setConfig(res.data);
        setConfigForm({ guest_query_limit: res.data.guest_query_limit.toString(), system_prompt_override: res.data.system_prompt_override || '' });
      }
    } catch { showToast('Lỗi tải cấu hình chatbot', 'error'); }
    finally { setLoading(false); }
  };

  const handleOpenSession = async (session: AdminChatSession) => {
    setDetailLoading(true);
    try {
      const res = await adminChatbotApi.getSessionDetail(session.id);
      if (res.success && res.data) {
        setSelectedSession(res.data);
      }
    } catch {
      showToast('Lỗi tải chi tiết hội thoại', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleFlagMessage = async (messageId: string, currentFeedback: string | null) => {
    const isCurrentlyFlagged = currentFeedback === 'unhelpful';
    setFlaggingMessageId(messageId);
    try {
      const res = await adminChatbotApi.flagMessage(
        messageId,
        isCurrentlyFlagged ? undefined : 'Nội dung không phù hợp (Admin gắn cờ)',
        !isCurrentlyFlagged
      );
      if (res.success) {
        showToast(isCurrentlyFlagged ? 'Đã bỏ đánh dấu câu trả lời' : 'Đã đánh dấu câu trả lời không phù hợp');
        setSelectedSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map(m =>
              m.id === messageId
                ? {
                    ...m,
                    feedback: isCurrentlyFlagged ? null : 'unhelpful',
                    feedback_reason: isCurrentlyFlagged ? null : 'Nội dung không phù hợp (Admin gắn cờ)',
                  }
                : m
            ),
          };
        });
      }
    } catch (err: any) {
      showToast(err?.error?.message || 'Lỗi khi cập nhật trạng thái tin nhắn', 'error');
    } finally {
      setFlaggingMessageId(null);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await adminChatbotApi.updateConfig({
        guest_query_limit: parseInt(configForm.guest_query_limit) || 5,
        system_prompt_override: configForm.system_prompt_override || undefined,
      });
      showToast('Đã lưu cấu hình chatbot');
    } catch (err: any) {
      showToast(err?.error?.message || 'Lỗi lưu cấu hình', 'error');
    }
  };

  return (
    <div>
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-5 w-fit">
        {([['overview', 'Tổng quan'], ['sessions', 'Hội thoại'], ['config', 'Cấu hình']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveSubTab(id)} className={`px-4 py-1.5 text-sm font-bold rounded-lg cursor-pointer transition-all ${activeSubTab === id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>{label}</button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-900">Thống kê chatbot</h3>
            <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="text-sm border border-stone-200 rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none">
              {[7, 14, 30, 90].map(d => <option key={d} value={d}>{d} ngày gần nhất</option>)}
            </select>
          </div>
          {loading ? <div className="text-center py-12 text-stone-400 text-sm">Đang tải...</div> : overview && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Tổng lượt hỏi', value: overview.total_queries.toLocaleString(), icon: MessageSquare, color: 'bg-blue-50 text-blue-700' },
                { label: 'Tốc độ TB (ms)', value: overview.avg_latency_ms.toLocaleString(), icon: Clock, color: 'bg-amber-50 text-amber-700' },
                { label: 'Tỉ lệ lỗi', value: `${overview.error_rate_percent}%`, icon: AlertTriangle, color: 'bg-rose-50 text-rose-700' },
                { label: 'Phiên user', value: overview.user_sessions.toLocaleString(), icon: Users, color: 'bg-purple-50 text-purple-700' },
                { label: 'Phiên khách', value: overview.guest_sessions.toLocaleString(), icon: Bot, color: 'bg-stone-50 text-stone-700' },
                { label: 'Phản hồi tốt', value: overview.liked.toLocaleString(), icon: ThumbsUp, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Phản hồi xấu', value: overview.disliked.toLocaleString(), icon: ThumbsDown, color: 'bg-rose-50 text-rose-700' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`${color} rounded-2xl p-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{label}</span>
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'sessions' && (
        <div>
          {loading ? <div className="text-center py-12 text-stone-400 text-sm">Đang tải...</div> : (
            <div className="space-y-2">
              {sessions.length === 0 && <div className="text-center py-8 text-stone-400">Không có hội thoại</div>}
              {sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-2xl hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.user?.display_name || 'User')}&background=0D9488&color=fff`} alt="" className="w-8 h-8 rounded-xl" />
                    <div>
                      <div className="font-bold text-stone-900 text-sm">{session.title || 'Cuộc trò chuyện'}</div>
                      <div className="text-xs text-stone-400">{session.user?.email} · {session.message_count} tin nhắn · {new Date(session.updated_at).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenSession(session)}
                    disabled={detailLoading}
                    className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Xem hội thoại
                  </button>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          {/* Session Detail Modal (UC13 Luồng 4: Đánh dấu câu trả lời không phù hợp) */}
          {selectedSession && (
            <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-stone-200 my-8 flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-5 border-b border-stone-200">
                  <div>
                    <h2 className="text-base font-bold text-stone-900 line-clamp-1">{selectedSession.title || 'Cuộc trò chuyện'}</h2>
                    <p className="text-xs text-stone-500">
                      Người dùng: <span className="font-semibold text-stone-700">{selectedSession.user?.display_name || 'Khách'}</span> ({selectedSession.user?.email || 'N/A'}) · {selectedSession.messages?.length || 0} tin nhắn
                    </p>
                  </div>
                  <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-stone-100 rounded-xl cursor-pointer">
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {selectedSession.messages?.length === 0 ? (
                    <div className="text-center py-10 text-stone-400 text-sm">Không có tin nhắn nào trong hội thoại này</div>
                  ) : (
                    selectedSession.messages.map(m => {
                      const isUser = m.role === 'user';
                      const isFlagged = m.feedback === 'unhelpful';
                      return (
                        <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                            isUser
                              ? 'bg-purple-700 text-white rounded-br-none shadow-sm'
                              : 'bg-stone-100 text-stone-800 rounded-bl-none border border-stone-200'
                          }`}>
                            <div className="text-[11px] font-bold mb-1 opacity-75">
                              {isUser ? 'Người dùng' : 'Chatbot AI'}
                            </div>
                            <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                            {!isUser && isFlagged && (
                              <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 -mx-2 -mb-2 p-2 rounded-xl">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{m.feedback_reason || 'Đã đánh dấu không phù hợp'}</span>
                              </div>
                            )}
                          </div>

                          {!isUser && (
                            <div className="flex items-center gap-2 mt-1.5 px-1">
                              <span className="text-[10px] text-stone-400">
                                {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                type="button"
                                disabled={flaggingMessageId === m.id}
                                onClick={() => handleToggleFlagMessage(m.id, m.feedback)}
                                className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                  isFlagged
                                    ? 'text-rose-700 hover:bg-rose-100 bg-rose-50'
                                    : 'text-stone-500 hover:text-rose-600 hover:bg-stone-100'
                                }`}
                              >
                                <Flag className={`w-3 h-3 ${isFlagged ? 'fill-rose-600' : ''}`} />
                                {flaggingMessageId === m.id
                                  ? 'Đang xử lý...'
                                  : isFlagged
                                  ? 'Bỏ đánh dấu'
                                  : 'Đánh dấu không phù hợp'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-stone-200 bg-stone-50 rounded-b-3xl flex justify-end">
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-sm rounded-xl cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'config' && (
        <div className="max-w-lg space-y-5">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Giới hạn lượt hỏi (Khách vãng lai)</label>
            <input type="number" min="0" value={configForm.guest_query_limit} onChange={e => setConfigForm(p => ({...p, guest_query_limit: e.target.value}))} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
            <p className="text-xs text-stone-400 mt-1">Số lượt hỏi tối đa mỗi phiên cho khách vãng lai (0 = không giới hạn)</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">System Prompt Override (tùy chọn)</label>
            <textarea value={configForm.system_prompt_override} onChange={e => setConfigForm(p => ({...p, system_prompt_override: e.target.value}))} rows={6} placeholder="Để trống để dùng prompt mặc định..." className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          </div>
          <button onClick={handleSaveConfig} className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm rounded-xl cursor-pointer flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu cấu hình
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// UC14: Thống kê hệ thống
// ═══════════════════════════════════════════════════════════════════════════════
const StatsView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminStatsApi.getStats(days);
      if (res.success) setStats(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const handleExportCSV = () => {
    if (!stats) return;
    const rows = [
      ['BÁO CÁO THỐNG KÊ HỆ THỐNG TRỢ LÝ ẨM THỰC'],
      [`Khoảng thời gian: ${days} ngày gần nhất (${new Date().toLocaleDateString('vi-VN')})`],
      [''],
      ['Chỉ số', 'Giá trị'],
      ['Tổng số người dùng', stats.users.total],
      ['Người dùng mới trong kỳ', stats.users.new_in_period],
      ['Tổng số món ăn công khai', stats.dishes.total_published],
      ['Lượt hỏi Chatbot trong kỳ', stats.engagement.chat_queries_in_period],
      ['Điểm đánh giá trung bình', stats.engagement.avg_rating.toFixed(2)],
      ['Lượt đánh giá trong kỳ', stats.engagement.ratings_in_period],
      ['Lượt yêu thích trong kỳ', stats.engagement.favorites_in_period],
      [''],
      ['TOP MÓN ĐƯỢC YÊU THÍCH NHẤT'],
      ['Thứ hạng', 'Tên món ăn', 'Số lượt yêu thích'],
      ...stats.top_favorited_dishes.map((item, idx) => [idx + 1, item.dish?.name || 'Món ăn', item.favorite_count]),
      [''],
      ['TOP MÓN ĐƯỢC XEM NHIỀU NHẤT'],
      ['Thứ hạng', 'Tên món ăn'],
      ...stats.top_viewed_dishes.map((item, idx) => [idx + 1, item.dish?.name || 'Món ăn']),
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `thong_ke_${days}_ngay_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-stone-900">Thống kê hệ thống</h3>
        <div className="flex items-center gap-3">
          <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="text-sm border border-stone-200 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer">
            {[7, 14, 30, 90].map(d => <option key={d} value={d}>{d} ngày gần nhất</option>)}
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            title="Xuất báo cáo dạng CSV"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>
          <button onClick={load} className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 cursor-pointer"><RefreshCw className="w-4 h-4 text-stone-500" /></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-stone-400">Đang tải dữ liệu thống kê...</div>
      ) : !stats ? (
        <div className="text-center py-16 text-stone-400">Không có dữ liệu</div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Tổng người dùng', value: stats.users.total.toLocaleString(), sub: `+${stats.users.new_in_period} mới`, icon: Users, color: 'from-blue-500 to-blue-700' },
              { label: 'Món ăn công khai', value: stats.dishes.total_published.toLocaleString(), sub: 'Đang hiển thị', icon: UtensilsCrossed, color: 'from-amber-500 to-orange-600' },
              { label: 'Lượt hỏi Chatbot', value: stats.engagement.chat_queries_in_period.toLocaleString(), sub: `${days} ngày qua`, icon: Bot, color: 'from-purple-500 to-violet-700' },
              { label: 'Điểm trung bình', value: stats.engagement.avg_rating.toFixed(1), sub: `${stats.engagement.ratings_in_period} đánh giá`, icon: Star, color: 'from-emerald-500 to-teal-700' },
              { label: 'Lượt yêu thích', value: stats.engagement.favorites_in_period.toLocaleString(), sub: `${days} ngày qua`, icon: Heart, color: 'from-rose-500 to-pink-700' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-lg`}>
                <Icon className="w-5 h-5 opacity-80 mb-2" />
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs opacity-80 mt-1">{label}</div>
                <div className="text-xs opacity-60">{sub}</div>
              </div>
            ))}
          </div>

          {/* Top Dishes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <h4 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Top món được yêu thích</h4>
              <div className="space-y-3">
                {stats.top_favorited_dishes.length === 0 && <p className="text-sm text-stone-400">Chưa có dữ liệu</p>}
                {stats.top_favorited_dishes.slice(0, 7).map((item, idx) => (
                  <div key={item.dish_id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'}`}>{idx + 1}</span>
                    {item.dish?.image_url && <img src={item.dish.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-stone-900 truncate">{item.dish?.name || 'Món ăn'}</div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-600"><Heart className="w-3 h-3" />{item.favorite_count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <h4 className="font-bold text-stone-900 mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Top món được xem nhiều</h4>
              <div className="space-y-3">
                {stats.top_viewed_dishes.length === 0 && <p className="text-sm text-stone-400">Chưa có dữ liệu</p>}
                {stats.top_viewed_dishes.slice(0, 7).map((item, idx) => (
                  <div key={item.dish_id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${idx < 3 ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-500'}`}>{idx + 1}</span>
                    {item.dish?.image_url && <img src={item.dish.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-stone-900 truncate">{item.dish?.name || 'Món ăn'}</div>
                    </div>
                    <Zap className="w-3 h-3 text-orange-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
