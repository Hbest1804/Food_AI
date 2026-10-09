import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UtensilsCrossed,
  Eye,
  EyeOff,
  ChefHat,
  Leaf,
  Heart,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const {
    authModalType,
    setAuthModalType,
    setActiveTab,
    login,
    register,
    resetPassword,
    authLoading,
    authError,
    setAuthError,
  } = useApp();

  // Mode: 'login' | 'register' | 'forgot'
  const mode = authModalType || 'login';

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDiet, setRegDiet] = useState('Eat Clean');
  const [regAllergies, setRegAllergies] = useState<string[]>([]);

  // Forgot password flow state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const success = await login(loginEmail, loginPassword);
    if (success) {
      setActiveTab('browse');
    }
    // authError được set bởi context nếu thất bại
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (regPassword !== regConfirmPassword) {
      setAuthError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    const success = await register(regName, regEmail, regPassword, regPhone, {
      diet: regDiet,
      allergies: regAllergies,
    });

    if (success) {
      setActiveTab('browse');
    }
    // authError được set bởi context nếu thất bại
  };

  // Handle Forgot Step 1
  const handleForgotStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.includes('@')) {
      setForgotError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setMockOtp(generated);
    setForgotStep(2);
  };

  // Handle Forgot Step 2
  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (enteredOtp.trim() !== mockOtp) {
      setForgotError('Mã OTP không chính xác. Hãy nhập mã hiển thị bên dưới.');
      return;
    }
    setForgotStep(3);
  };

  // Handle Forgot Step 3
  const handleForgotStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới cần tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setForgotError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    resetPassword(forgotEmail, newPassword);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setForgotStep(1);
      setAuthModalType('login');
      setLoginEmail(forgotEmail);
    }, 1500);
  };

  const toggleAllergy = (allergy: string) => {
    setRegAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const ALLERGY_OPTIONS = [
    'Hải sản',
    'Đậu phộng',
    'Sữa bò',
    'Trứng gà',
    'Gluten / Bột mì',
    'Đậu nành',
    'Mè (Vừng)',
    'Hạt điều / Hạnh nhân',
  ];

  const DIET_OPTIONS = [
    'Eat Clean',
    'Keto / Low-Carb',
    'Ăn Chay (Vegetarian)',
    'Chay Trường (Vegan)',
    'Địa Trung Hải',
    'Bình Thường (Đa Dạng)',
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
        
        {/* ================= LEFT COLUMN: CULINARY BRANDING & BENEFITS ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-lg">
                <UtensilsCrossed className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-white block">
                  CulinaAI
                </span>
                <span className="text-xs text-emerald-300 font-medium">
                  Trợ Lý Ẩm Thực Thông Minh
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/80 border border-teal-500/30 text-xs font-semibold text-emerald-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cá Nhân Hóa Bữa Cơm Mỗi Ngày</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug mb-4">
              Khởi đầu hành trình ăn ngon & sống khỏe
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Đăng nhập để CulinaAI tự động nhớ hồ sơ dị ứng của gia đình bạn, tính toán calo chuẩn xác theo từng bữa và khai thác tủ lạnh thông minh.
            </p>
          </div>

          {/* Benefits Feature Checklist */}
          <div className="relative z-10 my-8 space-y-4 pt-6 border-t border-teal-800/40">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-teal-800/80 border border-teal-500/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">An Toàn Tuyệt Đối Về Dị Ứng</h4>
                <p className="text-[11px] sm:text-xs text-slate-300">Cảnh báo và tự động loại bỏ mọi nguyên liệu kiêng cữ.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-teal-800/80 border border-teal-500/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Trợ Lý Bếp Trưởng Gemini 24/7</h4>
                <p className="text-[11px] sm:text-xs text-slate-300">Hỏi đáp công thức, mẹo canh lửa và biến tấu đồ thừa.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-teal-800/80 border border-teal-500/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Cân Bằng Dinh Dưỡng Chuẩn Macro</h4>
                <p className="text-[11px] sm:text-xs text-slate-300">Kiểm soát calo, đạm, tinh bột và chất béo theo thể trạng.</p>
              </div>
            </div>
          </div>

          {/* Bottom Card Summary */}
          <div className="relative z-10 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hơn <strong>50+ công thức</strong> dinh dưỡng đã sẵn sàng</span>
            </div>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTERACTIVE AUTH FORMS ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Top Navigation Bar: Back to Home + Mode Switcher */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 flex-wrap gap-3">
              <button
                onClick={() => {
                  setAuthModalType(null);
                  setActiveTab('browse');
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-800 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại trang chủ</span>
              </button>

              {/* Segmented Switcher for Login / Register */}
              {mode !== 'forgot' && (
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
                  <button
                    onClick={() => {
                      setAuthModalType('login');
                      setAuthError(null);
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-white text-teal-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalType('register');
                      setAuthError(null);
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      mode === 'register'
                        ? 'bg-white text-teal-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Đăng ký mới
                  </button>
                </div>
              )}
            </div>

            {/* =================== FORM 1: LOGIN =================== */}
            {mode === 'login' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Đăng nhập tài khoản
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Nhập thông tin tài khoản của bạn để tiếp tục trải nghiệm.
                  </p>
                </div>

                {authError && mode === 'login' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="nam.nguyen@example.com"
                        required
                        className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                        Mật khẩu
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalType('forgot');
                          setForgotStep(1);
                        }}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold hover:underline cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-teal-900/20 hover:scale-[1.01] disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {authLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Đang đăng nhập...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng nhập vào CulinaAI</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* =================== FORM 2: REGISTER =================== */}
            {mode === 'register' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Đăng ký tài khoản thành viên
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tạo tài khoản để cá nhân hóa khẩu vị và dinh dưỡng cho gia đình bạn.
                  </p>
                </div>

                {authError && mode === 'register' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Họ và tên *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Ví dụ: Lê Minh Trí"
                          required
                          className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                      Địa chỉ Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="minhtri@example.com"
                        required
                        className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Mật khẩu *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          required
                          className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Xác nhận mật khẩu *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          required
                          className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Initial Taste Profile Section */}
                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3 pt-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-teal-900">
                      <Sliders className="w-4 h-4 text-teal-700" />
                      <span>Thiết lập khẩu vị & An toàn ăn uống ban đầu</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Chế độ ăn ưa thích
                      </label>
                      <select
                        value={regDiet}
                        onChange={(e) => setRegDiet(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                      >
                        {DIET_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Dị ứng thực phẩm (Bắt buộc tránh nếu có):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALLERGY_OPTIONS.map((item) => {
                          const isSelected = regAllergies.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleAllergy(item)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isSelected ? `✕ ${item}` : `+ ${item}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-teal-900/20 hover:scale-[1.01] disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {authLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>Đang đăng ký...</span>
                      </>
                    ) : (
                      <>
                        <span>Hoàn tất đăng ký & Bắt đầu</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* =================== FORM 3: FORGOT PASSWORD =================== */}
            {mode === 'forgot' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Khôi phục mật khẩu
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {forgotStep === 1 && 'Nhập email tài khoản của bạn để nhận mã xác minh OTP.'}
                    {forgotStep === 2 && 'Nhập mã OTP 6 số đã được gửi tới email của bạn.'}
                    {forgotStep === 3 && 'Tạo mật khẩu mới cho tài khoản.'}
                  </p>
                </div>

                {resetSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 font-bold animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Đổi mật khẩu thành công! Đang chuyển hướng sang đăng nhập...</span>
                  </div>
                )}

                {forgotError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* Step 1: Input Email */}
                {forgotStep === 1 && (
                  <form onSubmit={handleForgotStep1} className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Email đã đăng ký
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="nam.nguyen@example.com"
                          required
                          className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Gửi mã xác thực OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Step 2: Input OTP */}
                {forgotStep === 2 && (
                  <form onSubmit={handleForgotStep2} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
                      Mã OTP giả lập cho phiên này là: <strong className="text-base text-teal-800 tracking-wider ml-1">{mockOtp}</strong>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Nhập mã OTP 6 số
                      </label>
                      <input
                        type="text"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                        className="w-full text-center text-lg font-bold tracking-widest py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer"
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                      >
                        Xác nhận mã
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: Set New Password */}
                {forgotStep === 3 && (
                  <form onSubmit={handleForgotStep3} className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          required
                          className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={newPasswordConfirm}
                          onChange={(e) => setNewPasswordConfirm(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          required
                          className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Lưu mật khẩu mới</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalType('login');
                      setForgotStep(1);
                    }}
                    className="text-xs sm:text-sm text-teal-800 hover:underline font-bold cursor-pointer"
                  >
                    ← Quay lại Đăng nhập
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer note inside form */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật Dinh dưỡng của CulinaAI.
          </div>
        </div>

      </div>
    </div>
  );
};
