// src/controllers/guestChatController.js
// Xử lý Chatbot AI chế độ khách theo mục 4.4 và 5.2.1 của tài liệu đặc tả API

import crypto from 'crypto';
import { env } from '../config/appConfig.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateCulinaryReply } from '../services/aiService.js';

// Lưu trữ hạn mức khách trong RAM cache (TTL 24 giờ theo đặc tả)
// Cấu trúc: Map<guest_id, { used: number, resets_at: string, createdAt: number }>
const guestQuotaMap = new Map();

// Dọn dẹp cache sau mỗi 1 giờ đối với các session quá 24h
setInterval(() => {
  const now = Date.now();
  for (const [id, record] of guestQuotaMap.entries()) {
    if (new Date(record.resets_at).getTime() <= now) {
      guestQuotaMap.delete(id);
    }
  }
}, 60 * 60 * 1000).unref();

/**
 * Lấy hoặc khởi tạo hạn mức cho một guestId
 */
function getOrCreateQuota(guestId) {
  const limit = env.guestChatLimit || 5;
  const now = new Date();

  let record = guestQuotaMap.get(guestId);
  if (!record || new Date(record.resets_at).getTime() <= now.getTime()) {
    // Đặt hạn 24 giờ kể từ thời điểm tạo
    const resetsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    record = {
      used: 0,
      resets_at: resetsAt,
      createdAt: now.getTime(),
    };
    guestQuotaMap.set(guestId, record);
  }

  return {
    limit,
    used: record.used,
    remaining: Math.max(0, limit - record.used),
    resets_at: record.resets_at,
  };
}

/**
 * 5.2.1 Xem hạn mức lượt hỏi còn lại
 * GET /chat/guest/quota hoặc /api/chat/guest/quota
 */
export async function getGuestQuota(req, res) {
  const guestIdHeader = req.headers['x-guest-id'] || req.headers['x_guest_id'];
  const guestId = (typeof guestIdHeader === 'string' && guestIdHeader.trim())
    ? guestIdHeader.trim()
    : `guest_${crypto.randomUUID()}`;

  const quota = getOrCreateQuota(guestId);

  return res.status(200).json({
    success: true,
    data: quota,
  });
}

/**
 * 4.4.1 Gửi câu hỏi (khách)
 * POST /chat/guest/messages hoặc /api/chat/guest/messages
 */
