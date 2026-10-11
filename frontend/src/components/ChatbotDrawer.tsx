import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import { apiSendGuestMessage } from '../api/chatApi';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  AlertCircle,
  X,
  ChefHat,
  RotateCcw,
  Clock,
  Flame,
  ArrowRight,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface ChatbotDrawerProps {
  isFullPage?: boolean;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({ isFullPage = false }) => {
  const {
    currentUser,
    isGuest,
    guestQueriesRemaining,
    setGuestQueriesRemaining,
    setAuthModalType,
    logChatQuery,
    updateChatFeedback,
    setIsChatOpen,
    chatPendingPrompt,
    setChatPendingPrompt,
    chatPendingFridge,
    setChatPendingFridge,
    openDishDetail,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: isGuest
        ? `Chào bạn! Tôi là **CulinaAI** - Trợ lý Ẩm thực Tinh hoa 👨‍🍳🌿\n\nBạn đang ở **Chế độ Khách** (còn **${guestQueriesRemaining}** lượt hỏi thử nghiệm). Bạn có thể hỏi tôi bất kỳ công thức nấu ăn, mẹo làm bếp hoặc cách sơ chế món ngon từ nguyên liệu trong tủ lạnh!`
        : `Chào **${currentUser?.name}**! Bếp trưởng **CulinaAI** rất vui được đồng hành cùng bạn theo chế độ **${currentUser?.tasteProfile?.diet || 'Lành mạnh'}** 🍲🌿\n\nHôm nay bạn muốn nấu món gì hay cần gợi ý thực đơn phù hợp mục tiêu **${currentUser?.tasteProfile?.targetCalories || 1800} kcal**?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (chatPendingPrompt) {
      const prompt = chatPendingPrompt;
      setChatPendingPrompt('');
      handleSendMessage(prompt);
    }
  }, [chatPendingPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    // Kiểm tra nhanh hạn mức khách
    if (isGuest && guestQueriesRemaining <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: `limit-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ **Bạn đã sử dụng hết hạn mức lượt hỏi ở Chế độ Khách.**\n\nHãy đăng ký tài khoản miễn phí hoặc đăng nhập để tiếp tục trò chuyện không giới hạn, lưu giữ hồ sơ dị ứng và cá nhân hóa thực đơn!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setLastFailedQuery(null);

    const startTime = Date.now();

    try {
      // ── Gọi API Chế độ khách (Mục 4.4.1) ─────────────────────────────────
      const fridgeData = chatPendingFridge || undefined;
      // Dọn fridge context sau khi sử dụng
      if (chatPendingFridge) {
        setChatPendingFridge(null);
      }

      const res = await apiSendGuestMessage({
        content: query,
        fridge: fridgeData,
      });

      const latencyMs = Date.now() - startTime;
      const { reply, quota } = res.data;

      // Cập nhật quota trả về từ server
      if (quota && typeof quota.remaining === 'number') {
        setGuestQueriesRemaining(quota.remaining);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply.content,
        replyType: reply.type,
        dishes: reply.dishes || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Phân loại chủ đề cho nhật ký hội thoại
      let topic: 'Dinh dưỡng' | 'Tủ lạnh' | 'Nấu nhanh' | 'Dị ứng' | 'Công thức' = 'Công thức';
      const qLower = query.toLowerCase();
      if (qLower.includes('dị ứng') || qLower.includes('kiêng')) topic = 'Dị ứng';
      else if (qLower.includes('calo') || qLower.includes('giảm cân') || qLower.includes('đạm')) topic = 'Dinh dưỡng';
      else if (qLower.includes('tủ lạnh') || qLower.includes('còn lại')) topic = 'Tủ lạnh';
      else if (qLower.includes('nhanh') || qLower.includes('phút')) topic = 'Nấu nhanh';

      logChatQuery({
        userId: currentUser?.id || 'guest',
        userName: currentUser?.name || 'Khách vãng lai',
        isGuest,
        query,
        reply: reply.content,
        latencyMs,
        feedback: 'neutral',
        topic,
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      setLastFailedQuery(query);

      const errCode = err?.error?.code;

      if (errCode === 'GUEST_LIMIT_EXCEEDED') {
        setGuestQueriesRemaining(0);
        const limitMsg: ChatMessage = {
          id: `limit-err-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ **Bạn đã sử dụng hết lượt hỏi ở Chế độ Khách (5/5).**\n\nHãy đăng ký tài khoản hoặc đăng nhập để trò chuyện không giới hạn, ghi nhớ khẩu vị và công thức yêu thích!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, limitMsg]);
      } else {
        const errorContent =
          errCode === 'AI_TIMEOUT'
            ? '⏱️ Mô hình AI phản hồi quá thời gian chờ (15s). Vui lòng nhấn Thử lại bên dưới để gửi lại câu hỏi.'
            : errCode === 'AI_SERVICE_ERROR'
            ? '⚠️ Dịch vụ AI đang bận hoặc gặp sự cố tạm thời. Vui lòng thử lại sau ít giây.'
            : (err?.error?.message || 'Đã xảy ra lỗi khi kết nối với trợ lý CulinaAI. Vui lòng thử lại.');

        const fallbackMsg: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: errorContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (msgId: string, feedback: 'helpful' | 'unhelpful') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback } : m))
    );
    updateChatFeedback(msgId, feedback);
  };

  const quickPrompts = isGuest
    ? [
        'Gợi ý món canh cho bữa trưa nhanh gọn',
        'Cách xào rau muống xanh giòn không bị thâm?',
        'Có trứng và cà chua thì nấu món gì ngon?',
        'Cách khử mùi tanh của cá hồi hiệu quả?',
      ]
    : [
        `Gợi ý bữa tối dưới ${Math.round((currentUser?.tasteProfile?.targetCalories || 1800) / 3)} kcal`,
        `Thực đơn Eat Clean không có ${currentUser?.tasteProfile?.allergies?.[0] || 'dị ứng'}`,
        'Cách làm nước sốt mè rang thanh đạm tại nhà',
      ];

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden transition-all duration-300 ${
        isFullPage
          ? 'h-[calc(100vh-5rem)] max-w-4xl mx-auto rounded-3xl border border-slate-200 shadow-xl my-4'
          : 'h-[620px] w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl'
      }`}
    >
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-teal-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-800 text-emerald-300 flex items-center justify-center shadow-sm">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm sm:text-base">
                CulinaAI Chef
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-300">
              {isGuest ? (
                <span className="text-teal-300 font-semibold flex items-center gap-1.5">
                  <span>👀 Chế độ Khách</span>
                  <span className="bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-700/60 text-emerald-300 font-mono text-[10px]">
                    Còn {guestQueriesRemaining}/5 lượt
                  </span>
                </span>
              ) : (
                <span>
                  Đang phục vụ {currentUser?.name} ({currentUser?.tasteProfile?.diet || 'Lành mạnh'})
                </span>
              )}
            </div>
          </div>
        </div>

        {!isFullPage && (
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Guest Mode Warning Banner */}
      {isGuest && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-b border-teal-200 text-xs text-teal-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              {guestQueriesRemaining <= 1
                ? 'Sắp hết lượt hỏi miễn phí của khách!'
                : 'Chế độ khách: Giới hạn 5 lượt hỏi & lưu tạm.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAuthModalType('register')}
              className="font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer text-[11px]"
            >
              Đăng ký
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={() => setAuthModalType('login')}
              className="font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer text-[11px]"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isOutOfScope = msg.replyType === 'out_of_scope';
          const hasDishes = msg.dishes && msg.dishes.length > 0;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                  isUser
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-900 text-teal-300 border border-slate-800'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`max-w-[88%] sm:max-w-[84%] group flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* Out of scope badge */}
                {!isUser && isOutOfScope && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg mb-1 shadow-2xs">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Chủ đề ngoài phạm vi ẩm thực
                  </span>
                )}

                {/* Bubble Text */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-teal-800 text-white rounded-tr-xs shadow-xs'
                      : isOutOfScope
                      ? 'bg-amber-50/70 border border-amber-200 text-slate-800 rounded-tl-xs shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {msg.content}

                  {/* CTA Buttons in bubble if limit reached */}
                  {msg.content.includes('hết lượt hỏi') && isGuest && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                      <button
                        onClick={() => setAuthModalType('register')}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Đăng ký ngay</span>
                      </button>
                      <button
                        onClick={() => setAuthModalType('login')}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5 text-slate-600" />
                        <span>Đăng nhập</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Recommended Dish Cards (UC03 -> UC04) */}
                {!isUser && hasDishes && (
                  <div className="w-full mt-2.5 space-y-2">
                    <p className="text-[11px] font-bold text-teal-900 flex items-center gap-1 uppercase tracking-wider">
                      <ChefHat className="w-3.5 h-3.5 text-teal-700" />
                      Món ăn liên quan được gợi ý:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.dishes!.map((dish) => (
                        <div
                          key={dish.id}
                          className="bg-white rounded-xl border border-stone-200 p-2.5 shadow-2xs hover:shadow-md hover:border-teal-400 transition-all flex flex-col justify-between group/card"
                        >
                          <div className="flex gap-2.5 items-start">
                            {dish.image_url ? (
                              <img
                                src={dish.image_url}
                                alt={dish.name}
                                className="w-14 h-14 rounded-lg object-cover shrink-0 border border-stone-200"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 border border-teal-200">
                                <ChefHat className="w-6 h-6 text-teal-600" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-stone-900 truncate group-hover/card:text-teal-700 transition-colors">
                                {dish.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-500">
                                {dish.cook_time_minutes ? (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3 text-stone-400" />
                                    {dish.cook_time_minutes}p
                                  </span>
                                ) : null}
                                {dish.difficulty ? (
                                  <span className="capitalize px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                                    {dish.difficulty === 'easy'
                                      ? 'Dễ'
                                      : dish.difficulty === 'hard'
                                      ? 'Khó'
                                      : 'Vừa'}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => openDishDetail(dish.slug || dish.id)}
                            className="mt-2 w-full py-1.5 px-2 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Xem công thức</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub info & Feedback buttons */}
                <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-slate-700 flex items-center gap-0.5 ml-1 transition-colors cursor-pointer"
                        title="Sao chép"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {/* Helpful / Unhelpful buttons */}
                      <button
                        onClick={() => handleFeedback(msg.id, 'helpful')}
                        className={`hover:text-emerald-600 flex items-center gap-0.5 transition-colors cursor-pointer ${
                          msg.feedback === 'helpful' ? 'text-emerald-600 font-bold' : ''
                        }`}
                        title="Hữu ích"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleFeedback(msg.id, 'unhelpful')}
                        className={`hover:text-rose-600 flex items-center gap-0.5 transition-colors cursor-pointer ${
                          msg.feedback === 'unhelpful' ? 'text-rose-600 font-bold' : ''
                        }`}
                        title="Chưa hữu ích"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 animate-pulse">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-teal-300 flex items-center justify-center text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
              <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
              <span>Bếp trưởng CulinaAI đang suy nghĩ và tra cứu công thức cho bạn...</span>
            </div>
          </div>
        )}

        {/* Nút Thử lại khi có lỗi */}
        {lastFailedQuery && !isLoading && (
          <div className="flex justify-center pt-1">
            <button
              onClick={() => handleSendMessage(lastFailedQuery)}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại câu hỏi trước</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading || (isGuest && guestQueriesRemaining <= 0)}
            className="px-3 py-1 bg-white hover:bg-teal-50 hover:text-teal-900 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            isGuest && guestQueriesRemaining <= 0
              ? 'Đã hết lượt hỏi ở Chế độ Khách (vui lòng đăng ký/đăng nhập)...'
              : 'Hỏi công thức, mẹo nấu hoặc nguyên liệu trong tủ lạnh...'
          }
          disabled={isLoading || (isGuest && guestQueriesRemaining <= 0)}
          className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
        />

        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim() || (isGuest && guestQueriesRemaining <= 0)}
          className={`p-2.5 rounded-2xl transition-all shadow-sm cursor-pointer ${
            isLoading || !inputMessage.trim() || (isGuest && guestQueriesRemaining <= 0)
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-teal-800 hover:bg-teal-900 text-white'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
