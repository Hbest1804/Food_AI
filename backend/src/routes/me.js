// src/routes/me.js
// Routes cho Hồ sơ khẩu vị, gợi ý cá nhân hóa và thông tin cá nhân

import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getTasteProfile,
  updateTasteProfile,
  patchTasteProfile,
} from '../controllers/tasteProfileController.js';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = Router();

// Mọi API trong nhóm yêu cầu đăng nhập (authenticate middleware)
router.use(authenticate);

// 4.5.1 Xem hồ sơ khẩu vị - GET /me/taste-profile
router.get('/taste-profile', getTasteProfile);

// 4.5.2 Lưu hồ sơ khẩu vị (ghi đè toàn bộ) - PUT /me/taste-profile
router.put('/taste-profile', updateTasteProfile);

// 5.3.1 Cập nhật một phần hồ sơ khẩu vị - PATCH /me/taste-profile
router.patch('/taste-profile', patchTasteProfile);

// 4.7.1 Nhận gợi ý món ăn - GET /me/recommendations
router.get('/recommendations', getRecommendations);

export default router;

