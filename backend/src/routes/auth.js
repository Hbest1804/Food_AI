// src/routes/auth.js
// Route definitions cho API xác thực

import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  refresh,
  requestPasswordReset,
  verifyPasswordReset,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @route  POST /api/auth/register
 * @desc   Đăng ký tài khoản mới
 * @access Public
 * @body   { email, password, displayName?, phone? }
 */
router.post('/register', register);

/**
 * @route  POST /api/auth/login
 * @desc   Đăng nhập → trả về JWT access token
 * @access Public
 * @body   { email, password }
 */
router.post('/login', login);

/**
 * @route  POST /api/auth/logout
 * @desc   Vô hiệu hoá session Supabase
 * @access Public (token tùy chọn)
 */
router.post('/logout', logout);

/**
 * @route  GET /api/auth/me
 * @desc   Lấy thông tin người dùng hiện tại
 * @access Protected (Bearer token)
 */
router.get('/me', authenticate, me);

/**
 * @route  POST /api/auth/refresh
 * @desc   Làm mới access token bằng refresh token
 * @access Public
 * @body   { refreshToken }
 */
router.post('/refresh', refresh);

/**
 * @route  POST /api/auth/forgot-password
 * @desc   Gửi email yêu cầu đặt lại mật khẩu
 * @access Public
 * @body   { email }
 */
router.post('/forgot-password', requestPasswordReset);

/**
 * @route  POST /api/auth/reset-password/verify
 * @desc   Kiểm tra tính hợp lệ của token/liên kết đặt lại mật khẩu
 * @access Public
 * @body   { token }
 */
router.post('/reset-password/verify', verifyPasswordReset);

/**
 * @route  POST /api/auth/reset-password
 * @desc   Đặt mật khẩu mới
 * @access Public (Cần token từ email trong body)
 * @body   { token, new_password, confirm_password }
 */
router.post('/reset-password', resetPassword);

export default router;
