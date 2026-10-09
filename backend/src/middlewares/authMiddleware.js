// src/middlewares/authMiddleware.js
// Xác thực JWT (Bearer token) từ Supabase Auth cho các route được bảo vệ

import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware xác thực JWT.
 * Gắn `req.user` nếu token hợp lệ, trả 401 nếu không có / hết hạn.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa xác thực. Vui lòng đăng nhập.' });
  }

  const token = authHeader.slice(7); // bỏ 'Bearer '

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    // Lấy role & status từ bảng users
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, role, status')
      .eq('id', authUser.id)
      .single();

    if (profileErr || !profile) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
    }

    if (profile.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa.' });
    }

    // Gắn vào request để các handler tiếp theo dùng
    req.user = {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      role: profile.role,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Lỗi xác thực nội bộ.' });
  }
}

/**
 * Middleware kiểm tra quyền admin.
 * Phải dùng sau `authenticate`.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền truy cập khu vực này.' });
  }
  next();
}

/**
 * Middleware tùy chọn: gắn user nếu có token, không bắt buộc.
 * Dùng cho route có thể truy cập cả guest lẫn logged-in.
 */
export async function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      req.user = null;
      return next();
    }

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, role, status')
      .eq('id', authUser.id)
      .single();

    req.user = profile
      ? {
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          role: profile.role,
        }
      : null;
  } catch {
    req.user = null;
  }

  next();
}
