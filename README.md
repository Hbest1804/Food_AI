# CulinaAI – Hệ Thống Trợ Lý Ẩm Thực Thông Minh (DATN)

Hệ thống hỗ trợ tìm kiếm công thức, quản lý tủ lạnh thông minh, gợi ý thực đơn cá nhân hóa và tương tác với Chatbot AI ẩm thực sử dụng Google Gemini 3.8 Flash và CSDL PostgreSQL (Supabase).

---

## Kiến trúc Hệ thống

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite, Axios, Lucide Icons.
- **Backend:** Node.js (ES Module), Express 5, Helmet, Express Rate Limit, Multer.
- **AI Engine:** Google Gemini API (Model: `gemini-3.8-flash` với cơ chế Failover).
- **Cơ sở dữ liệu:** PostgreSQL trên nền tảng Supabase (GoTrue Auth, Storage bucket cho ảnh đại diện & món ăn).

---

## Hướng dẫn Cài đặt & Chạy Dự án

### 1. Khởi chạy Backend

```bash
cd backend

# Cài đặt thư viện
npm install

# Cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa thông tin SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY trong .env

# Nạp dữ liệu mẫu ban đầu (Master data, món ăn, công thức)
npm run seed

# Chạy server ở chế độ phát triển
npm run dev
```
> Server mặc định lắng nghe tại: `http://localhost:5000`

### 2. Khởi chạy Frontend

```bash
cd frontend

# Cài đặt thư viện
npm install

# Chạy giao diện
npm run dev
```
> Giao diện web mặc định mở tại: `http://localhost:3000`

---

## Các Tính năng Chính

1. **Khám phá ẩm thực (UC01, UC02):** Danh mục phân loại, bộ lọc đa tiêu chí, tìm kiếm theo tên và nguyên liệu.
2. **Chatbot AI ẩm thực (UC03, UC07):**
   - Chế độ Khách (Guest Chat): Giới hạn lượt hỏi theo IP & ID, hỗ trợ tìm món theo nguyên liệu tủ lạnh.
   - Chế độ Thành viên: Lưu phiên hội thoại, ghi nhớ ngữ cảnh khẩu vị, đánh giá câu trả lời của AI.
3. **Quản lý Tủ lạnh & Tìm kiếm nguyên liệu (UC04):** Đề xuất món ăn dựa trên nguyên liệu người dùng đang có.
4. **Hồ sơ Khẩu vị & Gợi ý Thông minh (UC05, UC08):** Tính toán độ tương thích món ăn theo dị ứng, ngân sách, mục tiêu sức khỏe và lượng calo.
5. **Phân hệ Quản trị Admin (UC10 - UC16):**
   - Quản lý danh mục, vùng miền, nhãn tag, nguyên liệu.
   - Thêm/Sửa/Xóa công thức chi tiết nhiều bước, định lượng nguyên liệu, tải ảnh món ăn lên Supabase Storage.
   - Giám sát hội thoại AI và xem báo cáo thống kê thời gian thực từ CSDL.
