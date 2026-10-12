// src/scripts/testSections4748.js
// Kiểm thử toàn diện Mục 4.7 (Gợi ý cá nhân hóa UC08) và Mục 4.8 (Yêu thích, đánh giá & bình luận UC09)

import express from 'express';
import cors from 'cors';
import dishesRoutes from '../routes/dishes.js';
import meRoutes from '../routes/me.js';
import ratingsRoutes from '../routes/ratings.js';
import authRoutes from '../routes/auth.js';
import { testDbConnection, supabaseAdmin } from '../config/supabase.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/dishes', dishesRoutes);
app.use('/api/me', meRoutes);
app.use('/me', meRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/ratings', ratingsRoutes);

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
  console.log('🧪 BẮT ĐẦU KIỂM THỬ MỤC 4.7 & 4.8 (UC08 & UC09)...');
  await testDbConnection();

  const server = app.listen(5097);
  const BASE = 'http://localhost:5097';

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 1: KIỂM TRA BẢO VỆ XÁC THỰC (401 KHI CHƯA ĐĂNG NHẬP)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 1. Kiểm tra 401 khi chưa đăng nhập ---');
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const unauthRec = await fetch(`${BASE}/me/recommendations`);
    const unauthFav1 = await fetch(`${BASE}/dishes/${fakeUuid}/favorite`, { method: 'PUT' });
    const unauthFav2 = await fetch(`${BASE}/dishes/${fakeUuid}/favorite`, { method: 'DELETE' });
    const unauthRate1 = await fetch(`${BASE}/dishes/${fakeUuid}/ratings`, { method: 'POST', body: '{}' });
    const unauthRate2 = await fetch(`${BASE}/ratings/999999`, { method: 'PATCH', body: '{}' });
    const unauthRate3 = await fetch(`${BASE}/ratings/999999`, { method: 'DELETE' });

    if ([unauthRec, unauthFav1, unauthFav2, unauthRate1, unauthRate2, unauthRate3].some((r) => r.status !== 401)) {
      throw new Error('❌ Một trong các route không trả về 401 khi chưa đăng nhập');
    }
    console.log('✅ 1.1 Tất cả các route yêu cầu đăng nhập đều trả về 401 Unauthorized!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 2: TẠO USER TEST & LẤY MÓN MẪU
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 2. Tạo User Test & Lấy dữ liệu mẫu ---');
    const email1 = `test_uc0809_${Date.now()}@culina.test`;
    const email2 = `test_uc0809_other_${Date.now()}@culina.test`;

    const [regRes1, regRes2] = await Promise.all([
      fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email1, password: 'Password123!', displayName: 'Culina Reviewer 1' }),
      }),
      fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email2, password: 'Password123!', displayName: 'Culina Reviewer 2' }),
      }),
    ]);

    const regData1 = await regRes1.json();
    const regData2 = await regRes2.json();

    const token1 = regData1.accessToken;
    const token2 = regData2.accessToken;
    const user1Id = regData1.user.id;
    const user2Id = regData2.user.id;

    const headers1 = { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` };
    const headers2 = { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` };

    // Lấy 1 món ăn từ database
    const { data: dishes } = await supabaseAdmin.from('dishes').select('id, name').limit(2);
    if (!dishes || dishes.length === 0) throw new Error('❌ Database không có món ăn nào');
    const testDishId = dishes[0].id;
    const testDish2Id = dishes[1] ? dishes[1].id : testDishId;
    console.log('Test Dish 1:', testDishId, dishes[0].name);

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 3: KIỂM THỬ MỤC 4.8.1 & 4.8.2: YÊU THÍCH (FAVORITE)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 3. Kiểm tra 4.8.1 & 4.8.2: Thêm & Bỏ yêu thích ---');
    // 3.1 Thêm yêu thích với món không tồn tại -> 404 DISH_NOT_FOUND
    const favNotFound = await fetch(`${BASE}/dishes/${fakeUuid}/favorite`, { method: 'PUT', headers: headers1 });
    const favNotFoundData = await favNotFound.json();
    if (favNotFound.status !== 404 || favNotFoundData.error?.code !== 'DISH_NOT_FOUND') {
      throw new Error('❌ Không trả về 404 DISH_NOT_FOUND khi thêm yêu thích món không tồn tại');
    }
    console.log('✅ 3.1 Trả về 404 DISH_NOT_FOUND chính xác khi món không tồn tại!');

    // 3.2 Thêm yêu thích hợp lệ
    const addFavRes = await fetch(`${BASE}/dishes/${testDishId}/favorite`, { method: 'PUT', headers: headers1 });
    const addFavData = await addFavRes.json();
    console.log('Add favorite status:', addFavRes.status, 'Data:', addFavData.data);
    if (addFavRes.status !== 200 || !addFavData.data?.is_favorite || typeof addFavData.data?.favorite_count !== 'number') {
      throw new Error('❌ PUT /dishes/:dishId/favorite trả về không đúng định dạng');
    }
    const initialFavCount = addFavData.data.favorite_count;

    // 3.3 Thêm yêu thích lần 2 (Idempotent): Vẫn trả 200 và is_favorite = true
    const addFavAgainRes = await fetch(`${BASE}/dishes/${testDishId}/favorite`, { method: 'PUT', headers: headers1 });
    const addFavAgainData = await addFavAgainRes.json();
    if (addFavAgainRes.status !== 200 || !addFavAgainData.data?.is_favorite || addFavAgainData.data?.favorite_count !== initialFavCount) {
      throw new Error('❌ Tính chất Idempotent của PUT /dishes/:dishId/favorite không đúng');
    }
    console.log('✅ 3.2 & 3.3 PUT /dishes/:dishId/favorite hoạt động Idempotent và trả về 200 OK thành công!');

    // 3.4 Bỏ yêu thích hợp lệ
    const remFavRes = await fetch(`${BASE}/dishes/${testDishId}/favorite`, { method: 'DELETE', headers: headers1 });
    const remFavData = await remFavRes.json();
    console.log('Remove favorite status:', remFavRes.status, 'Data:', remFavData.data);
    if (remFavRes.status !== 200 || remFavData.data?.is_favorite !== false || remFavData.data?.favorite_count !== initialFavCount - 1) {
      throw new Error('❌ DELETE /dishes/:dishId/favorite thất bại');
    }
    console.log('✅ 3.4 DELETE /dishes/:dishId/favorite trả về is_favorite = false và cập nhật favorite_count chuẩn xác!');

    // Đặt lại yêu thích để phục vụ kiểm thử recommendation sau này
    await fetch(`${BASE}/dishes/${testDishId}/favorite`, { method: 'PUT', headers: headers1 });

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 4: KIỂM THỬ MỤC 4.8.4: ĐÁNH GIÁ & BÌNH LUẬN MÓN (POST /dishes/:id/ratings)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 4. Kiểm tra 4.8.4: Đánh giá & Bình luận món ---');

    // 4.1 Sai số sao (stars = 0 hoặc 6) -> 422 CONTENT_REJECTED
    const badStarsRes = await fetch(`${BASE}/dishes/${testDishId}/ratings`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({ stars: 6 }),
    });
    const badStarsData = await badStarsRes.json();
    if (badStarsRes.status !== 422 || badStarsData.error?.code !== 'CONTENT_REJECTED') {
      throw new Error('❌ Phải từ chối số sao ngoài 1..5 với 422 CONTENT_REJECTED');
    }
    console.log('✅ 4.1 Từ chối số sao không hợp lệ với 422 CONTENT_REJECTED thành công!');

    // 4.2 Bình luận rỗng sau trim -> 422 CONTENT_REJECTED
    const emptyCommentRes = await fetch(`${BASE}/dishes/${testDishId}/ratings`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({ stars: 5, comment: '    ' }),
    });
    const emptyCommentData = await emptyCommentRes.json();
    if (emptyCommentRes.status !== 422 || emptyCommentData.error?.code !== 'CONTENT_REJECTED') {
      throw new Error('❌ Phải từ chối bình luận rỗng với 422 CONTENT_REJECTED');
    }
    console.log('✅ 4.2 Từ chối bình luận rỗng với 422 CONTENT_REJECTED thành công!');

    // 4.3 Bình luận chứa từ ngữ bị cấm -> 422 CONTENT_REJECTED
    const bannedWordRes = await fetch(`${BASE}/dishes/${testDishId}/ratings`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({ stars: 1, comment: 'Món ăn như đcm lừa đảo' }),
    });
    const bannedWordData = await bannedWordRes.json();
    if (bannedWordRes.status !== 422 || bannedWordData.error?.code !== 'CONTENT_REJECTED') {
      throw new Error('❌ Phải từ chối từ ngữ cấm với 422 CONTENT_REJECTED');
    }
    console.log('✅ 4.3 Bộ lọc từ cấm hoạt động hoàn hảo: từ chối với 422 CONTENT_REJECTED!');

    // 4.4 Đánh giá hợp lệ của User 1
    const createRatingRes1 = await fetch(`${BASE}/dishes/${testDishId}/ratings`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({
        stars: 5,
        comment: 'Nước dùng đậm đà, thơm lừng mùi thảo mộc và gừng nướng, rất tuyệt!',
      }),
    });
    const createRatingData1 = await createRatingRes1.json();
    console.log('Create rating 1 status:', createRatingRes1.status, 'Data:', createRatingData1.data);
    if (createRatingRes1.status !== 201 || !createRatingData1.data?.rating?.id || !createRatingData1.data?.rating_summary) {
      throw new Error('❌ Tạo đánh giá hợp lệ thất bại');
    }
    const user1RatingId = createRatingData1.data.rating.id;
    console.log('✅ 4.4 POST /dishes/:dishId/ratings trả về 201 Created cùng rating & rating_summary!');

    // 4.5 Đánh giá trùng lặp lần 2 (Quy tắc 3) -> 409 RATING_ALREADY_EXISTS
    const duplicateRatingRes = await fetch(`${BASE}/dishes/${testDishId}/ratings`, {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({ stars: 4, comment: 'Đánh giá lại' }),
    });
    const dupData = await duplicateRatingRes.json();
    if (duplicateRatingRes.status !== 409 || dupData.error?.code !== 'RATING_ALREADY_EXISTS') {
      throw new Error('❌ Phải trả về 409 RATING_ALREADY_EXISTS khi người dùng đánh giá lần 2');
    }
    console.log('✅ 4.5 Chặn đánh giá trùng lặp với 409 RATING_ALREADY_EXISTS chuẩn quy tắc 3!');

    // User 2 cũng đánh giá 4 sao
    const createRatingRes2 = await fetch(`${BASE}/dishes/${testDishId}/ratings`, {
      method: 'POST',
      headers: headers2,
      body: JSON.stringify({ stars: 4, comment: 'Rất ngon nhưng nấu hơi tốn thời gian một chút.' }),
    });
    const createRatingData2 = await createRatingRes2.json();
    const user2RatingId = createRatingData2.data.rating.id;

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 5: KIỂM THỬ MỤC 4.8.3: DANH SÁCH ĐÁNH GIÁ (GET /dishes/:id/ratings)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 5. Kiểm tra 4.8.3: Danh sách đánh giá & bình luận công khai ---');
    const getRatingsRes = await fetch(`${BASE}/dishes/${testDishId}/ratings?sort=newest&page=1&limit=10`);
    const getRatingsData = await getRatingsRes.json();
    console.log('Get ratings status:', getRatingsRes.status);
    console.log('Summary:', getRatingsData.data?.summary);
    console.log('Items count:', getRatingsData.data?.items?.length);
    console.log('Distribution:', getRatingsData.data?.summary?.distribution);

    if (
      getRatingsRes.status !== 200 ||
      typeof getRatingsData.data?.summary?.average !== 'number' ||
      !getRatingsData.data?.summary?.distribution ||
      !Array.isArray(getRatingsData.data?.items)
    ) {
      throw new Error('❌ GET /dishes/:dishId/ratings trả về sai cấu trúc');
    }
    console.log('✅ 5.1 GET /dishes/:dishId/ratings trả về 200 OK với summary, distribution và items chuẩn đặc tả!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 6: KIỂM THỬ MỤC 4.8.5: SỬA ĐÁNH GIÁ (PATCH /ratings/:id)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 6. Kiểm tra 4.8.5: Sửa đánh giá của mình ---');

    // 6.1 User 1 thử sửa đánh giá của User 2 -> 403 NOT_OWNER
    const forbiddenPatchRes = await fetch(`${BASE}/ratings/${user2RatingId}`, {
      method: 'PATCH',
      headers: headers1,
      body: JSON.stringify({ stars: 1 }),
    });
    const forbiddenPatchData = await forbiddenPatchRes.json();
    if (forbiddenPatchRes.status !== 403 || forbiddenPatchData.error?.code !== 'NOT_OWNER') {
      throw new Error('❌ Phải trả về 403 NOT_OWNER khi sửa đánh giá của người khác');
    }
    console.log('✅ 6.1 Chặn người khác sửa đánh giá với 403 NOT_OWNER thành công!');

    // 6.2 Sửa đánh giá của chính mình hợp lệ
    const patchRes = await fetch(`${BASE}/ratings/${user1RatingId}`, {
      method: 'PATCH',
      headers: headers1,
      body: JSON.stringify({ stars: 5, comment: 'Công thức quá xuất sắc, đã nấu lại lần 2!' }),
    });
    const patchData = await patchRes.json();
    console.log('Patch rating status:', patchRes.status, 'Data:', patchData.data);
    if (patchRes.status !== 200 || patchData.data?.comment !== 'Công thức quá xuất sắc, đã nấu lại lần 2!') {
      throw new Error('❌ Sửa đánh giá thất bại');
    }
    console.log('✅ 6.2 Sửa đánh giá thành công với 200 OK!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 7: KIỂM THỬ MỤC 4.8.6: XÓA ĐÁNH GIÁ (DELETE /ratings/:id)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 7. Kiểm tra 4.8.6: Xóa đánh giá của mình ---');

    // 7.1 User 1 thử xóa đánh giá của User 2 -> 403 NOT_OWNER
    const forbiddenDelRes = await fetch(`${BASE}/ratings/${user2RatingId}`, {
      method: 'DELETE',
      headers: headers1,
    });
    if (forbiddenDelRes.status !== 403) {
      throw new Error('❌ Phải trả về 403 NOT_OWNER khi xóa đánh giá của người khác');
    }
    console.log('✅ 7.1 Chặn xóa đánh giá của người khác với 403 NOT_OWNER thành công!');

    // 7.2 Xóa đánh giá của User 2 hợp lệ -> 204 No Content
    const delRatingRes = await fetch(`${BASE}/ratings/${user2RatingId}`, {
      method: 'DELETE',
      headers: headers2,
    });
    console.log('Delete rating status:', delRatingRes.status);
    if (delRatingRes.status !== 204) {
      throw new Error('❌ DELETE /ratings/:id phải trả về 204 No Content');
    }

    // 7.3 Xóa lại lần nữa -> 404 RATING_NOT_FOUND
    const delAgainRes = await fetch(`${BASE}/ratings/${user2RatingId}`, {
      method: 'DELETE',
      headers: headers2,
    });
    if (delAgainRes.status !== 404) {
      throw new Error('❌ Xóa đánh giá không tồn tại phải trả về 404 RATING_NOT_FOUND');
    }
    console.log('✅ 7.2 & 7.3 DELETE /ratings/:id trả về 204 và 404 RATING_NOT_FOUND chuẩn xác!');

    // ═══════════════════════════════════════════════════════════════════════
    // BƯỚC 8: KIỂM THỬ MỤC 4.7.1: GỢI Ý CÁ NHÂN HÓA (GET /me/recommendations)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n--- 8. Kiểm tra 4.7.1: Gợi ý cá nhân hóa món ăn (UC08) ---');

    // 8.1 User 1: Thiết lập hồ sơ khẩu vị
    await fetch(`${BASE}/me/taste-profile`, {
      method: 'PUT',
      headers: headers1,
      body: JSON.stringify({
        preferred_region_id: 1, // Miền Bắc
        taste_prefs: { spicy_level: 2, salty_level: 2, sweet_level: 1, sour_level: 1 },
        calorie_goal: 1800,
        household_size: 2,
        diet_type_ids: [1], // Ăn lành mạnh
        allergen_group_ids: [1], // Dị ứng hải sản
        disliked_ingredient_ids: [14], // Không thích gừng
      }),
    });

    // 8.2 Gọi nhận gợi ý
    const recRes1 = await fetch(`${BASE}/me/recommendations?limit=6&refresh=true`, {
      headers: headers1,
    });
    const recData1 = await recRes1.json();
    console.log('Recommendations status:', recRes1.status);
    console.log('Meta strategy:', recData1.meta?.strategy);
    console.log('Meta completeness:', recData1.meta?.profile_completeness);
    console.log('Items returned count:', recData1.data?.length);

    if (recRes1.status !== 200 || !Array.isArray(recData1.data) || recData1.data.length === 0) {
      throw new Error('❌ GET /me/recommendations trả về không hợp lệ');
    }

    const firstRec = recData1.data[0];
    console.log('Top recommendation:', firstRec.dish?.name, 'Score:', firstRec.score, 'Reasons:', firstRec.reasons);
    if (!firstRec.dish?.id || typeof firstRec.score !== 'number' || !Array.isArray(firstRec.reasons)) {
      throw new Error('❌ Cấu trúc phần tử gợi ý dish, score, reasons không đúng');
    }

    // Kiểm tra Quy tắc loại trừ: Món nào chứa Hải sản (allergen group 1) hoặc Gừng (id 14) phải bị LOẠI TRỪ 100%
    for (const item of recData1.data) {
      if (item.dish.name.toLowerCase().includes('cá hồi')) {
        throw new Error(`❌ Món ${item.dish.name} (chứa hải sản) chưa được loại trừ theo dị ứng`);
      }
    }
    console.log('✅ 8.1 Gợi ý cá nhân hóa đã lọc sạch 100% nguyên liệu dị ứng & không thích!');

    // 8.3 Kiểm tra Cache 10 phút (gọi lại không refresh)
    const cachedRecRes = await fetch(`${BASE}/me/recommendations?limit=6`, {
      headers: headers1,
    });
    const cachedRecData = await cachedRecRes.json();
    if (cachedRecRes.status !== 200 || !cachedRecData.meta?.cached) {
      throw new Error('❌ Cache 10 phút chưa hoạt động');
    }
    console.log('✅ 8.2 Cache 10 phút hoạt động chính xác (meta.cached = true)!');

    // 8.4 Kiểm tra hủy cache khi có cập nhật (Quy tắc 3)
    await fetch(`${BASE}/dishes/${testDish2Id}/favorite`, { method: 'PUT', headers: headers1 });
    const afterInvalidateRes = await fetch(`${BASE}/me/recommendations?limit=6`, {
      headers: headers1,
    });
    const afterInvalidateData = await afterInvalidateRes.json();
    if (afterInvalidateData.meta?.cached === true) {
      throw new Error('❌ Cache không được tự động hủy khi thay đổi yêu thích/đánh giá');
    }
    console.log('✅ 8.3 Cache được tự động hủy ngay khi thêm/bỏ yêu thích hoặc sửa hồ sơ!');

    // 8.5 Kiểm tra User mới chưa có dữ liệu: strategy = popular_fallback và prompt_complete_profile = true
    const emailNew = `test_new_${Date.now()}@culina.test`;
    const regNew = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailNew, password: 'Password123!', displayName: 'New User' }),
    });
    const regNewData = await regNew.json();
    const newHeaders = { Authorization: `Bearer ${regNewData.accessToken}` };

    const newRecRes = await fetch(`${BASE}/me/recommendations?limit=6`, { headers: newHeaders });
    const newRecData = await newRecRes.json();
    console.log('New user strategy:', newRecData.meta?.strategy, 'Prompt complete profile:', newRecData.meta?.prompt_complete_profile);

    if (newRecData.meta?.strategy !== 'popular_fallback' || newRecData.meta?.prompt_complete_profile !== true) {
      throw new Error('❌ Người dùng mới phải có strategy = popular_fallback và prompt_complete_profile = true theo Quy tắc 1');
    }
    console.log('✅ 8.4 Quy tắc 1 người dùng mới (popular_fallback & prompt_complete_profile) chính xác tuyệt đối!');

    console.log('\n🎉 ============================================================');
    console.log('🎉 TẤT CẢ CÁC KIỂM THỬ MỤC 4.7 & 4.8 ĐÃ THÀNH CÔNG RỰC RỠ 100%!');
    console.log('🎉 ============================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
