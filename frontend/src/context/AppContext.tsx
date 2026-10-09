import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Dish,
  Review,
  ChatLogRecord,
  TasteProfile,
  MealHistoryItem,
} from '../types';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetMe,
  isTokenStored,
  clearTokens,
  type AuthUser,
} from '../api/authApi';

interface AppContextType {
  currentUser: User | null;
  isGuest: boolean;
  guestQueriesRemaining: number;
  dishes: Dish[];
  users: User[];
  reviews: Review[];
  chatLogs: ChatLogRecord[];
  activeDishModal: Dish | null;
  setActiveDishModal: (dish: Dish | null) => void;
  cookingDish: Dish | null;
  setCookingDish: (dish: Dish | null) => void;
  authModalType: 'login' | 'register' | 'forgot' | null;
  setAuthModalType: (type: 'login' | 'register' | 'forgot' | null) => void;
  isTasteProfileModalOpen: boolean;
  setIsTasteProfileModalOpen: (open: boolean) => void;
  isPersonalDataModalOpen: boolean;
  setIsPersonalDataModalOpen: (open: boolean) => void;
  isFridgeModalOpen: boolean;
  setIsFridgeModalOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isWelcomeIntroOpen: boolean;
  setIsWelcomeIntroOpen: (open: boolean) => void;
  activeTab: 'browse' | 'recommendations' | 'chat' | 'admin' | 'auth';
  setActiveTab: (tab: 'browse' | 'recommendations' | 'chat' | 'admin' | 'auth') => void;

  // Auth state
  authLoading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;