export async function sendGuestMessage(req, res, next) {
  try {
    // ── 1. Định danh phiên khách ──────────────────────────────────────────────
    const guestIdHeader = req.headers['x-guest-id'] || req.headers['x_guest_id'];
    const guestId = (typeof guestIdHeader === 'string' && guestIdHeader.trim())
      ? guestIdHeader.trim()
      : `guest_${crypto.randomUUID()}`;

    // ── 2. Kiểm tra hạn mức lượt hỏi trước khi gọi AI ────────────────────────
    const quota = getOrCreateQuota(guestId);
    if (quota.used >= quota.limit) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'GUEST_LIMIT_EXCEEDED',
          message: 'Bạn đã sử dụng hết lượt hỏi ở Chế độ Khách. Vui lòng đăng ký hoặc đăng nhập để tiếp tục.',
          details: {
            cta: ['register', 'login'],
          },
        },
      });
    }

    // ── 3. Validate Request body ──────────────────────────────────────────────
    const { content, fridge } = req.body || {};

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nội dung câu hỏi không được để trống.',
        },
      });
    }

    if (content.length > 1000) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nội dung câu hỏi không được vượt quá 1000 ký tự.',
        },
      });
    }

    // Validate fridge nếu có
    const fridgePayload = {
      ingredient_ids: [],
      ingredient_names: [],
      custom_ingredients: [],
    };

    if (fridge && typeof fridge === 'object') {
      const ingIds = Array.isArray(fridge.ingredient_ids) ? fridge.ingredient_ids : [];
      const customIngs = Array.isArray(fridge.custom_ingredients) ? fridge.custom_ingredients : [];

      if (ingIds.length + customIngs.length > 20) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Danh sách nguyên liệu có sẵn không được vượt quá 20 nguyên liệu.',
          },
        });
      }

      fridgePayload.ingredient_ids = ingIds.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0).map(Number);
      fridgePayload.custom_ingredients = customIngs.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim());
    }

    // ── 4. Lấy ngữ cảnh món ăn liên quan từ CSDL ──────────────────────────────
    const dishesContext = await fetchDishesContext(content, fridgePayload);

    // ── 5. Gọi mô hình AI ────────────────────────────────────────────────────
    const aiResult = await generateCulinaryReply({
      content: content.trim(),
      fridge: fridgePayload,
      dishesContext,
    });

    // ── 6. Cập nhật hạn mức khách (used + 1) ──────────────────────────────────
    const record = guestQuotaMap.get(guestId);
    if (record) {
      record.used += 1;
    }

    const updatedQuota = {
      limit: quota.limit,
      used: record ? record.used : quota.used + 1,
      remaining: Math.max(0, quota.limit - (record ? record.used : quota.used + 1)),
      resets_at: quota.resets_at,
    };

    // Format dữ liệu dishes theo đặc tả: { id, name, slug, description, image_url, cook_time_minutes, difficulty }
    const formattedDishes = aiResult.dishes.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      image_url: d.image_url,
      description: d.description,
      cook_time_minutes: d.cook_time_minutes,
      difficulty: d.difficulty,
    }));

    return res.status(200).json({
      success: true,
      data: {
        guest_id: guestId,
        reply: {
          type: aiResult.type,
          content: aiResult.content,
          dishes: formattedDishes,
        },
        quota: updatedQuota,
      },
    });
  } catch (err) {
    if (err.name === 'AIServiceError') {
      return res.status(err.status).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
    }
    next(err);
  }
}

/**
 * Helper: Truy vấn các món ăn phù hợp với nguyên liệu tủ lạnh hoặc từ khóa câu hỏi
 */
async function fetchDishesContext(content, fridge) {
  try {
    let matchedDishIds = new Set();

    // 1. Nếu có ingredient_ids trong fridge, tra cứu món ăn qua dish_ingredients
    if (fridge.ingredient_ids.length > 0) {
      const { data: ingRows } = await supabaseAdmin
        .from('ingredients')
        .select('id, name')
        .in('id', fridge.ingredient_ids);

      if (ingRows) {
        fridge.ingredient_names = ingRows.map((i) => i.name);
      }

      const { data: dishIngs } = await supabaseAdmin
        .from('dish_ingredients')
        .select('dish_id')
        .in('ingredient_id', fridge.ingredient_ids);

      if (dishIngs) {
        dishIngs.forEach((row) => matchedDishIds.add(row.dish_id));
      }
    }

    // 2. Lấy danh sách món đã xuất bản
    let query = supabaseAdmin
      .from('dishes')
      .select('id, name, slug, description, image_url, cook_time_minutes, difficulty')
      .eq('is_published', true);

    if (matchedDishIds.size > 0) {
      // Ưu tiên các món có nguyên liệu khớp
      const { data: priorityDishes } = await supabaseAdmin
        .from('dishes')
        .select('id, name, slug, description, image_url, cook_time_minutes, difficulty')
        .eq('is_published', true)
        .in('id', Array.from(matchedDishIds))
        .limit(8);

      if (priorityDishes && priorityDishes.length > 0) {
        return priorityDishes;
      }
    }

    // Nếu không có món ưu tiên theo id, lấy danh sách món mẫu trong DB làm ngữ cảnh cho AI
    const { data: sampleDishes } = await query.limit(10);
    return sampleDishes || [];
  } catch (err) {
    console.error('Error fetching dishes context:', err);
    return [];
  }
}
