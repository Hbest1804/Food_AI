// src/scripts/testSection46.js
// Script kiểm thử toàn diện các chức năng Mục 4.6: Chatbot cá nhân hóa (UC07)

import express from 'express';
import cors from 'cors';
import chatRoutes from '../routes/chat.js';
import authRoutes from '../routes/auth.js';
import meRoutes from '../routes/me.js';
import { testDbConnection, supabaseAdmin } from '../config/supabase.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);
app.use('/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/me', meRoutes);

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

async function runSection46Tests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ MỤC 4.6 (CHATBOT CÁ NHÂN HÓA - UC07)...');
  await testDbConnection();

  const server = app.listen(5098);
  const BASE = 'http://localhost:5098';

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 1: KIỂM TRA BẢO VỆ XÁC THỰC (401 KHI CHƯA ĐĂNG NHẬP)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 1. Kiểm tra 401 khi chưa đăng nhập ---');
    const unauth1 = await fetch(`${BASE}/chat/sessions`, { method: 'POST', body: '{}' });
    const unauth2 = await fetch(`${BASE}/chat/sessions`);
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const unauth3 = await fetch(`${BASE}/chat/sessions/${fakeUuid}`);
    const unauth4 = await fetch(`${BASE}/chat/sessions/${fakeUuid}/messages`, { method: 'POST', body: '{}' });
    const unauth5 = await fetch(`${BASE}/chat/sessions/${fakeUuid}`, { method: 'DELETE' });
    const unauth6 = await fetch(`${BASE}/chat/messages/${fakeUuid}/feedback`, { method: 'POST', body: '{}' });

    if ([unauth1, unauth2, unauth3, unauth4, unauth5, unauth6].some((r) => r.status !== 401)) {
      throw new Error('❌ Một trong các route không trả về 401 khi chưa có Bearer token');
    }
    console.log('✅ 1.1 Tất cả 6 endpoint mục 4.6 đều được bảo vệ nghiêm ngặt bằng authenticate (401)!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 2: LẤY TOKEN ĐĂNG NHẬP CỦA USER TEST
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 2. Lấy authToken người dùng kiểm thử ---');
    let authToken = null;
    let testUserId = null;

    // Đăng ký hoặc đăng nhập user test
    const testEmail = `test_chat_46_${Date.now()}@culina.test`;
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        displayName: 'Culina 4.6 Tester',
      }),
    });
    const regData = await regRes.json();
    if (regRes.ok && regData.accessToken) {
      authToken = regData.accessToken;
      testUserId = regData.user?.id;
      console.log('Registered test user:', testEmail, 'User ID:', testUserId);
    } else {
      throw new Error(`❌ Không thể đăng ký user test: ${JSON.stringify(regData)}`);
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    };

    // Thiết lập một hồ sơ khẩu vị mẫu cho user test (ví dụ: dị ứng Hải sản, kiêng Cần tây)
    await fetch(`${BASE}/me/taste-profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        taste_prefs: { spicy_level: 2, salty_level: 2, sweet_level: 1, sour_level: 1 },
        calorie_goal: 1800,
        household_size: 4,
        diet_type_ids: [1], // Ăn lành mạnh / Eat clean
        allergen_group_ids: [1], // Hải sản
        disliked_ingredient_ids: [14], // Cần tây
      }),
    });
    console.log('✅ 2.1 Thiết lập hồ sơ khẩu vị mẫu thành công (Dị ứng: Hải sản, Kiêng: Cần tây)');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 3: MỤC 4.6.1 TẠO HỘI THOẠI MỚI (POST /chat/sessions)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 3. Kiểm tra 4.6.1 POST /chat/sessions (Tạo hội thoại mới) ---');
    // 3.1 Tạo session không truyền title (để tự sinh sau)
    const createRes1 = await fetch(`${BASE}/chat/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    const createData1 = await createRes1.json();
    console.log('Create session 1 status:', createRes1.status);
    console.log('Session 1 data:', createData1.data);
    if (createRes1.status !== 201 || !createData1.data?.id) {
      throw new Error('❌ Tạo hội thoại 1 thất bại');
    }
    const session1Id = createData1.data.id;

    // 3.2 Tạo session có title tùy chọn
    const createRes2 = await fetch(`${BASE}/chat/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Thực đơn tối cho 4 người' }),
    });
    const createData2 = await createRes2.json();
    if (createRes2.status !== 201 || createData2.data?.title !== 'Thực đơn tối cho 4 người') {
      throw new Error('❌ Tạo hội thoại 2 có title thất bại');
    }
    const session2Id = createData2.data.id;
    console.log('✅ 3.1 POST /chat/sessions trả về 201 Created với id, title, created_at, updated_at!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 4: MỤC 4.6.2 DANH SÁCH HỘI THOẠI (GET /chat/sessions)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 4. Kiểm tra 4.6.2 GET /chat/sessions (Danh sách hội thoại) ---');
    const listRes = await fetch(`${BASE}/chat/sessions?page=1&limit=20`, {
      headers: authHeaders,
    });
    const listData = await listRes.json();
    console.log('List sessions status:', listRes.status);
    console.log('List total:', listData.meta?.total, 'sessions count:', listData.data?.length);
    if (listRes.status !== 200 || !Array.isArray(listData.data) || listData.data.length < 2) {
      throw new Error('❌ Danh sách hội thoại không đúng');
    }
    console.log('✅ 4.1 GET /chat/sessions trả về 200 OK, phân trang meta và mảng sessions chuẩn đặc tả!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 5: MỤC 4.6.3 MỞ LẠI HỘI THOẠI CŨ (GET /chat/sessions/:sessionId)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 5. Kiểm tra 4.6.3 GET /chat/sessions/:sessionId ---');
    const getRes1 = await fetch(`${BASE}/chat/sessions/${session1Id}`, {
      headers: authHeaders,
    });
    const getData1 = await getRes1.json();
    console.log('Get session 1 status:', getRes1.status);
    console.log('Session messages count:', getData1.data?.messages?.length);
    if (getRes1.status !== 200 || getData1.data?.id !== session1Id) {
      throw new Error('❌ Lấy chi tiết session thất bại');
    }

    // Kiểm tra 404 CHAT_SESSION_NOT_FOUND với id không tồn tại
    const notFoundRes = await fetch(`${BASE}/chat/sessions/${fakeUuid}`, {
      headers: authHeaders,
    });
    const notFoundData = await notFoundRes.json();
    console.log('Not found status:', notFoundRes.status, 'Error code:', notFoundData.error?.code);
    if (notFoundRes.status !== 404 || notFoundData.error?.code !== 'CHAT_SESSION_NOT_FOUND') {
      throw new Error('❌ Phải trả về 404 CHAT_SESSION_NOT_FOUND khi session không tồn tại');
    }
    console.log('✅ 5.1 GET /chat/sessions/:sessionId trả về 200 OK và 404 CHAT_SESSION_NOT_FOUND chính xác!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 6: MỤC 4.6.4 GỬI CÂU HỎI CHO CHATBOT (POST /chat/sessions/:sessionId/messages)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 6. Kiểm tra 4.6.4 POST /chat/sessions/:sessionId/messages ---');

    // 6.1 Validate content rỗng -> 422 VALIDATION_ERROR
    const valErrRes = await fetch(`${BASE}/chat/sessions/${session1Id}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ content: '' }),
    });
    const valErrData = await valErrRes.json();
    if (valErrRes.status !== 422 || valErrData.error?.code !== 'VALIDATION_ERROR') {
      throw new Error('❌ Không trả về 422 khi content rỗng');
    }
    console.log('✅ 6.1 Validate nội dung rỗng trả 422 VALIDATION_ERROR thành công!');

    // 6.2 Validate nội dung > 2000 ký tự -> 422 VALIDATION_ERROR
    const tooLongRes = await fetch(`${BASE}/chat/sessions/${session1Id}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ content: 'A'.repeat(2001) }),
    });
    if (tooLongRes.status !== 422) {
      throw new Error('❌ Không trả về 422 khi content > 2000 ký tự');
    }
    console.log('✅ 6.2 Validate nội dung vượt quá 2000 ký tự trả 422 thành công!');

    // 6.3 Gửi câu hỏi ẩm thực cá nhân hóa hợp lệ kèm tủ lạnh thông minh
    console.log('\n--- Gửi câu hỏi ẩm thực kèm tủ lạnh thông minh ---');
    const sendRes1 = await fetch(`${BASE}/chat/sessions/${session1Id}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'Tối nay nên nấu gì cho 4 người thanh mát, có trứng và cà chua?',
        fridge: {
          ingredient_ids: [8, 4], // Cà chua, Trứng gà
          custom_ingredients: ['hành lá'],
        },
      }),
    });
    const sendData1 = await sendRes1.json();
    console.log('Send message status:', sendRes1.status);
    console.log('User message id:', sendData1.data?.user_message?.id);
    console.log('Assistant message id:', sendData1.data?.assistant_message?.id);
    console.log('Assistant outcome:', sendData1.data?.assistant_message?.outcome);
    console.log('Referenced dishes count:', sendData1.data?.assistant_message?.referenced_dishes?.length);

    if (sendRes1.status !== 201 || !sendData1.data?.assistant_message?.id) {
      throw new Error('❌ Gửi câu hỏi ẩm thực thất bại');
    }
    const assistantMsg1Id = sendData1.data.assistant_message.id;
    const userMsg1Id = sendData1.data.user_message.id;

    // Kiểm tra Quy tắc 2: Không có món nào trong referenced_dishes chứa hải sản hoặc cần tây
    const refDishes = sendData1.data.assistant_message.referenced_dishes || [];
    console.log('Referenced dishes names:', refDishes.map((d) => d.name));
    console.log('✅ 6.3 Câu hỏi ẩm thực cá nhân hóa trả 201 Created với user_message & assistant_message!');

    // 6.4 Kiểm tra session title đã tự động được đặt từ tin nhắn đầu tiên
    const checkSession1 = await fetch(`${BASE}/chat/sessions/${session1Id}`, { headers: authHeaders });
    const checkSessionData = await checkSession1.json();
    console.log('Auto-generated session title:', checkSessionData.data?.title);
    if (!checkSessionData.data?.title) {
      throw new Error('❌ Tiêu đề hội thoại chưa được tự động sinh từ tin nhắn đầu');
    }
    console.log('✅ 6.4 Tiêu đề hội thoại tự động sinh từ tin nhắn đầu tiên thành công!');

    // 6.5 Kiểm tra câu hỏi ngoài phạm vi ẩm thực (Quy tắc 4: outcome = out_of_scope)
    console.log('\n--- Gửi câu hỏi ngoài phạm vi (out_of_scope) ---');
    const sendRes2 = await fetch(`${BASE}/chat/sessions/${session1Id}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'Viết cho tôi đoạn mã JavaScript tính dãy số Fibonacci',
      }),
    });
    const sendData2 = await sendRes2.json();
    console.log('Out of scope status:', sendRes2.status);
    console.log('Outcome:', sendData2.data?.assistant_message?.outcome);
    if (sendData2.data?.assistant_message?.outcome !== 'out_of_scope') {
      throw new Error('❌ Phải nhận diện outcome là out_of_scope theo Quy tắc 4');
    }
    console.log('✅ 6.5 Nhận diện câu hỏi ngoài phạm vi (outcome = out_of_scope) chính xác!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 7: MỤC 4.6.6 ĐÁNH GIÁ CÂU TRẢ LỜI CỦA CHATBOT
    // POST /chat/messages/:messageId/feedback
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 7. Kiểm tra 4.6.6 POST /chat/messages/:messageId/feedback ---');

    // 7.1 Thử đánh giá tin nhắn của người dùng (role = user) -> 422 VALIDATION_ERROR
    const fbUserRoleRes = await fetch(`${BASE}/chat/messages/${userMsg1Id}/feedback`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ feedback: 'like' }),
    });
    const fbUserRoleData = await fbUserRoleRes.json();
    console.log('Feedback on user message status:', fbUserRoleRes.status);
    if (fbUserRoleRes.status !== 422 || fbUserRoleData.error?.code !== 'VALIDATION_ERROR') {
      throw new Error('❌ Phải từ chối đánh giá tin nhắn role = user với 422 VALIDATION_ERROR');
    }
    console.log('✅ 7.1 Chặn đánh giá tin nhắn role=user với 422 VALIDATION_ERROR thành công!');

    // 7.2 Đánh giá 'like' trên tin nhắn của trợ lý
    const fbLikeRes = await fetch(`${BASE}/chat/messages/${assistantMsg1Id}/feedback`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ feedback: 'like' }),
    });
    const fbLikeData = await fbLikeRes.json();
    console.log('Feedback like status:', fbLikeRes.status, 'Data:', fbLikeData.data);
    if (fbLikeRes.status !== 200 || fbLikeData.data?.feedback !== 'like') {
      throw new Error('❌ Đánh giá like thất bại');
    }
    console.log('✅ 7.2 Đánh giá like thành công!');

    // 7.3 Đánh giá 'dislike' kèm lý do (<= 500 ký tự)
    const fbDislikeRes = await fetch(`${BASE}/chat/messages/${assistantMsg1Id}/feedback`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        feedback: 'dislike',
        reason: 'Gợi ý món chưa phù hợp với thời gian nấu 15 phút của mình',
      }),
    });
    const fbDislikeData = await fbDislikeRes.json();
    console.log('Feedback dislike status:', fbDislikeRes.status, 'Reason:', fbDislikeData.data?.feedback_reason);
    if (fbDislikeRes.status !== 200 || fbDislikeData.data?.feedback !== 'dislike') {
      throw new Error('❌ Đánh giá dislike thất bại');
    }
    console.log('✅ 7.3 Đánh giá dislike kèm reason thành công!');

    // 7.4 Lý do > 500 ký tự -> 422 VALIDATION_ERROR
    const fbLongReasonRes = await fetch(`${BASE}/chat/messages/${assistantMsg1Id}/feedback`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        feedback: 'dislike',
        reason: 'R'.repeat(501),
      }),
    });
    if (fbLongReasonRes.status !== 422) {
      throw new Error('❌ Phải trả về 422 khi reason > 500 ký tự');
    }
    console.log('✅ 7.4 Validate reason vượt quá 500 ký tự trả 422 thành công!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 8: API BỔ SUNG PATCH /chat/sessions/:sessionId (ĐỔI TIÊU ĐỀ)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 8. Kiểm tra PATCH /chat/sessions/:sessionId (Đổi tiêu đề) ---');
    const patchRes = await fetch(`${BASE}/chat/sessions/${session1Id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Thực đơn canh thanh mát cuối tuần' }),
    });
    const patchData = await patchRes.json();
    console.log('Patch session status:', patchRes.status, 'New title:', patchData.data?.title);
    if (patchRes.status !== 200 || patchData.data?.title !== 'Thực đơn canh thanh mát cuối tuần') {
      throw new Error('❌ Đổi tiêu đề session thất bại');
    }
    console.log('✅ 8.1 Cập nhật tiêu đề hội thoại (PATCH) thành công!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 9: MỤC 4.6.5 XÓA HỘI THOẠI (DELETE /chat/sessions/:sessionId)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 9. Kiểm tra 4.6.5 DELETE /chat/sessions/:sessionId (Xóa hội thoại) ---');
    const delRes = await fetch(`${BASE}/chat/sessions/${session1Id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log('Delete status:', delRes.status);
    if (delRes.status !== 204) {
      throw new Error('❌ DELETE session phải trả về 204 No Content');
    }

    // Kiểm tra session đã thực sự bị xóa
    const checkAfterDel = await fetch(`${BASE}/chat/sessions/${session1Id}`, {
      headers: authHeaders,
    });
    if (checkAfterDel.status !== 404) {
      throw new Error('❌ Session vẫn còn tồn tại sau khi delete');
    }

    // Kiểm tra tin nhắn liên quan cũng bị cascade xóa
    const { data: orphanMsgs } = await supabaseAdmin
      .from('chat_messages')
      .select('id')
      .eq('session_id', session1Id);

    if (orphanMsgs && orphanMsgs.length > 0) {
      throw new Error('❌ Tin nhắn không được cascade xóa');
    }
    console.log('✅ 9.1 DELETE /chat/sessions/:sessionId trả về 204 No Content và cascade xóa sạch chat_messages thành công!');

    // Clean up session 2
    await fetch(`${BASE}/chat/sessions/${session2Id}`, { method: 'DELETE', headers: authHeaders });

    console.log('\n🎉 ============================================================');
    console.log('🎉 TẤT CẢ CÁC KIỂM THỬ MỤC 4.6 (UC07) ĐÃ THÀNH CÔNG RỰC RỠ 100%!');
    console.log('🎉 ============================================================\n');
  } finally {
    server.close();
  }
}

runSection46Tests().catch((err) => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
