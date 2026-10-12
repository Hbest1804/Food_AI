// backend/src/scripts/testEndpoints.js
import 'dotenv/config';
import express from 'express';
import dishesRoutes from '../routes/dishes.js';

const app = express();
app.use(express.json());
app.use('/dishes', dishesRoutes);
app.use('/api/dishes', dishesRoutes);

// Error handler
app.use((err, _req, res, _next) => {
  console.error('SERVER ERROR IN TEST:', err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Lỗi server nội bộ',
    },
  });
});

async function runTests() {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`🚀 Test server started at ${baseUrl}`);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  try {
    // 1. GET /dishes - cơ bản
    await test('GET /dishes - Lấy danh sách thành công và đúng cấu trúc', async () => {
      const res = await fetch(`${baseUrl}/dishes`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!json.success || !Array.isArray(json.data)) throw new Error('Cấu trúc response sai');
      if (json.data.length === 0) throw new Error('Không có món ăn nào');
      if (!json.meta || typeof json.meta.total !== 'number') throw new Error('Thiếu meta');
      const sample = json.data[0];
      if (!sample.id || !sample.name || !sample.slug) throw new Error('Thiếu trường cơ bản trong món');
    });

    // 2. GET /dishes?q=pho
    await test('GET /dishes?q=pho - Tìm kiếm bỏ dấu', async () => {
      const res = await fetch(`${baseUrl}/dishes?q=pho`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const hasPho = json.data.some((d) => d.slug.includes('pho-bo'));
      if (!hasPho) throw new Error('Không tìm thấy Phở bò khi tìm kiếm "pho"');
    });

    // 3. GET /dishes?q=thit bo (tìm theo nguyên liệu)
    await test('GET /dishes?q=thit bo - Tìm kiếm theo tên/bí danh nguyên liệu', async () => {
      const res = await fetch(`${baseUrl}/dishes?q=thit bo`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (json.data.length === 0) throw new Error('Không tìm thấy món nào với nguyên liệu "thịt bò"');
    });

    // 4. Lọc theo region_id và category_id
    await test('GET /dishes?region_id=1&category_id=1 - Lọc vùng miền và loại món', async () => {
      const res = await fetch(`${baseUrl}/dishes?region_id=1&category_id=1`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      for (const d of json.data) {
        if (d.region?.id !== 1 || d.category?.id !== 1) {
          throw new Error(`Món ${d.name} không thỏa điều kiện lọc`);
        }
      }
    });

    // 5. Tủ lạnh thông minh: ingredient_ids=1,10,12 (Thịt bò, Hành tây, Tỏi)
    await test('GET /dishes?ingredient_ids=1,10,12 - Tủ lạnh thông minh & match calculation', async () => {
      const res = await fetch(`${baseUrl}/dishes?ingredient_ids=1,10,12`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (json.data.length === 0) throw new Error('Không có món nào khớp');
      for (const d of json.data) {
        if (!d.match) throw new Error(`Món ${d.name} thiếu trường match`);
        if (typeof d.match.ratio !== 'number' || typeof d.match.matched_count !== 'number') {
          throw new Error('Cấu trúc trường match sai');
        }
      }
      // Kiểm tra món Bò xào hành tây có 3/4 nguyên liệu bắt buộc (thiếu nước mắm) -> ratio = 0.75
      const boXao = json.data.find((d) => d.slug === 'bo-xao-hanh-tay-can-toi');
      if (!boXao) throw new Error('Không tìm thấy Bò Xào Hành Tây');
      if (boXao.match.matched_count !== 3) throw new Error(`matched_count phải là 3, nhận được: ${boXao.match.matched_count}`);
      if (boXao.match.missing_count !== 1) throw new Error(`missing_count phải là 1, nhận được: ${boXao.match.missing_count}`);
      if (boXao.match.ratio !== 0.75) throw new Error(`ratio phải là 0.75, nhận được: ${boXao.match.ratio}`);
    });

    // 6. Tủ lạnh thông minh: đầy đủ nguyên liệu (1,10,12,20) -> ratio = 1 (nấu được ngay)
    await test('GET /dishes?ingredient_ids=1,10,12,20&min_match_ratio=1 - Lọc món nấu được ngay', async () => {
      const res = await fetch(`${baseUrl}/dishes?ingredient_ids=1,10,12,20&min_match_ratio=1`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (json.data.length === 0) throw new Error('Phải có ít nhất 1 món nấu được ngay');
      for (const d of json.data) {
        if (d.match.ratio < 1) throw new Error(`Món ${d.name} có ratio < 1`);
      }
    });

    // 7. Tủ lạnh thông minh: không có món nào khớp -> meta.suggest_ai = true
    await test('GET /dishes?ingredient_ids=99999 - Không có món khớp trả suggest_ai: true', async () => {
      const res = await fetch(`${baseUrl}/dishes?ingredient_ids=99999`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (json.data.length !== 0) throw new Error('Phải trả data rỗng');
      if (json.meta.suggest_ai !== true) throw new Error('meta.suggest_ai phải là true');
      if (!Array.isArray(json.meta.suggestions) || json.meta.suggestions.length === 0) {
        throw new Error('meta.suggestions phải có gợi ý món');
      }
    });

    // 8. Lọc loại trừ: exclude_ingredient_ids=6 (loại Cá hồi)
    await test('GET /dishes?exclude_ingredient_ids=6 - Loại trừ nguyên liệu', async () => {
      const res = await fetch(`${baseUrl}/dishes?exclude_ingredient_ids=6`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const hasCaHoi = json.data.some((d) => d.slug.includes('ca-hoi'));
      if (hasCaHoi) throw new Error('Vẫn còn món Cá hồi sau khi lọc exclude_ingredient_ids=6');
    });

    // 9. Lọc theo tag_ids=1 (Cay)
    await test('GET /dishes?tag_ids=1 - Lọc theo tag (Cay)', async () => {
      const res = await fetch(`${baseUrl}/dishes?tag_ids=1`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (json.data.length === 0) throw new Error('Không tìm thấy món cay');
      const hasBunBo = json.data.some((d) => d.slug.includes('bun-bo-hue'));
      if (!hasBunBo) throw new Error('Bún Bò Huế phải có tag Cay');
    });

    // 10. Sắp xếp sort=cook_time
    await test('GET /dishes?sort=cook_time - Sắp xếp theo thời gian nấu', async () => {
      const res = await fetch(`${baseUrl}/dishes?sort=cook_time`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      for (let i = 0; i < json.data.length - 1; i++) {
        if (json.data[i].cook_time_minutes > json.data[i + 1].cook_time_minutes) {
          throw new Error('Sắp xếp thời gian nấu không tăng dần');
        }
      }
    });

    // 11. Bắt lỗi INVALID_QUERY khi tham số sai
    await test('GET /dishes?difficulty=invalid - Trả 400 INVALID_QUERY', async () => {
      const res = await fetch(`${baseUrl}/dishes?difficulty=invalid`);
      const json = await res.json();
      if (res.status !== 400) throw new Error(`Status phải là 400, nhận được ${res.status}`);
      if (json.error?.code !== 'INVALID_QUERY') throw new Error(`Mã lỗi phải là INVALID_QUERY, nhận được ${json.error?.code}`);
    });

    await test('GET /dishes?min_match_ratio=2.5 - Trả 400 INVALID_QUERY', async () => {
      const res = await fetch(`${baseUrl}/dishes?min_match_ratio=2.5`);
      const json = await res.json();
      if (res.status !== 400) throw new Error(`Status phải là 400, nhận được ${res.status}`);
      if (json.error?.code !== 'INVALID_QUERY') throw new Error(`Mã lỗi phải là INVALID_QUERY`);
    });

    // 12. GET /dishes/:idOrSlug theo slug
    let sampleDishId = null;
    await test('GET /dishes/pho-bo-tai-lan-ha-noi - Chi tiết món ăn & công thức', async () => {
      const res = await fetch(`${baseUrl}/dishes/pho-bo-tai-lan-ha-noi`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (!json.success || !json.data) throw new Error('Không có data');
      const d = json.data;
      sampleDishId = d.id;
      if (d.slug !== 'pho-bo-tai-lan-ha-noi') throw new Error('Slug không khớp');
      if (!Array.isArray(d.ingredients) || d.ingredients.length === 0) throw new Error('Thiếu ingredients');
      if (!Array.isArray(d.steps) || d.steps.length === 0) throw new Error('Thiếu steps');
      if (!d.rating_summary || typeof d.rating_summary.average !== 'number') throw new Error('Thiếu rating_summary');
      if (!Array.isArray(d.related_dishes)) throw new Error('Thiếu related_dishes');
      if (!d.nutrition || typeof d.nutrition.calories !== 'number') throw new Error('Thiếu nutrition');
      if (typeof d.favorite_count !== 'number') throw new Error('Thiếu favorite_count');
      console.log(`    ℹ️ Rating summary: avg=${d.rating_summary.average}, count=${d.rating_summary.count}`);
    });

    // 13. GET /dishes/:idOrSlug theo UUID
    await test('GET /dishes/:uuid - Lấy chi tiết món theo ID (UUID)', async () => {
      if (!sampleDishId) throw new Error('Chưa có sampleDishId');
      const res = await fetch(`${baseUrl}/dishes/${sampleDishId}`);
      const json = await res.json();
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (json.data.id !== sampleDishId) throw new Error('ID không khớp');
    });

    // 14. GET /dishes/:idOrSlug không tồn tại -> 404 DISH_NOT_FOUND
    await test('GET /dishes/mon-khong-ton-tai - Trả 404 DISH_NOT_FOUND', async () => {
      const res = await fetch(`${baseUrl}/dishes/mon-khong-ton-tai-12345`);
      const json = await res.json();
      if (res.status !== 404) throw new Error(`Status phải là 404, nhận được ${res.status}`);
      if (json.error?.code !== 'DISH_NOT_FOUND') throw new Error(`Mã lỗi phải là DISH_NOT_FOUND, nhận được ${json.error?.code}`);
    });

    console.log(`\n========================================`);
    console.log(`🏁 Tổng kết Mục 4.3: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
  } finally {
    server.close();
  }
}

runTests().catch(console.error);
