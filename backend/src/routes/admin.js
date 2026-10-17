// src/routes/admin.js
// Routes cho khu vực quản trị: UC10–UC16

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import {
  // UC10 – Dữ liệu cá nhân
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  deleteMyAccount,
  getMyFavorites,
  clearMyFavorites,
  getMyRatings,
  getMyViewHistory,
  clearMyViewHistory,
  deleteMyChatHistory,
  // UC11 – Quản lý món ăn
  adminGetDishes,
  adminCreateDish,
  adminGetDishDetail,
  adminUpdateDish,
  adminTogglePublishDish,
  adminDeleteDish,
  adminUpdateDishRecipe,
  adminGetDishRecipe,
  adminDeleteDishRecipe,
  // UC11 – Quản lý dữ liệu nền (Master Data)
  adminGetMasterResource,
  adminCreateMasterResource,
  adminUpdateMasterResource,
  adminDeleteMasterResource,
  // UC12 – Quản lý người dùng & Audit logs
  adminGetUsers,
  adminGetUserDetail,
  adminUpdateUser,
  adminUpdateUserStatus,
  adminUpdateUserRole,
  adminDeleteUser,
  adminGetAuditLogs,
  // UC13 – Giám sát chatbot
  adminGetChatbotOverview,
  adminGetChatSessions,
  adminGetChatSessionDetail,
  adminFlagChatMessage,
  adminGetChatbotFrequentQuestions,
  adminGetChatbotHealth,
  adminGetChatbotConfig,
  adminUpdateChatbotConfig,
  // UC14 – Thống kê
  adminGetStats,
  adminGetStatsTopDishes,
  adminGetStatsTimeseries,
  adminGetStatsSearchTrends,
  adminGetStatsExport,
  // UC16 – Danh mục
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../controllers/adminController.js';
import { handleAvatarUpload, handleDishImageUpload } from '../middlewares/uploadMiddleware.js';
import { uploadUserAvatar, uploadDishImage } from '../controllers/uploadController.js';

const router = Router();

// ─── UC10: Dữ liệu cá nhân (yêu cầu đăng nhập, không cần admin) ──────────────
router.get('/me/profile', authenticate, getMyProfile);
router.get('/me', authenticate, getMyProfile);
router.put('/me/profile', authenticate, updateMyProfile);
router.patch('/me', authenticate, updateMyProfile);
router.patch('/me/password', authenticate, changeMyPassword);
router.put('/me/password', authenticate, changeMyPassword);
router.delete('/me', authenticate, deleteMyAccount);
router.get('/me/favorites', authenticate, getMyFavorites);
router.delete('/me/favorites', authenticate, clearMyFavorites);
router.get('/me/ratings', authenticate, getMyRatings);
router.get('/me/view-history', authenticate, getMyViewHistory);
router.delete('/me/view-history', authenticate, clearMyViewHistory);
router.delete('/me/chat-history', authenticate, deleteMyChatHistory);
router.post('/me/avatar', authenticate, handleAvatarUpload, uploadUserAvatar);

// ─── Bảo vệ tất cả route dưới đây: phải là admin ─────────────────────────────
router.use('/admin', authenticate, requireAdmin);

// UC11 – Upload hình ảnh món ăn
router.post('/admin/uploads/images', handleDishImageUpload, uploadDishImage);

// UC11 – Quản lý món ăn
router.get('/admin/dishes', adminGetDishes);
router.post('/admin/dishes', adminCreateDish);
router.get('/admin/dishes/:dishId', adminGetDishDetail);
router.put('/admin/dishes/:dishId', adminUpdateDish);
router.patch('/admin/dishes/:dishId/publish', adminTogglePublishDish);
router.delete('/admin/dishes/:dishId', adminDeleteDish);
router.get('/admin/dishes/:dishId/recipe', adminGetDishRecipe);
router.put('/admin/dishes/:dishId/recipe', adminUpdateDishRecipe);
router.delete('/admin/dishes/:dishId/recipe', adminDeleteDishRecipe);

// UC11 (Luồng 3b & 3c) / Section 4.11 – Quản lý dữ liệu nền (Master Data)
router.get('/admin/master/:resource', adminGetMasterResource);
router.post('/admin/master/:resource', adminCreateMasterResource);
router.put('/admin/master/:resource/:id', adminUpdateMasterResource);
router.delete('/admin/master/:resource/:id', adminDeleteMasterResource);

// UC12 – Quản lý người dùng & Nhật ký thao tác
router.get('/admin/users', adminGetUsers);
router.get('/admin/users/:userId', adminGetUserDetail);
router.patch('/admin/users/:userId/status', adminUpdateUserStatus);
router.patch('/admin/users/:userId/role', adminUpdateUserRole);
router.patch('/admin/users/:userId', adminUpdateUser);
router.delete('/admin/users/:userId', adminDeleteUser);
router.get('/admin/audit-logs', adminGetAuditLogs);

// UC13 – Giám sát chatbot
router.get('/admin/chatbot/overview', adminGetChatbotOverview);
router.get('/admin/chatbot/sessions', adminGetChatSessions);
router.get('/admin/chatbot/conversations', adminGetChatSessions);
router.get('/admin/chatbot/sessions/:sessionId', adminGetChatSessionDetail);
router.get('/admin/chatbot/conversations/:sessionId', adminGetChatSessionDetail);
router.patch('/admin/chatbot/messages/:messageId/flag', adminFlagChatMessage);
router.get('/admin/chatbot/frequent-questions', adminGetChatbotFrequentQuestions);
router.get('/admin/chatbot/health', adminGetChatbotHealth);
router.get('/admin/chatbot/config', adminGetChatbotConfig);
router.put('/admin/chatbot/config', adminUpdateChatbotConfig);
router.get('/admin/chatbot/settings', adminGetChatbotConfig);
router.put('/admin/chatbot/settings', adminUpdateChatbotConfig);

// UC14 – Thống kê hệ thống
router.get('/admin/stats', adminGetStats);
router.get('/admin/stats/top-dishes', adminGetStatsTopDishes);
router.get('/admin/stats/timeseries', adminGetStatsTimeseries);
router.get('/admin/stats/search-trends', adminGetStatsSearchTrends);
router.get('/admin/stats/export', adminGetStatsExport);

// UC16 – Danh mục
router.get('/admin/categories', adminGetCategories);
router.post('/admin/categories', adminCreateCategory);
router.put('/admin/categories/:categoryId', adminUpdateCategory);
router.delete('/admin/categories/:categoryId', adminDeleteCategory);

export default router;
