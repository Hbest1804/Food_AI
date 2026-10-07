import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Heart,
  Calendar,
  Flame,
  Download,
  Trash2,
  Check,
  Phone,
  Mail,
  Camera,
  ChefHat,
} from 'lucide-react';
import { DishCard } from './DishCard';

export const PersonalDataModal: React.FC = () => {
  const {
    currentUser,
    isPersonalDataModalOpen,
    setIsPersonalDataModalOpen,
    updateUserProfile,
    dishes,
    deleteMealHistoryItem,
    exportPersonalData,
    setActiveDishModal,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'favorites' | 'history'>('profile');

  // Form profile state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isPersonalDataModalOpen || !currentUser) return null;

  const favoriteDishes = dishes.filter((d) => currentUser.favorites.includes(d.id));

  // Calculate today's consumed calories
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = currentUser.mealHistory.filter((m) => m.date === todayStr);
  const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const targetCalories = currentUser.tasteProfile.targetCalories || 1800;
  const caloriePercent = Math.min(100, Math.round((totalCaloriesToday / targetCalories) * 100));

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(name, avatar, phone);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-2xl object-cover border border-stone-300 shadow-xs"
            />
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900">
                Quản Lý Dữ Liệu Cá Nhân
              </h2>
              <p className="text-xs text-stone-500">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsPersonalDataModalOpen(false)}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-stone-200 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'border-teal-800 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4 text-teal-700" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => setActiveSubTab('favorites')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'favorites'
                ? 'border-teal-800 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Món yêu thích ({favoriteDishes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'border-teal-800 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Nhật ký ẩm thực & Calo</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= PROFILE SUBTAB ================= */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-600/40 shadow-sm"
                  />
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-stone-400" />
                      Đường dẫn ảnh đại diện (Avatar URL)
                    </label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      Email (Cố định)
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 xxx xxx"
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã lưu thành công!</span>
                      </>
                    ) : (
                      <span>Cập nhật thông tin</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={exportPersonalData}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-stone-600" />
                    <span>Xuất dữ liệu cá nhân (JSON)</span>
                  </button>
                </div>
              </form>

              {/* Data Rights Notice */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 leading-relaxed">
                <span className="font-bold text-stone-900 block mb-1">
                  Quyền riêng tư & Quản lý dữ liệu người dùng
                </span>
                Toàn bộ dữ liệu khẩu vị, danh sách dị ứng và nhật ký bữa ăn của bạn được mã hóa an toàn và chỉ sử dụng để phục vụ trải nghiệm ẩm thực của riêng bạn. Bạn có thể xuất bản sao dữ liệu JSON bất cứ lúc nào.
              </div>
            </div>
          )}

          {/* ================= FAVORITES SUBTAB ================= */}
          {activeSubTab === 'favorites' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Món ăn bạn đã lưu ({favoriteDishes.length})
                </h3>
              </div>

              {favoriteDishes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteDishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
                  Bạn chưa lưu món ăn nào. Nhấn vào biểu tượng trái tim trên các món ăn để thêm vào bộ sưu tập nhé!
                </div>
              )}
            </div>
          )}

          {/* ================= HISTORY & CALORIE SUBTAB ================= */}
          {activeSubTab === 'history' && (
            <div className="space-y-6">
              {/* Daily Calorie Progress Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-teal-700" />
                    <span className="font-serif font-bold text-sm sm:text-base text-stone-900">
                      Năng lượng nạp hôm nay: {totalCaloriesToday} / {targetCalories} kcal
                    </span>
                  </div>
                  <span className="text-xs font-bold text-teal-900">
                    {caloriePercent}% mục tiêu
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      caloriePercent > 100
                        ? 'bg-rose-500'
                        : 'bg-teal-700'
                    }`}
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>

                <div className="text-[11px] text-stone-500 mt-2 flex justify-between">
                  <span>Hôm nay bạn đã hoàn thành {todayMeals.length} bữa ăn.</span>
                  <span>{Math.max(0, targetCalories - totalCaloriesToday)} kcal còn lại</span>
                </div>
              </div>

              {/* Cooked History list */}
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 mb-3">
                  Lịch sử các món đã nấu ({currentUser.mealHistory.length})
                </h3>

                {currentUser.mealHistory.length > 0 ? (
                  <div className="space-y-2.5">
                    {currentUser.mealHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-3 hover:border-teal-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.dishImage}
                            alt={item.dishName}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div>
                            <h4
                              onClick={() => {
                                const found = dishes.find((d) => d.id === item.dishId);
                                if (found) setActiveDishModal(found);
                              }}
                              className="font-bold text-xs sm:text-sm text-stone-900 hover:text-teal-800 cursor-pointer line-clamp-1"
                            >
                              {item.dishName}
                            </h4>
                            <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                              <span>Bữa {item.mealType}</span>
                              <span>·</span>
                              <span>{item.date}</span>
                              <span>·</span>
                              <span className="font-bold text-teal-900">
                                +{item.calories} kcal
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteMealHistoryItem(item.id)}
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Xóa khỏi nhật ký"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
                    Chưa có món nào được ghi nhận. Khi bạn bấm &quot;Hoàn thành món ăn&quot; trong Chế độ Nấu ăn, món sẽ tự động xuất hiện tại đây!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={() => setIsPersonalDataModalOpen(false)}
            className="px-5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-xl border border-stone-300 transition-colors"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
