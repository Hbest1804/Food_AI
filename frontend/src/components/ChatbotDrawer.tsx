import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import {
  apiSendGuestMessage,
  apiCreateChatSession,
  apiGetChatSessions,
  apiGetChatSessionById,
  apiSendChatMessage,
  apiDeleteChatSession,
  apiSendChatMessageFeedback,
  apiUpdateChatSessionTitle,
  ChatSessionItem,
} from '../api/chatApi';
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
  ArrowRight,
  LogIn,
  UserPlus,
  History,
  Plus,
  Trash2,
  Edit2,
  MessageSquare,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react';

interface ChatbotDrawerProps {
  isFullPage?: boolean;
}

/**
 * Làm sạch chuỗi markdown, loại bỏ cú pháp rò rỉ mã ID như [Tên món](id:uuid) hoặc (id:uuid)
 */
function cleanDisplayContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/\[([^\]]+)\]\((?:id:)?(?:[a-f0-9\-]{8,36}|\d+)\)/gi, '**$1**')
    .replace(/\s*[\(\[](?:id|ID):\s*[a-f0-9\-]{8,36}[\)\]]/gi, '')
    .replace(/\s*\(id:[^\)]+\)/gi, '');
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
    tasteProfileApiData,
  } = useApp();

  // Sessions state (Cho người dùng đã đăng nhập - Mục 4.6)
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSessionsDrawerOpen, setIsSessionsDrawerOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  // Hiệu ứng các bước phản hồi trực quan theo thời gian thực
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const t1 = setTimeout(() => setLoadingStep(1), 1500);
    const t2 = setTimeout(() => setLoadingStep(2), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading]);

  // Feedback modal state (Mục 4.6.6)
  const [feedbackModalMessageId, setFeedbackModalMessageId] = useState<string | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

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

  // Khởi tạo tin nhắn chào mừng mặc định
  const getWelcomeMessage = (): ChatMessage => {
    const dietName = tasteProfileApiData?.diet_types?.[0]?.name || currentUser?.tasteProfile?.diet || 'Lành mạnh';
    const caloGoal = tasteProfileApiData?.calorie_goal || currentUser?.tasteProfile?.targetCalories || 1800;
    const allergenList = tasteProfileApiData?.allergen_groups?.map((a) => a.name).join(', ');

    return {
      id: 'welcome',
      role: 'assistant',
      content: isGuest
        ? `Chào bạn! Tôi là **CulinaAI** - Trợ lý Ẩm thực Tinh hoa 👨‍🍳🌿\n\nBạn đang ở **Chế độ Khách** (còn **${guestQueriesRemaining}** lượt hỏi thử nghiệm). Bạn có thể hỏi tôi bất kỳ công thức nấu ăn, mẹo làm bếp hoặc cách sơ chế món ngon từ nguyên liệu có sẵn!`
        : `Chào **${currentUser?.name}**! Bếp trưởng **CulinaAI** rất vui được đồng hành cùng bạn theo chế độ **${dietName}** 🍲🌿\n\n${allergenList
          ? `🛡️ *Hệ thống đã kích hoạt bộ lọc bảo vệ: Loại bỏ hoàn toàn các món có liên quan đến ${allergenList}.*\n\n`
          : ''
        }Hôm nay bạn muốn nấu món gì hay cần gợi ý thực đơn phù hợp mục tiêu **~${caloGoal} kcal**?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Tải danh sách hội thoại khi đã đăng nhập (Mục 4.6.2)
  const loadSessions = async () => {
    if (isGuest || !currentUser) return;
    try {
      const res = await apiGetChatSessions(1, 40);
      if (res.success && Array.isArray(res.data)) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách hội thoại:', err);
    }
  };

  useEffect(() => {
    if (!isGuest && currentUser) {
      loadSessions();
      setMessages([getWelcomeMessage()]);
    } else {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([getWelcomeMessage()]);
    }
  }, [isGuest, currentUser?.id]);

  // Khi mở một session cũ (Mục 4.6.3)
  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setIsSessionsDrawerOpen(false);
    setIsLoading(true);
    try {
      const res = await apiGetChatSessionById(sessionId);
      if (res.success && res.data) {
        const loadedMessages: ChatMessage[] = (res.data.messages || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dishes: m.referenced_dishes || [],
          outcome: m.outcome,
          tokens: m.tokens,
          feedback: m.feedback,
          feedback_reason: m.feedback_reason,
        }));

        if (loadedMessages.length === 0) {
          setMessages([getWelcomeMessage()]);
        } else {
          setMessages(loadedMessages);
        }
      }
    } catch (err) {
      console.error('Lỗi khi mở hội thoại:', err);
      setMessages([
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Không thể tải nội dung hội thoại cũ. Vui lòng thử lại sau.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo cuộc trò chuyện mới (Mục 4.6.1)
  const handleCreateNewSession = async () => {
    if (isGuest) {
      setActiveSessionId(null);
      setMessages([getWelcomeMessage()]);
      setIsSessionsDrawerOpen(false);
      return;
    }

    try {
      const res = await apiCreateChatSession();
      if (res.success && res.data) {
        setSessions((prev) => [res.data, ...prev]);
        setActiveSessionId(res.data.id);
        setMessages([getWelcomeMessage()]);
        setIsSessionsDrawerOpen(false);
      }
    } catch (err) {
      console.error('Lỗi khi tạo hội thoại mới:', err);
      setActiveSessionId(null);
      setMessages([getWelcomeMessage()]);
      setIsSessionsDrawerOpen(false);
    }
  };

  // Xóa hội thoại (Mục 4.6.5)
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa hội thoại này và toàn bộ tin nhắn liên quan không?')) {
      return;
    }
    try {
      await apiDeleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([getWelcomeMessage()]);
      }
    } catch (err) {
      console.error('Lỗi khi xóa hội thoại:', err);
    }
  };

  // Đổi tên hội thoại (API PATCH)
  const handleSaveRenameSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    try {
      const res = await apiUpdateChatSessionTitle(sessionId, editingTitle.trim());
      if (res.success && res.data) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: res.data.title } : s))
        );
      }
    } catch (err) {
      console.error('Lỗi đổi tên hội thoại:', err);
    } finally {
      setEditingSessionId(null);
      setEditingTitle('');
    }
  };

  // Xử lý gửi tin nhắn từ prompt bên ngoài
  useEffect(() => {
    if (chatPendingPrompt) {
      const prompt = chatPendingPrompt;
      setChatPendingPrompt('');
      handleSendMessage(prompt);
    }
  }, [chatPendingPrompt]);

  // Gửi câu hỏi cho chatbot (Mục 4.4 cho khách & Mục 4.6.4 cho người dùng đăng nhập)
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

    const tempUserMsgId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempUserMsgId,
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
      const fridgeData = chatPendingFridge || undefined;
      if (chatPendingFridge) {
        setChatPendingFridge(null);
      }

      if (isGuest) {
        // ── 4.4 Chế độ khách ───────────────────────────────────────────────
        const res = await apiSendGuestMessage({
          content: query,
          fridge: fridgeData,
        });

        const latencyMs = Date.now() - startTime;
        const { reply, quota } = res.data;

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

        logChatQuery({
          userId: 'guest',
          userName: 'Khách vãng lai',
          isGuest: true,
          query,
          reply: reply.content,
          latencyMs,
          feedback: 'neutral',
          topic: 'Công thức',
        });
      } else {
        // ── 4.6 Chế độ cá nhân hóa đầy đủ (UC07) ───────────────────────────
        let currentSessionId = activeSessionId;

        // Nếu chưa có session hiện tại, tạo session mới trước
        if (!currentSessionId) {
          const newSessRes = await apiCreateChatSession();
          if (newSessRes.success && newSessRes.data) {
            currentSessionId = newSessRes.data.id;
            setActiveSessionId(currentSessionId);
            setSessions((prev) => [newSessRes.data, ...prev]);
          } else {
            throw new Error('Không thể khởi tạo phiên trò chuyện mới.');
          }
        }

        const res = await apiSendChatMessage(currentSessionId, {
          content: query,
          fridge: fridgeData,
        });

        const latencyMs = Date.now() - startTime;
        const { user_message, assistant_message } = res.data;

        // Cập nhật id thật của user message từ DB
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMsgId ? { ...m, id: user_message.id } : m))
        );

        const botMsg: ChatMessage = {
          id: assistant_message.id,
          role: 'assistant',
          content: assistant_message.content,
          outcome: assistant_message.outcome,
          tokens: assistant_message.tokens,
          dishes: assistant_message.referenced_dishes || [],
          timestamp: new Date(assistant_message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setMessages((prev) => [...prev, botMsg]);

        // Làm mới danh sách sessions để cập nhật tiêu đề tự sinh
        loadSessions();

        logChatQuery({
          userId: currentUser?.id || '',
          userName: currentUser?.name || 'Thành viên',
          isGuest: false,
          query,
          reply: assistant_message.content,
          latencyMs,
          feedback: 'neutral',
          topic: 'Công thức',
        });
      }
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
        const isTimeoutError =
          errCode === 'AI_TIMEOUT' ||
          err?.code === 'ECONNABORTED' ||
          (err?.message && String(err.message).toLowerCase().includes('timeout'));

        const errorContent = isTimeoutError
          ? '⏱️ Quá thời gian chờ phản hồi do yêu cầu cần phân tích thực đơn kỹ lưỡng. Tin nhắn của bạn đã được lưu, vui lòng nhấn "Thử lại câu hỏi trước" bên dưới.'
          : errCode === 'AI_SERVICE_ERROR'
            ? '⚠️ Dịch vụ AI đang bận hoặc gặp sự cố tạm thời. Tin nhắn đã được lưu, vui lòng thử lại sau ít giây.'
            : (err?.error?.message || err?.message || 'Đã xảy ra lỗi khi kết nối với trợ lý CulinaAI. Vui lòng thử lại.');

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

  // Đánh giá phản hồi (Mục 4.6.6)
  const handleLike = async (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: 'like', feedback_reason: null } : m))
    );

    if (!isGuest && currentUser) {
      try {
        await apiSendChatMessageFeedback(msgId, 'like');
      } catch (err) {
        console.error('Lỗi gửi đánh giá like:', err);
      }
    }
    updateChatFeedback(msgId, 'helpful');
  };

  const handleOpenDislikeModal = (msgId: string) => {
    setFeedbackModalMessageId(msgId);
    setFeedbackReason('');
  };

  const handleSubmitDislike = async () => {
    if (!feedbackModalMessageId) return;
    setIsSubmittingFeedback(true);

    const msgId = feedbackModalMessageId;
    const reason = feedbackReason.trim();

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedback: 'dislike', feedback_reason: reason || null } : m
      )
    );

    if (!isGuest && currentUser) {
      try {
        await apiSendChatMessageFeedback(msgId, 'dislike', reason || undefined);
      } catch (err) {
        console.error('Lỗi gửi đánh giá dislike:', err);
      }
    }

    updateChatFeedback(msgId, 'unhelpful');
    setIsSubmittingFeedback(false);
    setFeedbackModalMessageId(null);
  };

  const quickPrompts = isGuest
    ? [
      'Gợi ý món canh cho bữa trưa nhanh gọn',
      'Cách xào rau muống xanh giòn không bị thâm?',
      'Có trứng và cà chua thì nấu món gì ngon?',
      'Cách khử mùi tanh của cá hồi hiệu quả?',
    ]
    : [
      `Gợi ý bữa tối dưới ${Math.round((tasteProfileApiData?.calorie_goal || 1800) / 3)} kcal`,
      `Thực đơn Eat Clean không có ${tasteProfileApiData?.allergen_groups?.[0]?.name || 'dị ứng'}`,
      'Cách làm nước sốt mè rang thanh đạm tại nhà',
      'Gợi ý 3 món ăn chuẩn vị cho cả gia đình',
    ];

  const activeDietName = tasteProfileApiData?.diet_types?.[0]?.name || currentUser?.tasteProfile?.diet;
  const allergenCount = tasteProfileApiData?.allergen_groups?.length || 0;

  // Lọc danh sách hội thoại theo từ khóa tìm kiếm
  const filteredSessions = sessions.filter((s) =>
    (s.title || 'Hội thoại mới').toLowerCase().includes(sessionSearchTerm.toLowerCase())
  );

  // Render Sidebar Component (Dùng chung cho Desktop full-page và Mobile drawer)
  const renderSessionsSidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-teal-400" />
          <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
            Lịch sử trò chuyện
          </h4>
        </div>
        <span className="text-[10px] text-teal-400 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
          {sessions.length} phiên
        </span>
      </div>

      {/* Nút Tạo hội thoại mới */}
      <div className="p-3">
        <button
          onClick={handleCreateNewSession}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* Search box nếu có nhiều sessions */}
      {sessions.length > 3 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm hội thoại..."
              value={sessionSearchTerm}
              onChange={(e) => setSessionSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>
      )}

      {/* Danh sách sessions */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 divide-y-0">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs px-4">
            {sessions.length === 0
              ? 'Chưa có hội thoại nào được lưu. Bắt đầu chat để tự động lưu!'
              : 'Không tìm thấy hội thoại phù hợp.'}
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = activeSessionId === s.id;
            const isEditing = editingSessionId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => !isEditing && handleSelectSession(s.id)}
                className={`group px-3 py-2.5 rounded-xl cursor-pointer transition-all border text-xs flex items-center justify-between gap-2 ${isActive
                    ? 'bg-teal-950/90 border-teal-600/70 text-teal-100 shadow-xs'
                    : 'bg-slate-800/40 hover:bg-slate-800 border-transparent hover:border-slate-700 text-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-500'}`}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameSession(s.id, e as any);
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      className="w-full bg-slate-900 border border-teal-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-hidden"
                      autoFocus
                    />
                  ) : (
                    <div className="truncate min-w-0">
                      <span className="font-semibold block truncate">
                        {s.title || 'Hội thoại mới'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(s.updated_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nút Sửa / Xóa */}
                <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100">
                  {isEditing ? (
                    <button
                      onClick={(e) => handleSaveRenameSession(s.id, e)}
                      className="p-1 hover:text-emerald-400 text-slate-300"
                      title="Lưu"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(s.id);
                          setEditingTitle(s.title || '');
                        }}
                        className="p-1 hover:text-teal-300 text-slate-400"
                        title="Đổi tiêu đề"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="p-1 hover:text-rose-400 text-slate-400"
                        title="Xóa hội thoại"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white overflow-hidden transition-all duration-300 relative ${isFullPage
          ? 'h-[calc(100vh-5.5rem)] max-w-6xl mx-auto rounded-3xl border border-slate-200 shadow-2xl flex flex-row'
          : 'h-[640px] w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl flex flex-col'
        }`}
    >
      {/* ── Desktop Permanent Sidebar for Full-Page View ── */}
      {isFullPage && !isGuest && isDesktopSidebarOpen && (
        <div className="hidden md:flex w-72 shrink-0 border-r border-slate-800 h-full">
          {renderSessionsSidebarContent()}
        </div>
      )}

      {/* ── Mobile / Widget Floating Sessions Overlay ── */}
      {isSessionsDrawerOpen && (
        <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="w-4/5 max-w-xs bg-slate-900 text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-800">
            <div className="flex justify-end p-2 border-b border-slate-800">
              <button
                onClick={() => setIsSessionsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderSessionsSidebarContent()}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsSessionsDrawerOpen(false)} />
        </div>
      )}

      {/* ── Modal Đánh giá câu trả lời (Mục 4.6.6) ── */}
      {feedbackModalMessageId && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <ThumbsDown className="w-4 h-4" />
                <span>Góp ý câu trả lời của Chatbot</span>
              </div>
              <button
                onClick={() => setFeedbackModalMessageId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Cảm ơn bạn đã phản hồi! Hãy cho CulinaAI biết lý do câu trả lời chưa thực sự hữu ích:
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                'Món có nguyên liệu dị ứng/kiêng',
                'Công thức chưa rõ ràng',
                'Thời gian nấu quá lâu',
                'Nguyên liệu khó tìm',
              ].map((reasonChip, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeedbackReason(reasonChip)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                >
                  {reasonChip}
                </button>
              ))}
            </div>

            <textarea
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value.slice(0, 500))}
              placeholder="Nhập lý do chi tiết (tối đa 500 ký tự)..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 mb-2 resize-none"
            />
            <div className="text-right text-[10px] text-slate-400 mb-4">
              {feedbackReason.length}/500 ký tự
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFeedbackModalMessageId(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Bỏ qua
              </button>
              <button
                onClick={handleSubmitDislike}
                disabled={isSubmittingFeedback}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingFeedback ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Chat Column ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-teal-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Desktop toggle sidebar button in fullpage */}
            {isFullPage && !isGuest && (
              <button
                onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="hidden md:flex p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 transition-colors cursor-pointer"
                title={isDesktopSidebarOpen ? 'Thu gọn danh sách hội thoại' : 'Mở danh sách hội thoại'}
              >
                {isDesktopSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile / Widget sidebar toggle button */}
            {(!isFullPage || !isDesktopSidebarOpen) && !isGuest && (
              <button
                onClick={() => setIsSessionsDrawerOpen(true)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 transition-colors cursor-pointer relative"
                title="Lịch sử hội thoại"
              >
                <History className="w-4 h-4" />
                {sessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            )}

            <div className="w-9 h-9 rounded-2xl bg-teal-800 text-emerald-300 flex items-center justify-center shadow-sm shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm sm:text-base truncate">
                  CulinaAI Chef
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>

              <div className="text-[11px] text-slate-300 truncate">
                {isGuest ? (
                  <span className="text-teal-300 font-semibold flex items-center gap-1.5">
                    <span>👀 Chế độ Khách</span>
                    <span className="bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-700/60 text-emerald-300 font-mono text-[10px]">
                      Còn {guestQueriesRemaining}/5 lượt
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-teal-300 font-medium truncate">
                    <span className="truncate">{currentUser?.name}</span>
                    {activeDietName && (
                      <span className="bg-teal-950 px-2 py-0.2 rounded-full border border-teal-700/60 text-emerald-300 text-[10px] shrink-0">
                        {activeDietName}
                      </span>
                    )}
                    {allergenCount > 0 && (
                      <span className="bg-rose-950/80 px-1.5 py-0.2 rounded-full border border-rose-700/60 text-rose-300 text-[10px] flex items-center gap-0.5 shrink-0">
                        <ShieldAlert className="w-3 h-3" />
                        Lọc {allergenCount} dị ứng
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isGuest && (
              <button
                onClick={handleCreateNewSession}
                className="p-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white transition-colors cursor-pointer"
                title="Tạo hội thoại mới"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {!isFullPage && (
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Guest Mode Warning Banner */}
        {isGuest && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-b border-teal-200 text-xs text-teal-900 flex items-center justify-between shadow-2xs shrink-0">
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
            const isOutOfScope = msg.outcome === 'out_of_scope' || msg.replyType === 'out_of_scope';
            const isNoMatch = msg.outcome === 'no_match';
            const hasDishes = msg.dishes && msg.dishes.length > 0;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${isUser
                      ? 'bg-teal-800 text-white'
                      : 'bg-slate-900 text-teal-300 border border-slate-800'
                    }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[88%] sm:max-w-[84%] group flex flex-col ${isUser ? 'items-end' : 'items-start'
                    }`}
                >
                  {/* Out of scope badge (Quy tắc 4) */}
                  {!isUser && isOutOfScope && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg mb-1 shadow-2xs">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Chủ đề ngoài phạm vi ẩm thực
                    </span>
                  )}

                  {/* No match badge (Quy tắc 3) */}
                  {!isUser && isNoMatch && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg mb-1 shadow-2xs">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Đề xuất nới lỏng điều kiện
                    </span>
                  )}

                  {/* Bubble Text */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isUser
                        ? 'bg-teal-800 text-white rounded-tr-xs shadow-xs'
                        : isOutOfScope
                          ? 'bg-amber-50/70 border border-amber-200 text-slate-800 rounded-tl-xs shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                      }`}
                  >
                    {cleanDisplayContent(msg.content)}

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

                  {/* Recommended Dish Cards (UC07 -> UC04 & Quy tắc 2) */}
                  {!isUser && hasDishes && (
                    <div className="w-full mt-2.5 space-y-2">
                      <p className="text-[11px] font-bold text-teal-900 flex items-center gap-1 uppercase tracking-wider">
                        <ChefHat className="w-3.5 h-3.5 text-teal-700" />
                        Món ăn phù hợp khẩu vị đã chọn:
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

                  {/* Sub info & Feedback buttons (Mục 4.6.6) */}
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

                        {/* Thumbs Up (Like) */}
                        <button
                          onClick={() => handleLike(msg.id)}
                          className={`hover:text-emerald-600 flex items-center gap-0.5 transition-colors cursor-pointer ${msg.feedback === 'like' || msg.feedback === 'helpful'
                              ? 'text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded'
                              : ''
                            }`}
                          title="Hài lòng với câu trả lời"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {(msg.feedback === 'like' || msg.feedback === 'helpful') && <span>Đã thích</span>}
                        </button>

                        {/* Thumbs Down (Dislike kèm lý do) */}
                        <button
                          onClick={() => handleOpenDislikeModal(msg.id)}
                          className={`hover:text-rose-600 flex items-center gap-0.5 transition-colors cursor-pointer ${msg.feedback === 'dislike' || msg.feedback === 'unhelpful'
                              ? 'text-rose-600 font-bold bg-rose-50 px-1 py-0.2 rounded'
                              : ''
                            }`}
                          title="Chưa hài lòng / Báo lỗi"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          {(msg.feedback === 'dislike' || msg.feedback === 'unhelpful') && (
                            <span>{msg.feedback_reason ? 'Đã góp ý' : 'Chưa thích'}</span>
                          )}
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
            <div className="flex items-start gap-2.5 animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-teal-300 flex items-center justify-center text-xs shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-teal-200/80 text-xs text-slate-700 flex flex-col gap-2 shadow-2xs min-w-[260px] max-w-[85%]">
                <div className="flex items-center gap-2 font-medium text-teal-950">
                  <Sparkles className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                  <span className="transition-all duration-300">
                    {loadingStep === 0 && '🔍 Đang phân tích khẩu vị & nguyên liệu...'}
                    {loadingStep === 1 && '🍲 Đang chọn lọc món ăn & mẹo nấu...'}
                    {loadingStep >= 2 && '✨ Đang hoàn thiện thực đơn cho bạn...'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-600 to-emerald-400 transition-all duration-700 ease-out rounded-full"
                    style={{ width: loadingStep === 0 ? '35%' : loadingStep === 1 ? '72%' : '94%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nút Thử lại khi có lỗi (Luồng 3a) */}
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
                : 'Hỏi công thức, thực đơn cá nhân hóa hoặc nguyên liệu có sẵn...'
            }
            disabled={isLoading || (isGuest && guestQueriesRemaining <= 0)}
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400"
          />

          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim() || (isGuest && guestQueriesRemaining <= 0)}
            className={`p-2.5 rounded-2xl transition-all shadow-sm cursor-pointer ${isLoading || !inputMessage.trim() || (isGuest && guestQueriesRemaining <= 0)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-800 hover:bg-teal-900 text-white'
              }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
