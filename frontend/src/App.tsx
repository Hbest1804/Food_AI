import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BrowseView } from './components/BrowseView';
import { RecommendationsView } from './components/RecommendationsView';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { AdminPortal } from './components/AdminPortal';
import { DishDetailModal } from './components/DishDetailModal';
import { CookingFocusModeModal } from './components/CookingFocusModeModal';
import { TasteProfileModal } from './components/TasteProfileModal';
import { PersonalDataModal } from './components/PersonalDataModal';
import { FridgeSearchModal } from './components/FridgeSearchModal';
import { AuthPage } from './components/AuthPage';
import { WelcomeIntroModal } from './components/WelcomeIntroModal';
import {
  MessageSquare,
  Sparkles,
  UtensilsCrossed,
  Heart,
  ShieldCheck,
  ChefHat,
  X,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isChatOpen,
    setIsChatOpen,
    isGuest,
    guestQueriesRemaining,
    currentUser,
    setAuthModalType,
    setIsTasteProfileModalOpen,
    setIsFridgeModalOpen,
    isWelcomeIntroOpen,
    setIsWelcomeIntroOpen,
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/60 text-stone-900 selection:bg-amber-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'browse' && <BrowseView />}
        {activeTab === 'recommendations' && <RecommendationsView />}
        {activeTab === 'chat' && (
          <div className="py-6 px-4">
            <ChatbotDrawer isFullPage={true} />
          </div>
        )}
        {activeTab === 'auth' && <AuthPage />}
        {activeTab === 'admin' && currentUser?.role === 'admin' && <AdminPortal />}
        {activeTab === 'admin' && currentUser?.role !== 'admin' && (
          <div className="max-w-md mx-auto my-20 p-8 bg-white border border-stone-200 rounded-3xl text-center shadow-lg">
            <ShieldCheck className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h2 className="font-serif font-bold text-xl text-stone-900 mb-2">
              Khu Vực Quản Trị Hệ Thống
            </h2>
            <p className="text-xs text-stone-600 mb-6">
              Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin) để truy cập bảng điều khiển này.
            </p>
            <button
              onClick={() => {
                setActiveTab('browse');
                setAuthModalType('login');
              }}
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Đăng nhập tài khoản Admin
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom-Right Chatbot Widget (Only when not in fullpage chat or auth) */}
      {activeTab !== 'chat' && activeTab !== 'auth' && (
        <div className="fixed bottom-5 right-5 z-40">
          {isChatOpen ? (
            <div className="animate-in slide-in-from-bottom-5">
              <ChatbotDrawer isFullPage={false} />
            </div>
          ) : (
            <button
              onClick={() => setIsChatOpen(true)}
              className="group p-3.5 bg-gradient-to-tr from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
              title="Hỏi Bếp trưởng AI CulinaAI"
              aria-label="Mở khung chat Bếp trưởng AI"
            >
              <div className="relative">
                <ChefHat className="w-6 h-6" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 border-2 border-amber-600 animate-pulse" />
              </div>
              <span className="hidden sm:inline font-bold text-xs pr-1">
                Hỏi Bếp trưởng AI
              </span>
              {isGuest && (
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                  {guestQueriesRemaining} câu
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Footer (Hidden on Auth Page) */}
      {activeTab !== 'auth' && (
        <footer className="bg-white border-t border-stone-200 mt-16 py-10 text-stone-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-base text-stone-900">
                CulinaAI
              </span>
            </div>
            <p className="text-stone-500 max-w-sm leading-relaxed text-xs">
              Hệ thống trợ lý ẩm thực thông minh tích hợp trí tuệ nhân tạo Gemini, tư vấn công thức nấu nướng, đề xuất thực đơn cá nhân hóa theo khẩu vị, quản lý dinh dưỡng và kiểm soát an toàn dị ứng thực phẩm.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-3">
              Tính năng nổi bật
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="hover:text-amber-800 transition-colors"
                >
                  Tìm kiếm & Lọc món ăn đa chiều
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="hover:text-amber-800 transition-colors"
                >
                  Gợi ý món theo hồ sơ khẩu vị
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsFridgeModalOpen(true)}
                  className="hover:text-amber-800 transition-colors"
                >
                  Tìm món từ tủ lạnh (Chống lãng phí)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsTasteProfileModalOpen(true)}
                  className="hover:text-amber-800 transition-colors"
                >
                  Cài đặt dị ứng & Calo mục tiêu
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-3">
              Chế độ trải nghiệm
            </h4>
            <ul className="space-y-2 text-stone-500">
              <li>• Chế độ Khách: Thử nghiệm không cần đăng ký</li>
              <li>• Chế độ VIP Cá nhân hóa: Ghi nhớ khẩu vị</li>
              <li>• Chế độ Nấu ăn tập trung với Bộ hẹn giờ</li>
              <li>• Quản trị viên: Quản lý món & Giám sát Chatbot</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-stone-400 gap-2">
          <div>
            © 2026 CulinaAI. Bảo lưu mọi quyền. Tích hợp AI Gemini 3.8 Flash.
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            <span>An toàn thực phẩm</span>
            <span>·</span>
            <span>Bảo vệ dữ liệu cá nhân</span>
            <span>·</span>
            <span>Hỗ trợ 24/7</span>
          </div>
        </div>
        </footer>
      )}

      {/* Global Modals */}
      <WelcomeIntroModal
        isOpen={isWelcomeIntroOpen}
        onClose={() => setIsWelcomeIntroOpen(false)}
      />
      <DishDetailModal />
      <CookingFocusModeModal />
      <TasteProfileModal />
      <PersonalDataModal />
      <FridgeSearchModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