  // Auth actions
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, initialTaste?: Partial<TasteProfile>) => Promise<boolean>;
  resetPassword: (email: string, newPass: string) => boolean;
  switchAccount: (userId: string) => void;
  decrementGuestQuery: () => boolean;

  // User & Profile actions
  updateTasteProfile: (profile: Partial<TasteProfile>) => void;
  updateUserProfile: (name: string, avatar: string, phone?: string) => void;
  toggleFavorite: (dishId: string) => void;
  recordCookedMeal: (dish: Dish, mealType: string) => void;
  deleteMealHistoryItem: (historyId: string) => void;
  exportPersonalData: () => void;

  // Dish actions (Admin & General)
  addDish: (dish: Omit<Dish, 'id' | 'rating' | 'ratingCount'>) => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (dishId: string) => void;
  togglePublishDish: (dishId: string) => void;

  // Reviews
  addReview: (dishId: string, rating: number, comment: string) => void;

  // Chat logging
  logChatQuery: (record: Omit<ChatLogRecord, 'id' | 'timestamp'>) => void;
  updateChatFeedback: (logId: string, feedback: 'helpful' | 'unhelpful') => void;

  // Admin User management
  toggleUserStatus: (userId: string) => void;
  changeUserRole: (userId: string, newRole: 'user' | 'admin') => void;

  // Utilities
  calculateDishMatchScore: (dish: Dish, profile?: TasteProfile) => { score: number; reasons: string[]; isAllergic: boolean };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Khởi tạo state trống, sẵn sàng kết nối CSDL và API backend
  // Đồng thời dọn dẹp các ID dữ liệu mẫu cũ (dish-*, user-*, rev-*, log-*) nếu còn lưu trong localStorage
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('culina_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((u: User) => !u.id.startsWith('user-')) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedId = localStorage.getItem('culina_current_user_id');
      if (!savedId || savedId === 'guest' || savedId.startsWith('user-')) return null;
      const savedUsers = localStorage.getItem('culina_users');
      if (savedUsers) {
        const parsed: User[] = JSON.parse(savedUsers);
        return parsed.find((u) => u.id === savedId) || null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [dishes, setDishes] = useState<Dish[]>(() => {
    try {
      const saved = localStorage.getItem('culina_dishes');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((d: Dish) => !d.id.startsWith('dish-')) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('culina_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((r: Review) => !r.id.startsWith('rev-')) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [chatLogs, setChatLogs] = useState<ChatLogRecord[]>(() => {
    try {
      const saved = localStorage.getItem('culina_chat_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((c: ChatLogRecord) => !c.id.startsWith('log-')) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [guestQueriesRemaining, setGuestQueriesRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('culina_guest_queries');
      return saved !== null ? Number(saved) : 3;
    } catch {
      return 3;
    }
  });

  // Auth async state
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // UI state
  const [activeDishModal, setActiveDishModal] = useState<Dish | null>(null);
  const [cookingDish, setCookingDish] = useState<Dish | null>(null);
  const [authModalType, setAuthModalTypeState] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [isTasteProfileModalOpen, setIsTasteProfileModalOpen] = useState(false);
  const [isPersonalDataModalOpen, setIsPersonalDataModalOpen] = useState(false);
  const [isFridgeModalOpen, setIsFridgeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWelcomeIntroOpen, setIsWelcomeIntroOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'recommendations' | 'chat' | 'admin' | 'auth'>('browse');

  const setAuthModalType = (type: 'login' | 'register' | 'forgot' | null) => {
    setAuthModalTypeState(type);
    if (type) {
      setActiveTab('auth');
    } else if (activeTab === 'auth') {
      setActiveTab('browse');
    }
  };

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('culina_users', JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('culina_dishes', JSON.stringify(dishes));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [dishes]);

  useEffect(() => {
    try {
      localStorage.setItem('culina_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem('culina_chat_logs', JSON.stringify(chatLogs));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [chatLogs]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('culina_current_user_id', currentUser.id);
      } else {
        localStorage.setItem('culina_current_user_id', 'guest');
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('culina_guest_queries', guestQueriesRemaining.toString());
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [guestQueriesRemaining]);

  // ── Khôi phục session khi app khởi động ──────────────────────────────────────
  useEffect(() => {
    if (!isTokenStored()) return;

    setAuthLoading(true);
    apiGetMe()
      .then((apiUser: AuthUser) => {
        const savedId = apiUser.id;
        const savedUsers = localStorage.getItem('culina_users');
        let existing: User | undefined;
        if (savedUsers) {
          try {
            const parsed: User[] = JSON.parse(savedUsers);
            existing = parsed.find((u) => u.id === savedId);
          } catch {}
        }

        const restoredUser: User = existing ?? {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.displayName,
          role: apiUser.role as 'user' | 'admin',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apiUser.displayName)}&background=0D9488&color=fff`,
          phone: '',
          status: 'active',
          createdAt: apiUser.createdAt ?? new Date().toISOString(),
          tasteProfile: {
            name: apiUser.displayName,
            diet: 'Bình thường',
            allergies: [],
            dislikes: [],
            spiceTolerance: 'Cay nhẹ',
            targetCalories: 1800,
            healthGoal: 'Duy trì vóc dáng & ăn ngon',
            favoriteCuisines: ['Việt Nam'],
            waterTargetLiters: 2.0,
            dailyMealsCount: 3,
          },
          favorites: [],
          mealHistory: [],
        };

        setCurrentUser(restoredUser);
      })
      .catch(() => {
        clearTokens();
        setCurrentUser(null);
      })
      .finally(() => setAuthLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth Handlers (kết nối API thật) ─────────────────────────────────────
  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await apiLogin({ email, password: password ?? '' });

      // Map AuthUser → User
      const savedUsers = localStorage.getItem('culina_users');
      let existing: User | undefined;
      if (savedUsers) {
        try {
          const parsed: User[] = JSON.parse(savedUsers);
          existing = parsed.find((u) => u.id === result.user.id);
        } catch {}
      }

      const loggedInUser: User = existing ?? {
        id: result.user.id,
        email: result.user.email,
        name: result.user.displayName,
        role: result.user.role as 'user' | 'admin',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.user.displayName)}&background=0D9488&color=fff`,
        phone: '',
        status: 'active',
        createdAt: new Date().toISOString(),
        tasteProfile: {
          name: result.user.displayName,
          diet: 'Bình thường',
          allergies: [],
          dislikes: [],
          spiceTolerance: 'Cay nhẹ',
          targetCalories: 1800,
          healthGoal: 'Duy trì vóc dáng & ăn ngon',
          favoriteCuisines: ['Việt Nam'],
          waterTargetLiters: 2.0,
          dailyMealsCount: 3,
        },
        favorites: [],
        mealHistory: [],
      };

      setCurrentUser(loggedInUser);
      setAuthModalType(null);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại.';
      setAuthError(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setAuthLoading(true);
    try {
      await apiLogout();
    } finally {
      setCurrentUser(null);
      setAuthError(null);
      if (activeTab === 'admin') {
        setActiveTab('browse');
      }
      setAuthLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    initialTaste?: Partial<TasteProfile>
  ): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await apiRegister({
        email,
        password,
        displayName: name,
        phone,
      });

      const defaultProfile: TasteProfile = {
        name,
        diet: initialTaste?.diet || 'Bình thường',
        allergies: initialTaste?.allergies || [],
        dislikes: initialTaste?.dislikes || [],
        spiceTolerance: initialTaste?.spiceTolerance || 'Cay nhẹ',
        targetCalories: initialTaste?.targetCalories || 1800,
        healthGoal: initialTaste?.healthGoal || 'Duy trì vóc dáng & ăn ngon',
        favoriteCuisines: initialTaste?.favoriteCuisines || ['Việt Nam'],
        waterTargetLiters: 2.0,
        dailyMealsCount: 3,
      };

      const newUser: User = {
        id: result.user.id,
        name: result.user.displayName,
        email: result.user.email,
        role: result.user.role as 'user' | 'admin',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`,
        phone: phone || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        tasteProfile: defaultProfile,
        favorites: [],
        mealHistory: [],
      };

      setUsers((prev) => {
        const exists = prev.some((u) => u.id === newUser.id);
        return exists ? prev : [...prev, newUser];
      });
      setCurrentUser(newUser);
      setAuthModalType(null);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký thất bại.';
      setAuthError(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetPassword = (email: string, _newPass: string): boolean => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    return true;
  };

  const switchAccount = (userId: string) => {
    if (userId === 'guest') {
      setCurrentUser(null);
    } else {
      const found = users.find((u) => u.id === userId);
      if (found) setCurrentUser(found);
    }
  };

  const decrementGuestQuery = (): boolean => {
    if (guestQueriesRemaining <= 0) return false;
    setGuestQueriesRemaining((prev) => Math.max(0, prev - 1));
    return true;
  };

  // User Profile actions
  const updateTasteProfile = (profile: Partial<TasteProfile>) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      tasteProfile: {
        ...currentUser.tasteProfile,
        ...profile,
      },
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const updateUserProfile = (name: string, avatar: string, phone?: string) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      name,
      avatar,
      phone: phone || currentUser.phone,
      tasteProfile: {
        ...currentUser.tasteProfile,
        name,
      },
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const toggleFavorite = (dishId: string) => {
    if (!currentUser) {
      setAuthModalType('login');
      return;
    }
    const isFav = currentUser.favorites.includes(dishId);
    const newFavorites = isFav
      ? currentUser.favorites.filter((id) => id !== dishId)
      : [...currentUser.favorites, dishId];

    const updatedUser = {
      ...currentUser,
      favorites: newFavorites,
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const recordCookedMeal = (dish: Dish, mealType: string) => {
    if (!currentUser) return;
    const newItem: MealHistoryItem = {
      id: `hist-${Date.now()}`,
      dishId: dish.id,
      dishName: dish.name,
      dishImage: dish.image,
      date: new Date().toISOString().split('T')[0],
      mealType,
      calories: dish.calories,
    };
    const updatedUser = {
      ...currentUser,
      mealHistory: [newItem, ...currentUser.mealHistory],
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const deleteMealHistoryItem = (historyId: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      mealHistory: currentUser.mealHistory.filter((item) => item.id !== historyId),
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const exportPersonalData = () => {
    if (!currentUser) return;
    const dataToExport = {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        createdAt: currentUser.createdAt,
      },
      tasteProfile: currentUser.tasteProfile,
      favoriteDishes: currentUser.favorites.map((id) => {
        const d = dishes.find((dish) => dish.id === id);
        return d ? { id: d.id, name: d.name, calories: d.calories } : id;
      }),
      cookingHistory: currentUser.mealHistory,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `culina-ai-data-${currentUser.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dish CRUD
  const addDish = (dishData: Omit<Dish, 'id' | 'rating' | 'ratingCount'>) => {
    const newDish: Dish = {
      ...dishData,
      id: `dish-${Date.now()}`,
      rating: 5.0,
      ratingCount: 1,
    };
    setDishes((prev) => [newDish, ...prev]);
  };

  const updateDish = (updatedDish: Dish) => {
    setDishes((prev) => prev.map((d) => (d.id === updatedDish.id ? updatedDish : d)));
  };

  const deleteDish = (dishId: string) => {
    setDishes((prev) => prev.filter((d) => d.id !== dishId));
  };

  const togglePublishDish = (dishId: string) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isPublished: !d.isPublished } : d))
    );
  };

  // Reviews
  const addReview = (dishId: string, rating: number, comment: string) => {
    if (!currentUser) {
      setAuthModalType('login');
      return;
    }
    const reviewerName = currentUser.name;
    const reviewerAvatar = currentUser.avatar;
    const reviewerId = currentUser.id;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      dishId,
      userId: reviewerId,
      userName: reviewerName,
      userAvatar: reviewerAvatar,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
    };

    setReviews((prev) => [newReview, ...prev]);

    // Recalculate average dish rating
    setDishes((prev) =>
      prev.map((dish) => {
        if (dish.id === dishId) {
          const dishReviews = [...reviews.filter((r) => r.dishId === dishId), newReview];
          const avg =
            dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length;
          return {
            ...dish,
            rating: Number(avg.toFixed(1)),
            ratingCount: dishReviews.length,
          };
        }
        return dish;
      })
    );
  };

  // Chat Logging
  const logChatQuery = (recordData: Omit<ChatLogRecord, 'id' | 'timestamp'>) => {
    const newRecord: ChatLogRecord = {
      ...recordData,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setChatLogs((prev) => [newRecord, ...prev]);
  };

  const updateChatFeedback = (logId: string, feedback: 'helpful' | 'unhelpful') => {
    setChatLogs((prev) =>
      prev.map((log) => (log.id === logId ? { ...log, feedback } : log))
    );
  };

  // Admin user controls
  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'blocked' : 'active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const changeUserRole = (userId: string, newRole: 'user' | 'admin') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  // Personalized Match Score Engine
  const calculateDishMatchScore = (dish: Dish, profile?: TasteProfile) => {
    const targetProfile = profile || currentUser?.tasteProfile;
    if (!targetProfile) {
      return { score: 75, reasons: ['Món ăn thịnh hành được nhiều người yêu thích'], isAllergic: false };
    }

    let score = 50;
    const reasons: string[] = [];
    let isAllergic = false;

    // Check Allergies
    if (targetProfile.allergies && targetProfile.allergies.length > 0) {
      const matchedAllergies = dish.allergenWarnings.filter((a) =>
        targetProfile.allergies.includes(a)
      );
      if (matchedAllergies.length > 0) {
        isAllergic = true;
        score -= 40;
        reasons.push(`CẢNH BÁO: Chứa thành phần dị ứng (${matchedAllergies.join(', ')})`);
      } else {
        score += 20;
        reasons.push('An toàn tuyệt đối: Không chứa chất bạn dị ứng');
      }
    } else {
      score += 10;
    }

    // Check Diet
    if (targetProfile.diet && targetProfile.diet !== 'Bình thường') {
      const matchDiet = dish.dietTags.some(
        (tag) => tag.toLowerCase() === targetProfile.diet.toLowerCase()
      );
      if (matchDiet) {
        score += 25;
        reasons.push(`Khớp chế độ ăn ${targetProfile.diet}`);
      } else if (
        (targetProfile.diet === 'Ăn chay' || targetProfile.diet === 'Thuần chay') &&
        !dish.dietTags.includes('Ăn chay') &&
        !dish.dietTags.includes('Thuần chay')
      ) {
        score -= 35;
        reasons.push('Không phù hợp chế độ ăn chay của bạn');
      }
    }

    // Check Disliked ingredients
    if (targetProfile.dislikes && targetProfile.dislikes.length > 0) {
      const hasDislike = dish.ingredients.some((ing) =>
        targetProfile.dislikes.some((dis) => ing.name.toLowerCase().includes(dis.toLowerCase()))
      );
      if (hasDislike) {
        score -= 15;
        reasons.push('Có chứa nguyên liệu bạn không thích');
      }
    }

    // Check Spice tolerance
    if (targetProfile.spiceTolerance) {
      if (targetProfile.spiceTolerance === 'Không cay' && dish.spiceLevel !== 'Không cay') {
        score -= 10;
      } else if (targetProfile.spiceTolerance === dish.spiceLevel) {
        score += 10;
        reasons.push(`Độ cay chuẩn gu: ${dish.spiceLevel}`);
      }
    }

    // Check Favorite Cuisines
    if (targetProfile.favoriteCuisines && targetProfile.favoriteCuisines.length > 0) {
      const matchCuisine = targetProfile.favoriteCuisines.some((c) =>
        dish.cuisine.toLowerCase().includes(c.toLowerCase())
      );
      if (matchCuisine) {
        score += 15;
        reasons.push(`Ẩm thực ưa thích: ${dish.cuisine}`);
      }
    }

    // Check Target Calories (within +/- 150 kcal range of 1/3 daily calories)
    const idealMealCalories = Math.round(targetProfile.targetCalories / 3);
    const calDiff = Math.abs(dish.calories - idealMealCalories);
    if (calDiff <= 120) {
      score += 15;
      reasons.push(`Lượng Calo lý tưởng (~${dish.calories} kcal) cho một bữa ăn`);
    }

    const finalScore = Math.min(99, Math.max(15, score));
    return { score: finalScore, reasons, isAllergic };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isGuest: !currentUser,
        guestQueriesRemaining,
        authLoading,
        authError,
        setAuthError,
        dishes,
        users,
        reviews,
        chatLogs,
        activeDishModal,
        setActiveDishModal,
        cookingDish,
        setCookingDish,
        authModalType,
        setAuthModalType,
        isTasteProfileModalOpen,
        setIsTasteProfileModalOpen,
        isPersonalDataModalOpen,
        setIsPersonalDataModalOpen,
        isFridgeModalOpen,
        setIsFridgeModalOpen,
        isChatOpen,
        setIsChatOpen,
        isWelcomeIntroOpen,
        setIsWelcomeIntroOpen,
        activeTab,
        setActiveTab,

        login,
        logout,
        register,
        resetPassword,
        switchAccount,
        decrementGuestQuery,

        updateTasteProfile,
        updateUserProfile,
        toggleFavorite,
        recordCookedMeal,
        deleteMealHistoryItem,
        exportPersonalData,

        addDish,
        updateDish,
        deleteDish,
        togglePublishDish,

        addReview,
        logChatQuery,
        updateChatFeedback,

        toggleUserStatus,
        changeUserRole,

        calculateDishMatchScore,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
