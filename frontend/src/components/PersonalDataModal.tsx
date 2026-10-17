import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Upload,
  Sliders,
  Lock,
  KeyRound,
  ShieldAlert,
  AlertCircle,
  MessageSquareOff,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { DishCard } from './DishCard';
import { myProfileApi } from '../api/adminApi';
import { engagementApi } from '../api/engagementApi';

export const PersonalDataModal: React.FC = () => {
  const {
    currentUser,
    isPersonalDataModalOpen,
    setIsPersonalDataModalOpen,
    setIsTasteProfileModalOpen,
    updateUserProfile,
    dishes,
    deleteMealHistoryItem,
    exportPersonalData,
    setActiveDishModal,
    logout,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'favorites' | 'history' | 'security'>('profile');

  // Form profile state
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Clear chat history state
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [chatClearSuccess, setChatClearSuccess] = useState(false);

  // Favorites state loaded from API
  const [apiFavorites, setApiFavorites] = useState<any[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // Sync profile fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Load real favorites from API when switching to favorites tab
  const fetchFavorites = useCallback(async () => {
    setIsLoadingFavorites(true);
    try {
      const res = await myProfileApi.getFavorites(1, 50);
      if (res.success && res.data) {
        setApiFavorites(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách yêu thích từ API:', err);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    if (isPersonalDataModalOpen && activeSubTab === 'favorites') {
      fetchFavorites();
    }
  }, [isPersonalDataModalOpen, activeSubTab, fetchFavorites]);

  if (!isPersonalDataModalOpen || !currentUser) return null;

  // Meal history
  const userMealHistory = currentUser.mealHistory || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = userMealHistory.filter((m) => m.date === todayStr);
  const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const targetCalories = currentUser.tasteProfile?.targetCalories || 1800;
  const caloriePercent = Math.min(100, Math.round((totalCaloriesToday / targetCalories) * 100));

  // 1. Cập nhật hồ sơ (UC10)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      // Gọi API backend PUT /api/me/profile
      const res = await myProfileApi.updateProfile(name);
      if (res.success) {
        // Cập nhật context local
        updateUserProfile(name, avatar, phone);
        setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        setTimeout(() => setProfileMessage(null), 3500);
      } else {
        setProfileMessage({ type: 'error', text: 'Không thể cập nhật hồ sơ.' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Lỗi cập nhật hồ sơ.';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Tải ảnh đại diện trực tiếp từ máy tính lên Supabase Storage (UC10 - Mục 5.6.1)
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng ảnh
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setProfileMessage({
        type: 'error',
        text: 'Định dạng ảnh không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.',
      });
      return;
    }

    // Kiểm tra dung lượng (tối đa 2 MB theo đặc tả)
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({
        type: 'error',
        text: 'Dung lượng ảnh vượt quá 2 MB. Vui lòng chọn tệp nhỏ hơn.',
      });
      return;
    }

    setIsUploadingAvatar(true);
    setProfileMessage(null);

    try {
      const res = await myProfileApi.uploadAvatar(file);
      if (res.success && res.data?.avatar_url) {
        const newUrl = res.data.avatar_url;
        setAvatar(newUrl);
        updateUserProfile(name || currentUser.name, newUrl, phone || currentUser.phone);
        setProfileMessage({
          type: 'success',
          text: 'Tải ảnh đại diện từ máy tính lên thành công!',
        });
        setTimeout(() => setProfileMessage(null), 3500);
      } else {
        setProfileMessage({
          type: 'error',
          text: 'Tải ảnh đại diện thất bại. Vui lòng thử lại.',
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Lỗi khi tải ảnh lên kho lưu trữ.';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 2. Đổi mật khẩu (UC10)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await myProfileApi.changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordMessage(null), 4000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Không thể đổi mật khẩu.';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 3. Xóa lịch sử chat cá nhân (UC10)
  const handleClearChatHistory = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện AI? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsClearingChat(true);
    try {
      const res = await myProfileApi.deleteChatHistory();
      if (res.success) {
        setChatClearSuccess(true);
        setTimeout(() => setChatClearSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể xóa lịch sử chat.');
    } finally {
      setIsClearingChat(false);
    }
  };

  // 4. Xóa tài khoản cá nhân (UC10)
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('Vui lòng nhập mật khẩu xác nhận.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await myProfileApi.deleteAccount(deletePassword);
      if (res.success) {
        alert('Tài khoản của bạn đã được xóa vĩnh viễn.');
        setIsPersonalDataModalOpen(false);
        await logout();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Không thể xóa tài khoản. Vui lòng kiểm tra lại mật khẩu.';
      setDeleteError(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // 5. Bỏ yêu thích một món trong danh sách favorites
  const handleRemoveFavorite = async (dishId: string) => {
    try {
      await engagementApi.removeFavorite(dishId);
      setApiFavorites((prev) => prev.filter((f) => f.dish_id !== dishId));
    } catch (err) {
      console.warn('Lỗi bỏ yêu thích:', err);
    }
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
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-stone-200 flex gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
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
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'favorites'
                ? 'border-teal-800 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Món yêu thích ({apiFavorites.length || currentUser.favorites?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'history'
                ? 'border-teal-800 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Nhật ký ẩm thực & Calo</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSubTab === 'security'
                ? 'border-teal-800 text-teal-950 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Bảo mật & Quyền riêng tư</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= PROFILE SUBTAB ================= */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6">
              {profileMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="relative group shrink-0">
                    <img
                      src={avatar || currentUser.avatar}
                      alt={name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-600/40 shadow-md"
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin mb-1 text-teal-400" />
                        <span className="text-[10px] font-medium">Đang tải...</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      title="Chọn ảnh từ máy tính"
                      className="absolute -bottom-1 -right-1 p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-all hover:scale-110 disabled:opacity-50 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h4 className="text-xs font-bold text-stone-800 mb-1 flex items-center justify-center sm:justify-start gap-1">
                      <Camera className="w-3.5 h-3.5 text-teal-600" />
                      Ảnh đại diện tài khoản
                    </h4>
                    <p className="text-[11px] text-stone-500 mb-2.5">
                      Hỗ trợ JPG, PNG, WEBP (tối đa 2 MB). Tải trực tiếp từ máy tính của bạn lên Supabase Storage.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-100/70 hover:bg-teal-100 border border-teal-300 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Đang tải lên...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Chọn ảnh từ máy tính
                          </>
                        )}
                      </button>
                      {avatar && (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã kết nối ảnh
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Họ và tên hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      Email (Không thể thay đổi)
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
                    disabled={isUpdatingProfile}
                    className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Cập nhật thông tin</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={exportPersonalData}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-stone-600" />
                    <span>Xuất dữ liệu cá nhân (JSON)</span>
                  </button>
                </div>
              </form>

              {/* Shortcut to Taste Profile */}
              <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-xs flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-teal-950 block">
                    Hồ sơ khẩu vị & Sở thích ẩm thực
                  </span>
                  <span className="text-teal-700 text-[11px]">
                    Cài đặt vùng miền, chế độ ăn, dị ứng thực phẩm, độ cay/mặn/ngọt, ngân sách mỗi bữa.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPersonalDataModalOpen(false);
                    setIsTasteProfileModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Mở khẩu vị</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= FAVORITES SUBTAB ================= */}
          {activeSubTab === 'favorites' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Món ăn bạn đã lưu ({apiFavorites.length})
                </h3>
              </div>

              {isLoadingFavorites ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                  <span className="text-xs">Đang tải danh sách món yêu thích...</span>
                </div>
              ) : apiFavorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {apiFavorites.map((fav) => {
                    const dish = fav.dish;
                    if (!dish) return null;
                    const matchedDish = dishes.find((d) => d.id === fav.dish_id);

                    return (
                      <div
                        key={fav.dish_id}
                        className="bg-stone-50 rounded-2xl border border-stone-200 p-3 flex gap-3 hover:border-teal-300 transition-colors group relative"
                      >
                        <img
                          src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'}
                          alt={dish.name}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 cursor-pointer"
                          onClick={() => {
                            if (matchedDish) setActiveDishModal(matchedDish);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4
                            onClick={() => {
                              if (matchedDish) setActiveDishModal(matchedDish);
                            }}
                            className="font-bold text-xs sm:text-sm text-stone-900 hover:text-teal-800 cursor-pointer line-clamp-1"
                          >
                            {dish.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 mt-1">
                            {dish.category?.name || 'Món ăn'} · {dish.calories ? `${dish.calories} kcal` : 'N/A'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {matchedDish && (
                              <button
                                onClick={() => setActiveDishModal(matchedDish)}
                                className="text-[11px] text-teal-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <span>Xem chi tiết</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFavorite(fav.dish_id)}
                          className="absolute top-2.5 right-2.5 p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Bỏ lưu món này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
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
                      caloriePercent > 100 ? 'bg-rose-500' : 'bg-teal-700'
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
                  Lịch sử các món đã nấu ({userMealHistory.length})
                </h3>

                {userMealHistory.length > 0 ? (
                  <div className="space-y-2.5">
                    {userMealHistory.map((item) => (
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
                          className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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

          {/* ================= SECURITY & PRIVACY SUBTAB (UC10) ================= */}
          {activeSubTab === 'security' && (
            <div className="space-y-6">
              {/* Đổi mật khẩu */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Đổi mật khẩu tài khoản
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Mật khẩu mới yêu cầu tối thiểu 8 ký tự
                    </p>
                  </div>
                </div>

                {passwordMessage && (
                  <div
                    className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      passwordMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {passwordMessage.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Tối thiểu 8 ký tự"
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Cập nhật mật khẩu</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Quản lý dữ liệu hội thoại AI */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                    <MessageSquareOff className="w-4 h-4 text-stone-600" />
                    Lịch sử trò chuyện với AI
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Xóa sạch toàn bộ các đoạn hội thoại tư vấn và gợi ý món ăn với Trợ lý AI.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClearChatHistory}
                  disabled={isClearingChat}
                  className="px-4 py-2 bg-stone-200 hover:bg-rose-100 hover:text-rose-700 text-stone-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isClearingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : chatClearSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Đã xóa xong!</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa lịch sử chat</span>
                    </>
                  )}
                </button>
              </div>

              {/* Vùng nguy hiểm: Xóa tài khoản */}
              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-serif font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Khu vực nguy hiểm – Xóa tài khoản</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Khi bạn xóa tài khoản, toàn bộ hồ sơ cá nhân, lịch sử nấu ăn, khẩu vị và món ăn yêu thích sẽ bị xóa vĩnh viễn và không thể khôi phục.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Tôi muốn xóa tài khoản này
                  </button>
                ) : (
                  <form onSubmit={handleDeleteAccount} className="space-y-3 pt-2">
                    {deleteError && (
                      <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{deleteError}</span>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-rose-900 mb-1">
                        Nhập mật khẩu hiện tại để xác nhận:
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        required
                        placeholder="Mật khẩu của bạn"
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-rose-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isDeletingAccount}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang xóa...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Xác nhận xóa vĩnh viễn</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                          setDeleteError(null);
                        }}
                        className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={() => setIsPersonalDataModalOpen(false)}
            className="px-5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-xl border border-stone-300 transition-colors cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
