import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UtensilsCrossed,
  Sparkles,
  MessageSquare,
  Refrigerator,
  ShieldCheck,
  User as UserIcon,
  Heart,
  LogOut,
  Sliders,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    isGuest,
    guestQueriesRemaining,
    logout,
    switchAccount,
    setAuthModalType,
    setIsTasteProfileModalOpen,
    setIsPersonalDataModalOpen,
    setIsFridgeModalOpen,
    setIsWelcomeIntroOpen,
    activeTab,
    setActiveTab,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand with Calm Poised Sage/Teal */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('browse')}
              className="flex items-center gap-3 text-left group focus:outline-hidden cursor-pointer"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-800 via-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/15 group-hover:scale-105 transition-all duration-300">
                  <UtensilsCrossed className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                {/* Subtle calm pulse dot */}
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
              </div>

              <div>
                <span className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors">
                  Culina<span className="text-teal-700 font-extrabold">AI</span>
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Trợ Lý Ẩm Thực Tinh Hoa
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5 ml-2">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                Khám phá món ăn
              </button>

              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'recommendations'
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeTab === 'recommendations' ? 'text-emerald-300' : 'text-teal-600'}`} />
                <span>Gợi ý cho bạn</span>
              </button>

              <button
                onClick={() => setIsFridgeModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-800 hover:bg-teal-50/60 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Refrigerator className="w-4 h-4 text-teal-700" />
                <span>Tủ lạnh thông minh</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span>Trợ lý AI</span>
                {isGuest && (
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-bold border border-slate-200">
                    {guestQueriesRemaining}
                  </span>
                )}
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-purple-800 text-white shadow-sm'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Quản trị hệ thống</span>
                </button>
              )}

              <button
                onClick={() => setIsWelcomeIntroOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-800 hover:bg-teal-50/80 transition-all flex items-center gap-1.5 border border-teal-200/80 cursor-pointer"
                title="Xem lại đoạn giới thiệu chào mừng CulinaAI"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Giới thiệu</span>
              </button>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsDemoSwitcherOpen(!isDemoSwitcherOpen)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Chuyển nhanh tài khoản để kiểm tra các vai trò và quyền"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>
                  {currentUser
                    ? currentUser.role === 'admin'
                      ? '🛡️ Admin'
                      : '👤 User mẫu'
                    : '👀 Khách'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDemoSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Chuyển đổi tài khoản trải nghiệm
                  </div>
                  <button
                    onClick={() => {
                      switchAccount('user-1');
                      setIsDemoSwitcherOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-teal-50/60 flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900">Nguyễn Hoàng Nam</div>
                      <div className="text-[11px] text-slate-500">Eat Clean · Dị ứng Đậu phộng</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">User</span>
                  </button>
                  <button
                    onClick={() => {
                      switchAccount('user-admin');
                      setIsDemoSwitcherOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-purple-50/60 flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900">Trần Thu Hà</div>
                      <div className="text-[11px] text-slate-500">Quản trị viên & Bếp trưởng</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">Admin</span>
                  </button>
                  <button
                    onClick={() => {
                      switchAccount('user-2');
                      setIsDemoSwitcherOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-emerald-50/60 flex items-center justify-between text-slate-800 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900">Lê Phương Thảo</div>
                      <div className="text-[11px] text-slate-500">Ăn chay · Dị ứng Hải sản</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">User</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      switchAccount('guest');
                      setIsDemoSwitcherOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <span>👀 Chế độ Khách (Giới hạn thử nghiệm)</span>
                  </button>
                </div>
              )}
            </div>

            {/* If Logged In: Taste Profile Shortcut & User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Taste Profile Badge Button with Calm Sage Tone */}
                <button
                  onClick={() => setIsTasteProfileModalOpen(true)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-teal-200/80 bg-teal-50/70 text-teal-950 hover:bg-teal-100/70 transition-all cursor-pointer"
                  title="Chỉnh sửa hồ sơ khẩu vị cá nhân"
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-700" />
                  <span className="font-bold">{currentUser.tasteProfile.diet}</span>
                  <span className="text-teal-400">·</span>
                  <span className="text-slate-600 font-medium">{currentUser.tasteProfile.targetCalories} kcal</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100/70 transition-colors focus:outline-hidden cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-600/30"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="hidden sm:block text-left text-xs leading-tight">
                      <div className="font-bold text-slate-900 line-clamp-1">{currentUser.name}</div>
                      <div className="text-[11px] text-teal-700 font-medium">
                        {currentUser.role === 'admin' ? '🛡️ Quản trị' : 'Thành viên'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                        <div className="font-bold text-sm text-slate-900">{currentUser.name}</div>
                        <div className="text-xs text-slate-500">{currentUser.email}</div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsTasteProfileModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Sliders className="w-4 h-4 text-teal-600" />
                          <span>Hồ sơ khẩu vị & Dinh dưỡng</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsPersonalDataModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-slate-600" />
                          <span>Thông tin & Nhật ký cá nhân</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsPersonalDataModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>Món yêu thích ({currentUser.favorites.length})</span>
                        </button>

                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => {
                              setActiveTab('admin');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs sm:text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            <span>Bảng quản trị hệ thống</span>
                          </button>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* If Guest: Login & Register CTA */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModalType('login')}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50/70 rounded-xl transition-colors cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setAuthModalType('register')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
