# CulinaAI Frontend

Giao diện người dùng cho hệ thống **Trợ lý Ẩm thực Thông minh CulinaAI**, xây dựng bằng React 19, TypeScript, Tailwind CSS v4 và Vite.

## Tính năng chính
- 🍜 **Khám phá món ăn (Browse View):** Tìm kiếm, lọc theo vùng miền, danh mục, độ khó, thời gian chế biến, calo.
- 🤖 **Chatbot AI ẩm thực:** Hỗ trợ chế độ khách (Guest Chat có rate limit) và chế độ thành viên cá nhân hóa (Personalized Chat theo khẩu vị).
- 🧊 **Tủ lạnh thông minh (Fridge Search):** Gợi ý công thức món ăn dựa trên nguyên liệu sẵn có trong tủ lạnh.
- 🎯 **Gợi ý món ăn cá nhân hóa (Recommendations):** Tính điểm tương đồng dựa trên hồ sơ khẩu vị, dị ứng, mục tiêu sức khỏe và lượng calo hàng ngày.
- 👑 **Phân hệ Quản trị (Admin Portal):** Quản lý món ăn, công thức chi tiết, nguyên liệu, master data, giám sát chatbot và thống kê hệ thống thời gian thực.

## Cài đặt và chạy

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy môi trường phát triển
npm run dev

# 3. Build production bundle
npm run build
```

## Môi trường (.env)
- `VITE_API_URL`: Địa chỉ API Backend (mặc định: `http://localhost:5000`)
