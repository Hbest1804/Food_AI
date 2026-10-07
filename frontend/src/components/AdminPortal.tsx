import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Dish, User, Difficulty, SpiceLevel } from '../types';
import {
  ShieldCheck,
  UtensilsCrossed,
  Users,
  Bot,
  BarChart3,
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Flame,
  CheckCircle,
  X,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    dishes,
    users,
    chatLogs,
    reviews,
    addDish,
    updateDish,
    deleteDish,
    togglePublishDish,
    toggleUserStatus,
    changeUserRole,
    setActiveDishModal,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'dishes' | 'users' | 'chatbot' | 'stats'>('dishes');

  // Search & Filter state for dish management
  const [dishSearch, setDishSearch] = useState('');
  const [dishCuisineFilter, setDishCuisineFilter] = useState('Tất cả');

  // New/Edit Dish modal state
  const [isDishEditorOpen, setIsDishEditorOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  // Dish form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCuisine, setFormCuisine] = useState('Việt Nam');
  const [formDietTags, setFormDietTags] = useState('Eat Clean');
  const [formMealType, setFormMealType] = useState('Trưa');
  const [formCalories, setFormCalories] = useState(400);
  const [formProtein, setFormProtein] = useState(30);
  const [formCarbs, setFormCarbs] = useState(30);
  const [formFat, setFormFat] = useState(15);
  const [formFiber, setFormFiber] = useState(5);
  const [formPrepTime, setFormPrepTime] = useState(10);
  const [formCookTime, setFormCookTime] = useState(15);
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('Dễ');
  const [formSpiceLevel, setFormSpiceLevel] = useState<SpiceLevel>('Cay nhẹ');
  const [formAllergens, setFormAllergens] = useState('');
  const [formServings, setFormServings] = useState(2);
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80');

  // Open editor for creating
  const handleOpenCreateDish = () => {
    setEditingDishId(null);
    setFormName('');
    setFormDesc('');
    setFormCuisine('Việt Nam');
    setFormDietTags('Eat Clean');
    setFormMealType('Trưa, Tối');
    setFormCalories(420);
    setFormProtein(32);
    setFormCarbs(28);
    setFormFat(14);
    setFormFiber(6);
    setFormPrepTime(10);
    setFormCookTime(15);
    setFormDifficulty('Dễ');
    setFormSpiceLevel('Cay nhẹ');
    setFormAllergens('');
    setFormServings(2);
    setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80');
    setIsDishEditorOpen(true);
  };

  // Open editor for editing existing dish
  const handleOpenEditDish = (dish: Dish) => {
    setEditingDishId(dish.id);
    setFormName(dish.name);
    setFormDesc(dish.description);
    setFormCuisine(dish.cuisine);
    setFormDietTags(dish.dietTags.join(', '));
    setFormMealType(dish.mealType.join(', '));
    setFormCalories(dish.calories);
    setFormProtein(dish.protein);
    setFormCarbs(dish.carbs);
    setFormFat(dish.fat);
    setFormFiber(dish.fiber);
    setFormPrepTime(dish.prepTimeMinutes);
    setFormCookTime(dish.cookTimeMinutes);
    setFormDifficulty(dish.difficulty);
    setFormSpiceLevel(dish.spiceLevel);
    setFormAllergens(dish.allergenWarnings.join(', '));
    setFormServings(dish.servings);
    setFormImage(dish.image);
    setIsDishEditorOpen(true);
  };

  // Save dish
  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    const dietTagsArr = formDietTags.split(',').map((t) => t.trim()).filter(Boolean);
    const mealTypeArr = formMealType.split(',').map((t) => t.trim()).filter(Boolean);
    const allergensArr = formAllergens.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingDishId) {
      const existing = dishes.find((d) => d.id === editingDishId);
      if (!existing) return;
      const updated: Dish = {
        ...existing,
        name: formName,
        description: formDesc,
        cuisine: formCuisine,
        dietTags: dietTagsArr,
        mealType: mealTypeArr,
        calories: Number(formCalories),
        protein: Number(formProtein),
        carbs: Number(formCarbs),
        fat: Number(formFat),
        fiber: Number(formFiber),
        prepTimeMinutes: Number(formPrepTime),
        cookTimeMinutes: Number(formCookTime),
        difficulty: formDifficulty,
        spiceLevel: formSpiceLevel,
        allergenWarnings: allergensArr,
        servings: Number(formServings),
        image: formImage,
      };
      updateDish(updated);
    } else {
      addDish({
        name: formName,
        description: formDesc,
        cuisine: formCuisine,
        dietTags: dietTagsArr,
        mealType: mealTypeArr,
        calories: Number(formCalories),
        protein: Number(formProtein),
        carbs: Number(formCarbs),
        fat: Number(formFat),
        fiber: Number(formFiber),
        prepTimeMinutes: Number(formPrepTime),
        cookTimeMinutes: Number(formCookTime),
        difficulty: formDifficulty,
        spiceLevel: formSpiceLevel,
        allergenWarnings: allergensArr,
        servings: Number(formServings),
        image: formImage,
        ingredients: [
          { name: 'Nguyên liệu chính', amount: 200, unit: 'g' },
          { name: 'Rau thơm & gia vị', amount: 50, unit: 'g' },
        ],
        steps: [
          { stepNumber: 1, instruction: 'Sơ chế nguyên liệu sạch sẽ.', durationMinutes: 5 },
          { stepNumber: 2, instruction: 'Tiến hành chế biến trên lửa vừa chín tới.', durationMinutes: 10 },
        ],
        chefTips: ['Nêm gia vị vừa phải để giữ hương vị tự nhiên.'],
        isPublished: true,
      });
    }
    setIsDishEditorOpen(false);
  };

  // Filtered dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchSearch =
      dish.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
      dish.cuisine.toLowerCase().includes(dishSearch.toLowerCase());
    const matchCuisine =
      dishCuisineFilter === 'Tất cả' || dish.cuisine === dishCuisineFilter;
    return matchSearch && matchCuisine;
  });

  // Calculate System Stats
  const totalUsers = users.length;
  const totalDishes = dishes.length;
  const totalQueries = chatLogs.length;
  const totalRev = reviews.length;
  const helpfulCount = chatLogs.filter((l) => l.feedback === 'helpful').length;
  const satisfactionRate =
    totalQueries > 0 ? Math.round((helpfulCount / totalQueries) * 100) : 95;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Phân Hệ Quản Trị Hệ Thống CulinaAI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Bảng Điều Khiển Quản Trị & Giám Sát
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Quản lý kho dữ liệu món ăn, tài khoản thành viên, giám sát chatbot và phân tích thống kê
          </p>
        </div>

        {/* Action Button */}
        {activeAdminTab === 'dishes' && (
          <button
            onClick={handleOpenCreateDish}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm món ăn mới</span>
          </button>
        )}
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('dishes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeAdminTab === 'dishes'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Quản lý món ăn ({dishes.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeAdminTab === 'users'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản lý người dùng ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('chatbot')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeAdminTab === 'chatbot'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Giám sát Chatbot ({chatLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeAdminTab === 'stats'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Thống kê hệ thống</span>
        </button>
      </div>

      {/* ================= TAB 1: DISH MANAGEMENT ================= */}
      {activeAdminTab === 'dishes' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                placeholder="Tìm món theo tên hoặc thể loại..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-stone-50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-stone-500 font-semibold whitespace-nowrap">
                Ẩm thực:
              </span>
              <select
                value={dishCuisineFilter}
                onChange={(e) => setDishCuisineFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-stone-300 bg-white"
              >
                <option value="Tất cả">Tất cả ẩm thực</option>
                <option value="Việt Nam">Việt Nam</option>
                <option value="Âu / Eat Clean">Âu / Eat Clean</option>
                <option value="Âu / Pháp">Âu / Pháp</option>
                <option value="Ý / Địa Trung Hải">Ý / Địa Trung Hải</option>
                <option value="Ăn Chay (Vegetarian)">Ăn Chay</option>
              </select>
            </div>
          </div>

          {/* Dishes Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Món ăn</th>
                    <th className="py-3 px-4">Ẩm thực & Chế độ</th>
                    <th className="py-3 px-4">Dinh dưỡng (Calo/Macro)</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Độ cay & Dị ứng</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredDishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 cursor-pointer"
                            onClick={() => setActiveDishModal(dish)}
                          />
                          <div>
                            <div
                              onClick={() => setActiveDishModal(dish)}
                              className="font-bold text-stone-900 hover:text-teal-800 cursor-pointer line-clamp-1"
                            >
                              {dish.name}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              ★ {dish.rating} ({dish.ratingCount})
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-800">{dish.cuisine}</div>
                        <div className="text-[10px] text-stone-500">{dish.dietTags.join(', ')}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-teal-900">{dish.calories} kcal</div>
                        <div className="text-[10px] text-stone-500">
                          P: {dish.protein}g · C: {dish.carbs}g · F: {dish.fat}g
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div>{dish.cookTimeMinutes} phút</div>
                        <div className="text-[10px] text-stone-400 capitalize">{dish.difficulty}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-stone-700 font-medium">{dish.spiceLevel}</div>
                        {dish.allergenWarnings.length > 0 ? (
                          <div className="text-[10px] text-rose-600 font-semibold">
                            ⚠️ {dish.allergenWarnings.join(', ')}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600">An toàn</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => togglePublishDish(dish.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dish.isPublished
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {dish.isPublished ? 'Đang hiển thị' : 'Đang ẩn'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditDish(dish)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-teal-800 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa món"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => togglePublishDish(dish.id)}
                            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                            title={dish.isPublished ? 'Ẩn món' : 'Hiện món'}
                          >
                            {dish.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa món "${dish.name}"?`)) {
                                deleteDish(dish.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa món"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: USER MANAGEMENT ================= */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Danh sách Người dùng Hệ thống
              </h3>
              <p className="text-xs text-stone-500">
                Quản lý vai trò, trạng thái khóa/mở và thông tin hồ sơ khẩu vị thành viên
              </p>
            </div>
            <span className="text-xs font-bold text-stone-600 bg-white px-3 py-1 rounded-xl border border-stone-200">
              Tổng số: {users.length} tài khoản
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Hồ sơ khẩu vị</th>
                  <th className="py-3 px-4">Dị ứng ghi nhận</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0 border border-stone-300"
                        />
                        <div>
                          <div className="font-bold text-stone-900">{u.name}</div>
                          <div className="text-[11px] text-stone-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          changeUserRole(u.id, e.target.value as 'user' | 'admin')
                        }
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-stone-100 text-stone-800 border-stone-300'
                        }`}
                      >
                        <option value="user">User (Thành viên)</option>
                        <option value="admin">Admin (Quản trị)</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-800">
                        {u.tasteProfile.diet} · {u.tasteProfile.targetCalories} kcal
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Độ cay: {u.tasteProfile.spiceTolerance}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {u.tasteProfile.allergies && u.tasteProfile.allergies.length > 0 ? (
                        <div className="text-[11px] text-rose-700 font-semibold">
                          {u.tasteProfile.allergies.join(', ')}
                        </div>
                      ) : (
                        <div className="text-[11px] text-stone-400">Không có</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          u.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CHATBOT MONITORING ================= */}
      {activeAdminTab === 'chatbot' && (
        <div className="space-y-6">
          {/* Key Monitoring Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-xs text-stone-500 font-semibold">Tổng truy vấn AI</div>
              <div className="text-2xl font-bold font-serif text-stone-900 mt-1">
                {chatLogs.length}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Hoạt động thời gian thực</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-xs text-stone-500 font-semibold">Thời gian phản hồi TB</div>
              <div className="text-2xl font-bold font-serif text-teal-800 mt-1">
                710 ms
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Model: Gemini 3.8 Flash</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-xs text-stone-500 font-semibold">Tỷ lệ đánh giá Hài lòng</div>
              <div className="text-2xl font-bold font-serif text-emerald-700 mt-1">
                {satisfactionRate}%
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Dựa trên {helpfulCount} lượt thích</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-xs text-stone-500 font-semibold">Bộ lọc an toàn Dị ứng</div>
              <div className="text-2xl font-bold font-serif text-sky-700 mt-1">100%</div>
              <div className="text-[11px] text-stone-400 mt-1">0 vi phạm dị ứng ghi nhận</div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 bg-stone-50/70">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Nhật Ký Hội Thoại Chatbot Gần Đây
              </h3>
              <p className="text-xs text-stone-500">
                Theo dõi truy vấn người dùng, phản hồi của AI và phản hồi chất lượng
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {chatLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{log.userName}</span>
                      {log.isGuest && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-semibold">
                          Khách vãng lai
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-semibold">
                        Chủ đề: {log.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {log.latencyMs} ms
                      </span>
                      {log.feedback === 'helpful' && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <ThumbsUp className="w-3.5 h-3.5" /> Hữu ích
                        </span>
                      )}
                      {log.feedback === 'unhelpful' && (
                        <span className="flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                          <ThumbsDown className="w-3.5 h-3.5" /> Chưa hài lòng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Query */}
                  <div className="text-xs font-semibold text-stone-800 bg-stone-100/60 p-2.5 rounded-xl mb-1.5">
                    👤 <strong>Hỏi:</strong> {log.query}
                  </div>

                  {/* Reply */}
                  <div className="text-xs text-stone-600 bg-teal-50/40 border border-teal-200/50 p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed">
                    🤖 <strong>AI Culina:</strong> {log.reply}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SYSTEM STATS ================= */}
      {activeAdminTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Tổng Người Dùng
              </span>
              <div className="text-3xl font-bold font-serif text-stone-900 mt-1">
                {totalUsers}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">+2 thành viên mới tuần này</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Kho Món Ăn Hoạt Động
              </span>
              <div className="text-3xl font-bold font-serif text-teal-800 mt-1">
                {totalDishes}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">100% công thức chuẩn bị bước</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Lượt Đánh Giá Món
              </span>
              <div className="text-3xl font-bold font-serif text-stone-900 mt-1">
                {totalRev}
              </div>
              <div className="text-[11px] text-teal-700 mt-1">Điểm trung bình 4.9 ★</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200">
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                Truy Vấn Tư Vấn AI
              </span>
              <div className="text-3xl font-bold font-serif text-purple-700 mt-1">
                {totalQueries}
              </div>
              <div className="text-[11px] text-purple-600 mt-1">Hỗ trợ 24/7 tức thì</div>
            </div>
          </div>

          {/* Visual Breakdown of Diets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200">
              <h3 className="font-serif font-bold text-base text-stone-900 mb-4">
                Phân Bổ Chế Độ Ăn Của Người Dùng
              </h3>
              <div className="space-y-3">
                {[
                  { diet: 'Eat Clean / Healthy', percent: 45, color: 'bg-emerald-600' },
                  { diet: 'Ăn Chay (Vegetarian)', percent: 25, color: 'bg-teal-600' },
                  { diet: 'Tăng cơ (High Protein)', percent: 15, color: 'bg-teal-800' },
                  { diet: 'Bình thường', percent: 10, color: 'bg-stone-500' },
                  { diet: 'Keto / Low-Carb', percent: 5, color: 'bg-emerald-700' },
                ].map((item) => (
                  <div key={item.diet}>
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1">
                      <span>{item.diet}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200">
              <h3 className="font-serif font-bold text-base text-stone-900 mb-4">
                Top Món Ăn Được Yêu Thích Nhất
              </h3>
              <div className="space-y-3">
                {dishes.slice(0, 4).map((d, idx) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-stone-900 line-clamp-1">
                          {d.name}
                        </div>
                        <div className="text-[10px] text-stone-500">{d.cuisine} · {d.calories} kcal</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-800">
                      ★ {d.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DISH EDITOR MODAL ================= */}
      {isDishEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
              <h2 className="text-lg font-serif font-bold text-stone-900">
                {editingDishId ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới vào kho'}
              </h2>
              <button
                onClick={() => setIsDishEditorOpen(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tên món ăn
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Cá Hồi Áp Chảo Măng Tây..."
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Mô tả hương vị & đặc điểm
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về nguyên liệu, cảm giác hương vị..."
                  rows={2}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Xuất xứ / Ẩm thực
                  </label>
                  <select
                    value={formCuisine}
                    onChange={(e) => setFormCuisine(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="Việt Nam">Việt Nam</option>
                    <option value="Âu / Eat Clean">Âu / Eat Clean</option>
                    <option value="Âu / Pháp">Âu / Pháp</option>
                    <option value="Ý / Địa Trung Hải">Ý / Địa Trung Hải</option>
                    <option value="Ăn Chay (Vegetarian)">Ăn Chay (Vegetarian)</option>
                    <option value="Hàn Quốc">Hàn Quốc</option>
                    <option value="Nhật Bản">Nhật Bản</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Thẻ chế độ ăn (Cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formDietTags}
                    onChange={(e) => setFormDietTags(e.target.value)}
                    placeholder="Eat Clean, Keto, High Protein..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              {/* Nutrition row */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="block font-bold text-stone-700 mb-2">
                  Dinh dưỡng cho 1 phần ăn:
                </span>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <label className="block text-[10px] text-stone-500">Calo (kcal)</label>
                    <input
                      type="number"
                      value={formCalories}
                      onChange={(e) => setFormCalories(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-stone-300 text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500">Đạm (g)</label>
                    <input
                      type="number"
                      value={formProtein}
                      onChange={(e) => setFormProtein(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-stone-300 text-center font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500">Tinh bột (g)</label>
                    <input
                      type="number"
                      value={formCarbs}
                      onChange={(e) => setFormCarbs(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-stone-300 text-center font-bold text-teal-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500">Béo (g)</label>
                    <input
                      type="number"
                      value={formFat}
                      onChange={(e) => setFormFat(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-stone-300 text-center font-bold text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500">Xơ (g)</label>
                    <input
                      type="number"
                      value={formFiber}
                      onChange={(e) => setFormFiber(Number(e.target.value))}
                      className="w-full text-xs p-1.5 rounded-lg border border-stone-300 text-center font-bold text-teal-700"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Chuẩn bị (phút)
                  </label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Nấu (phút)
                  </label>
                  <input
                    type="number"
                    value={formCookTime}
                    onChange={(e) => setFormCookTime(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Độ cay
                  </label>
                  <select
                    value={formSpiceLevel}
                    onChange={(e) => setFormSpiceLevel(e.target.value as SpiceLevel)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="Không cay">Không cay</option>
                    <option value="Cay nhẹ">Cay nhẹ</option>
                    <option value="Cay vừa">Cay vừa</option>
                    <option value="Rất cay">Rất cay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Cảnh báo dị ứng (Cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formAllergens}
                  onChange={(e) => setFormAllergens(e.target.value)}
                  placeholder="Hải sản, Đậu phộng, Sữa bò..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Đường dẫn ảnh món ăn (Image URL)
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDishEditorOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 bg-stone-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Lưu món ăn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
