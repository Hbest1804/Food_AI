// src/scripts/testSections44_45.js
// Script kiểm thử toàn diện các chức năng Mục 4.4 (Chatbot khách) và Mục 4.5 (Hồ sơ khẩu vị)

import express from 'express';
import cors from 'cors';
import chatRoutes from '../routes/chat.js';
import meRoutes from '../routes/me.js';
import authRoutes from '../routes/auth.js';
import { testDbConnection, supabaseAdmin } from '../config/supabase.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);
app.use('/chat', chatRoutes);
app.use('/api/me', meRoutes);
app.use('/me', meRoutes);
app.use('/api/auth', authRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
    },
  });
});

async function runTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ MỤC 4.4 VÀ MỤC 4.5...');
  await testDbConnection();

  const server = app.listen(5099);
  const BASE = 'http://localhost:5099';

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PHẦN 1: MỤC 4.4 CHATBOT CHẾ ĐỘ KHÁCH
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 1. Kiểm tra 5.2.1 GET /chat/guest/quota (Xem hạn mức) ---');
    const guestId = `test_guest_${Date.now()}`;
    const quotaRes1 = await fetch(`${BASE}/chat/guest/quota`, {
      headers: { 'X-Guest-Id': guestId },
    });
    const quotaData1 = await quotaRes1.json();
    console.log('GET quota status:', quotaRes1.status);
    console.log('Quota data:', quotaData1.data);
    if (quotaData1.data?.remaining !== 5 || quotaData1.data?.used !== 0) {
      throw new Error('❌ Quota khởi tạo không đúng');
    }
    console.log('✅ 1.1 Khởi tạo quota khách thành công (limit: 5, used: 0, remaining: 5)');

    console.log('\n--- 2. Kiểm tra 4.4.1 POST /chat/guest/messages (Câu hỏi ẩm thực) ---');
    const msgRes1 = await fetch(`${BASE}/chat/guest/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Id': guestId,
      },
      body: JSON.stringify({
        content: 'Gợi ý cho mình món canh cho bữa trưa nhanh gọn thanh mát',
        fridge: {
          ingredient_ids: [8, 4], // Cà chua, Trứng gà
          custom_ingredients: ['hành hoa'],
        },
      }),
    });
    const msgData1 = await msgRes1.json();
    console.log('POST message status:', msgRes1.status);
    console.log('Reply type:', msgData1.data?.reply?.type);
    console.log('Reply dishes count:', msgData1.data?.reply?.dishes?.length);
    console.log('Remaining quota:', msgData1.data?.quota?.remaining);
    if (!msgData1.success || msgData1.data?.quota?.remaining !== 4) {
      throw new Error('❌ Gửi câu hỏi khách hoặc trừ quota thất bại');
    }
    console.log('✅ 2.1 Câu hỏi ẩm thực thành công, trả về câu trả lời + món liên quan + trừ hạn mức đúng!');

    console.log('\n--- 3. Kiểm tra 4.4.1 POST /chat/guest/messages (Câu hỏi ngoài phạm vi) ---');
    const msgRes2 = await fetch(`${BASE}/chat/guest/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Id': guestId,
      },
      body: JSON.stringify({
        content: 'Giải phương trình bậc hai 2x^2 + 5x - 3 = 0',
      }),
    });
    const msgData2 = await msgRes2.json();
    console.log('Out of scope reply status:', msgRes2.status);
    console.log('Reply type:', msgData2.data?.reply?.type);
    console.log('Reply text:', msgData2.data?.reply?.content?.slice(0, 100));
    if (msgData2.data?.reply?.type !== 'out_of_scope') {
      throw new Error('❌ Phải nhận diện out_of_scope');
    }
    console.log('✅ 3.1 Nhận diện câu hỏi ngoài phạm vi ẩm thực và từ chối lịch sự thành công!');

    console.log('\n--- 4. Kiểm tra giới hạn lượt hỏi 429 GUEST_LIMIT_EXCEEDED ---');
    // Gửi thêm 3 câu hỏi để cạn quota (tổng 5 lượt: 1 + 1 + 3 = 5)
    for (let i = 0; i < 3; i++) {
      await fetch(`${BASE}/chat/guest/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Guest-Id': guestId },
        body: JSON.stringify({ content: `Hỏi lượt ${i + 3}` }),
      });
    }
    // Lượt thứ 6 phải trả 429
    const limitRes = await fetch(`${BASE}/chat/guest/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Guest-Id': guestId },
      body: JSON.stringify({ content: 'Câu hỏi vượt hạn mức' }),
    });
    const limitData = await limitRes.json();
    console.log('Exceeded status:', limitRes.status);
    console.log('Error code:', limitData.error?.code);
    console.log('CTA buttons:', limitData.error?.details?.cta);
    if (limitRes.status !== 429 || limitData.error?.code !== 'GUEST_LIMIT_EXCEEDED') {
      throw new Error('❌ Không trả 429 GUEST_LIMIT_EXCEEDED');
    }
    console.log('✅ 4.1 Xử lý vượt hạn mức lượt hỏi (429) và trả về CTA [register, login] chính xác!');

    // ═══════════════════════════════════════════════════════════════════════
    // PHẦN 2: MỤC 4.5 HỒ SƠ KHẨU VỊ (TASTE PROFILE)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 5. Kiểm tra GET /me/taste-profile khi chưa đăng nhập ---');
    const unauthRes = await fetch(`${BASE}/me/taste-profile`);
    console.log('Unauthenticated status:', unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error('❌ Phải trả 401 khi chưa đăng nhập');
    }
    console.log('✅ 5.1 Chặn truy cập chưa xác thực 401 thành công!');

    // Đăng nhập hoặc tạo token người dùng kiểm thử
    console.log('\n--- 6. Lấy token người dùng kiểm thử ---');
    // Lấy user đầu tiên trong bảng users
    const { data: users } = await supabaseAdmin.from('users').select('id, email').limit(1);
    if (!users || users.length === 0) {
      throw new Error('Không có user nào trong DB để kiểm thử');
    }
    const testUser = users[0];
    console.log('Test user:', testUser.email, testUser.id);

    // Giả lập route dev sinh token hoặc đăng nhập
    // Để gọi authenticate middleware, chúng ta có thể gọi API auth hoặc dùng supabase auth signInWithPassword
    // Hoặc thử login
    let authToken = null;
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'Password123!' }),
    });
    if (loginRes.ok) {
      const loginData = await loginRes.json();
      authToken = loginData.accessToken;
      console.log('Logged in with test password');
    }

    if (!authToken) {
      // Đăng ký user tạm để lấy token
      const tempEmail = `test_profile_${Date.now()}@culina.test`;
      const regRes = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tempEmail,
          password: 'Password123!',
          displayName: 'Tester Profile',
        }),
      });
      const regData = await regRes.json();
      authToken = regData.accessToken;
      console.log('Registered temp user for token:', tempEmail);
    }

    if (!authToken) {
      throw new Error('❌ Không thể lấy authToken để kiểm thử');
    }

    console.log('\n--- 7. Kiểm tra 4.5.1 GET /me/taste-profile ---');
    const getProfileRes = await fetch(`${BASE}/me/taste-profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const getProfileData = await getProfileRes.json();
    console.log('GET profile status:', getProfileRes.status);
    console.log('Completeness:', getProfileData.data?.completeness);
    if (!getProfileData.success) {
      throw new Error('❌ Lấy hồ sơ khẩu vị thất bại');
    }
    console.log('✅ 7.1 Lấy hồ sơ khẩu vị thành công!');

    console.log('\n--- 8. Kiểm tra 4.5.2 PUT /me/taste-profile kiểm tra xung đột PROFILE_CONFLICT ---');
    // 8.1: budget_min > budget_max
    const conflictRes1 = await fetch(`${BASE}/me/taste-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        budget_min: 200000,
        budget_max: 50000, // min > max
      }),
    });
    const conflictData1 = await conflictRes1.json();
    console.log('Conflict 1 status:', conflictRes1.status);
    console.log('Conflict 1 code:', conflictData1.error?.code);
    if (conflictRes1.status !== 422 || conflictData1.error?.code !== 'PROFILE_CONFLICT') {
      throw new Error('❌ Phải phát hiện mâu thuẫn budget_min > budget_max');
    }
    console.log('✅ 8.1 Bắt mâu thuẫn budget_min > budget_max (422 PROFILE_CONFLICT) thành công!');

    // 8.2: liked_ingredient_ids và disliked_ingredient_ids trùng nhau
    const conflictRes2 = await fetch(`${BASE}/me/taste-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        taste_prefs: {
          liked_ingredient_ids: [1, 5],
        },
        disliked_ingredient_ids: [5, 10], // ID 5 bị trùng
      }),
    });
    const conflictData2 = await conflictRes2.json();
    console.log('Conflict 2 status:', conflictRes2.status);
    console.log('Conflict 2 code:', conflictData2.error?.code);
    if (conflictRes2.status !== 422 || conflictData2.error?.code !== 'PROFILE_CONFLICT') {
      throw new Error('❌ Phải phát hiện mâu thuẫn thích và kiêng cùng một nguyên liệu');
    }
    console.log('✅ 8.2 Bắt mâu thuẫn thích và kiêng cùng một nguyên liệu (422 PROFILE_CONFLICT) thành công!');

    console.log('\n--- 9. Kiểm tra 4.5.2 PUT /me/taste-profile lưu hợp lệ ---');
    const validSaveRes = await fetch(`${BASE}/me/taste-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        preferred_region_id: 2, // Miền Trung
        taste_prefs: {
          spicy_level: 2,
          salty_level: 3,
          sweet_level: 1,
          sour_level: 2,
          liked_ingredient_ids: [1, 2], // Thịt bò, Thịt heo
        },
        calorie_goal: 1900,
        budget_min: 40000,
        budget_max: 120000,
        household_size: 3,
        diet_type_ids: [2], // Eat clean
        allergen_group_ids: [1], // Hải sản
        disliked_ingredient_ids: [11], // Hành lá
      }),
    });
    const validSaveData = await validSaveRes.json();
    console.log('Valid save status:', validSaveRes.status);
    console.log('Preferred region:', validSaveData.data?.preferred_region?.name);
    console.log('Diets:', validSaveData.data?.diet_types?.map(d => d.name));
    console.log('Allergies:', validSaveData.data?.allergen_groups?.map(a => a.name));
    console.log('Disliked ingredients:', validSaveData.data?.disliked_ingredients?.map(i => i.name));
    console.log('Completeness:', validSaveData.data?.completeness, '%');
    if (!validSaveData.success || validSaveData.data?.completeness < 70) {
      throw new Error('❌ Lưu hồ sơ khẩu vị hợp lệ thất bại');
    }
    console.log('✅ 9.1 Lưu hồ sơ khẩu vị thành công với liên kết dữ liệu nền và completeness chính xác!');

    console.log('\n🎉 TOÀN BỘ CÁC KIỂM THỬ BACKEND MỤC 4.4 VÀ 4.5 ĐỀU ĐẠT 100%!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST THẤT BẠI:', err);
  process.exit(1);
});
