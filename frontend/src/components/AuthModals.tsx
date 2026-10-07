import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  UtensilsCrossed,
} from 'lucide-react';

export const AuthModals: React.FC = () => {
  const {
    authModalType,
    setAuthModalType,
    login,
    register,
    resetPassword,
    switchAccount,
  } = useApp();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDiet, setRegDiet] = useState('Eat Clean');
  const [regAllergies, setRegAllergies] = useState<string[]>([]);
  const [regError, setRegError] = useState('');

  // Forgot password flow state (Step 1 -> Step 2 -> Step 3)
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!authModalType) return null;

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = login(loginEmail, loginPassword);
    if (!success) {
      setLoginError('Email hoặc mật khẩu không chính xác. Bạn có thể dùng tính năng Đăng nhập nhanh bên dưới.');
    }
  };

  // Register handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    const success = register(regName, regEmail, regPassword, regPhone, {
      diet: regDiet,
      allergies: regAllergies,
    });

    if (!success) {
      setRegError('Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.');
    }
  };

  // Forgot password handler
  const handleForgotStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.includes('@')) {
      setForgotError('Vui lòng nhập email hợp lệ');
      return;
    }
    // Generate a 6-digit verification code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setMockOtp(generated);
    setForgotStep(2);
  };

  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (enteredOtp.trim() !== mockOtp) {
      setForgotError('Mã OTP không chính xác. Hãy nhập mã hiển thị bên dưới.');
      return;
    }
    setForgotStep(3);
  };

  const handleForgotStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (newPassword.length < 6) {
      setForgotError('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setForgotError('Xác nhận mật khẩu mới không khớp');
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-800 to-emerald-700 text-white flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                {authModalType === 'login' && 'Đăng nhập tài khoản'}
                {authModalType === 'register' && 'Đăng ký tài khoản mới'}
                {authModalType === 'forgot' && 'Khôi phục mật khẩu'}
              </h2>
              <p className="text-xs text-stone-500">
                CulinaAI - Trợ lý ẩm thực & dinh dưỡng cá nhân
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthModalType(null)}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================== LOGIN VIEW ===================== */}
        {authModalType === 'login' && (
          <div className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="vidu@culinary.ai"
                    required
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthModalType('forgot')}
                    className="text-[11px] text-teal-700 hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Accounts */}
            <div className="pt-3 border-t border-stone-100">
              <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider text-center mb-2">
                Hoặc đăng nhập nhanh bằng tài khoản mẫu
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    login('user@culinary.ai');
                  }}
                  className="p-2 text-xs text-left rounded-xl bg-teal-50/80 hover:bg-teal-100/80 border border-teal-200 text-teal-950 transition-colors"
                >
                  <div className="font-bold">👤 User mẫu</div>
                  <div className="text-[10px] text-teal-700">user@culinary.ai</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    login('admin@culinary.ai');
                  }}
                  className="p-2 text-xs text-left rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-purple-900 transition-colors"
                >
                  <div className="font-bold">🛡️ Admin Bếp trưởng</div>
                  <div className="text-[10px] text-purple-700">admin@culinary.ai</div>
                </button>
              </div>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    switchAccount('guest');
                    setAuthModalType(null);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-800 underline"
                >
                  Tiếp tục trải nghiệm ở Chế độ Khách (vãng lai)
                </button>
              </div>
            </div>

            {/* Switch to Register */}
            <div className="pt-2 text-center text-xs text-stone-600">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setAuthModalType('register')}
                className="font-bold text-teal-800 hover:underline"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        )}

        {/* ===================== REGISTER VIEW ===================== */}
        {authModalType === 'register' && (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Họ và tên của bạn
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@cuaban.com"
                    required
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Số điện thoại (tùy chọn)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0912 xxx xxx"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              {/* Initial taste setup right on registration */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200">
                <span className="block text-xs font-bold text-teal-950 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  Khởi tạo nhanh hồ sơ khẩu vị của bạn:
                </span>

                <div className="mb-2">
                  <label className="block text-[11px] text-stone-600 font-medium mb-1">
                    Chế độ ăn ưa thích:
                  </label>
                  <select
                    value={regDiet}
                    onChange={(e) => setRegDiet(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Eat Clean">Eat Clean / Healthy</option>
                    <option value="Ăn chay">Ăn chay (Vegetarian)</option>
                    <option value="Thuần chay">Thuần chay (Vegan)</option>
                    <option value="Keto / Low-Carb">Keto / Low-Carb</option>
                    <option value="Tăng cơ (High Protein)">Tăng cơ (High Protein)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 font-medium mb-1">
                    Dị ứng thực phẩm nếu có:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Hải sản', 'Đậu phộng', 'Sữa bò', 'Gluten', 'Trứng'].map((alg) => {
                      const isSelected = regAllergies.includes(alg);
                      return (
                        <button
                          key={alg}
                          type="button"
                          onClick={() => {
                            setRegAllergies((prev) =>
                              isSelected ? prev.filter((a) => a !== alg) : [...prev, alg]
                            );
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-stone-700 border-stone-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {alg}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Tạo tài khoản & Bắt đầu</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-stone-600">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setAuthModalType('login')}
                className="font-bold text-teal-800 hover:underline"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )}

        {/* ===================== FORGOT PASSWORD VIEW ===================== */}
        {authModalType === 'forgot' && (
          <div className="p-6 space-y-4">
            {/* Step progress pills */}
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-2">
              <span className={forgotStep === 1 ? 'font-bold text-teal-800' : ''}>
                1. Nhập Email
              </span>
              <span>→</span>
              <span className={forgotStep === 2 ? 'font-bold text-teal-800' : ''}>
                2. Xác thực OTP
              </span>
              <span>→</span>
              <span className={forgotStep === 3 ? 'font-bold text-teal-800' : ''}>
                3. Đặt lại Mật khẩu
              </span>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {forgotError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mật khẩu đã được khôi phục thành công! Đang chuyển hướng...</span>
              </div>
            )}

            {/* Step 1: Input Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1} className="space-y-3.5">
                <p className="text-xs text-stone-600">
                  Nhập địa chỉ email tài khoản đã đăng ký để nhận mã xác thực bảo mật khôi phục mật khẩu.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email tài khoản
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="user@culinary.ai"
                      required
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Gửi mã xác thực OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2: Input OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2} className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-300 text-xs text-teal-950">
                  <div className="font-bold mb-1">Mã OTP bảo mật được tạo cho {forgotEmail}:</div>
                  <div className="font-mono text-xl font-bold tracking-widest text-teal-900">
                    {mockOtp}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    (Mã này thông thường gửi về hòm thư, tại đây hiển thị trực tiếp để bạn thử nghiệm tiện lợi)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nhập mã xác thực 6 số
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      placeholder="Nhập 6 số..."
                      required
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-mono tracking-widest"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all"
                  >
                    Xác nhận mã OTP
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Enter new password */}
            {forgotStep === 3 && (
              <form onSubmit={handleForgotStep3} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lưu mật khẩu mới & Đăng nhập</span>
                </button>
              </form>
            )}

            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setAuthModalType('login')}
                className="text-stone-500 hover:text-stone-800"
              >
                Nhớ mật khẩu? Quay về Đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
