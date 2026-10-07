import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
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
  Leaf,
} from 'lucide-react';

interface ChatbotDrawerProps {
  isFullPage?: boolean;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({ isFullPage = false }) => {
  const {
    currentUser,
    isGuest,
    guestQueriesRemaining,
    decrementGuestQuery,
    setAuthModalType,
    logChatQuery,
    updateChatFeedback,
    setIsChatOpen,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: isGuest
        ? `Chào bạn! Tôi là **CulinaAI** - Trợ lý Ẩm thực Tinh hoa 👨‍🍳🌿\n\nBạn đang ở **Chế độ Khách** (còn ${guestQueriesRemaining} lượt hỏi thử nghiệm). Bạn có thể hỏi tôi bất kỳ công thức nấu ăn, mẹo làm bếp hoặc cách sơ chế món ngon thanh lành nào!`
        : `Chào **${currentUser?.name}**! Bếp trưởng **CulinaAI** rất vui được đồng hành cùng bạn theo chế độ **${currentUser?.tasteProfile.diet}** 🍲🌿\n\nHôm nay bạn muốn nấu món gì hay cần gợi ý thực đơn phù hợp mục tiêu **${currentUser?.tasteProfile.targetCalories} kcal**?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    // Check guest limit
    if (isGuest && guestQueriesRemaining <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: `limit-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ **Bạn đã sử dụng hết lượt hỏi ở Chế độ Khách.**\n\nHãy đăng ký tài khoản hoặc đăng nhập để tiếp tục trò chuyện không giới hạn, ghi nhớ hồ sơ dị ứng và cá nhân hóa thực đơn!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    if (isGuest) {
      decrementGuestQuery();
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

    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          tasteProfile: currentUser?.tasteProfile,
          isGuest,
        }),
      });

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      const replyContent = data.reply || 'Cảm ơn bạn! Hãy để tôi tìm công thức tối ưu nhất cho bạn.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Topic categorization
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
        reply: replyContent,
        latencyMs,
        feedback: 'neutral',
        topic,
      });
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content:
          'Tôi đang gặp sự cố kết nối máy chủ một chút. Bạn có thể tham khảo trực tiếp các công thức tuyệt vời trong mục Khám Phá Món Ăn nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
        'Mẹo luộc gà vàng ươm không bị nứt da?',
        'Cách khử mùi tanh của cá hồi?',
        'Công thức xào rau xanh giòn ngọt?',
      ]
    : [
        `Gợi ý bữa tối dưới ${Math.round((currentUser?.tasteProfile.targetCalories || 1800) / 3)} kcal`,
        `Thực đơn Eat Clean không có ${currentUser?.tasteProfile.allergies?.[0] || 'dị ứng'}`,
        'Cách làm nước sốt mè rang thanh đạm tại nhà',
      ];

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden transition-all duration-300 ${
        isFullPage
          ? 'h-[calc(100vh-5rem)] max-w-4xl mx-auto rounded-3xl border border-slate-200 shadow-xl my-4'
          : 'h-[590px] w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl'
      }`}
    >
      {/* Header with serene forest teal tone */}
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
                <span className="text-teal-300 font-semibold">
                  👀 Chế độ Khách (Còn {guestQueriesRemaining} câu hỏi)
                </span>
              ) : (
                <span>
                  Đang phục vụ {currentUser?.name} ({currentUser?.tasteProfile.diet})
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

      {/* Guest Mode Warning Banner if running low */}
      {isGuest && (
        <div className="px-4 py-2 bg-teal-50 border-b border-teal-200 text-xs text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Chế độ khách bị giới hạn số câu & không lưu dị ứng.</span>
          </div>
          <button
            onClick={() => setAuthModalType('register')}
            className="font-bold underline text-teal-800 hover:text-teal-950 cursor-pointer"
          >
            Đăng ký mở khóa
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/70">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
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

              {/* Message Bubble */}
              <div className={`max-w-[84%] group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-teal-800 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {msg.content}
                </div>

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

        {isLoading && (
          <div className="flex items-start gap-2.5 animate-pulse">
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-teal-300 flex items-center justify-center text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
              <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
              <span>Bếp trưởng AI đang cân nhắc công thức phù hợp khẩu vị của bạn...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading || (isGuest && guestQueriesRemaining <= 0)}
            className="px-3 py-1 bg-white hover:bg-teal-50 hover:text-teal-900 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all shadow-2xs cursor-pointer"
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
              ? 'Đã hết lượt hỏi ở chế độ khách...'
              : 'Hỏi công thức, mẹo nấu hoặc nguyên liệu trong tủ lạnh...'
          }
          disabled={isLoading || (isGuest && guestQueriesRemaining <= 0)}
          className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 bg-slate-50/50"
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
