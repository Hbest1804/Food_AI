-- =====================================================================
-- SCHEMA CƠ SỞ DỮ LIỆU
-- Hệ thống trợ lý ẩm thực thông minh tích hợp chatbot AI
-- Nền tảng: PostgreSQL 15+ / Supabase (pgvector, RLS, auth.users)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "vector";     -- pgvector: embedding & tìm kiếm ngữ nghĩa
create extension if not exists "pg_trgm";    -- tìm kiếm mờ, chịu lỗi chính tả
create extension if not exists "unaccent";   -- tìm kiếm không phân biệt dấu tiếng Việt

-- ---------------------------------------------------------------------
-- 1. HÀM DÙNG CHUNG: tự động cập nhật updated_at
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Hàm wrapper cho unaccent với thuộc tính IMMUTABLE để sử dụng được trong INDEX
-- Bổ sung set search_path = public, extensions, pg_catalog vì trên Supabase extension unaccent nằm trong schema extensions
create or replace function immutable_unaccent(text)
returns text as $$
  select unaccent('unaccent', $1);
$$ language sql immutable strict parallel safe
set search_path = public, extensions, pg_catalog;

-- =====================================================================
-- 2. NGƯỜI DÙNG & HỒ SƠ KHẨU VỊ (nhóm chức năng F1)
-- =====================================================================

-- users mở rộng auth.users của Supabase (auth.users đã xử lý email/mật khẩu/JWT)
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text,
  role          text not null default 'user' check (role in ('user','admin')),
  status        text not null default 'active' check (status in ('active','locked')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

-- Bảng tra cứu: chế độ ăn (ăn chay, ít tinh bột, ít đường, không gluten...)
create table diet_types (
  id    smallserial primary key,
  code  text not null unique,        -- 'vegetarian', 'low_carb', ...
  name  text not null                -- tên hiển thị tiếng Việt
);

-- Bảng tra cứu: nhóm dị ứng (dùng chung cho ingredients và user_allergies)
create table allergen_groups (
  id    smallserial primary key,
  code  text not null unique,        -- 'seafood', 'peanut', 'dairy', 'gluten', 'egg', ...
  name  text not null
);

-- Bảng tra cứu: vùng miền
create table regions (
  id    smallserial primary key,
  code  text not null unique,        -- 'north', 'central', 'south'
  name  text not null
);

create table user_profiles (
  user_id             uuid primary key references users(id) on delete cascade,
  preferred_region_id smallint references regions(id),
  taste_prefs         jsonb not null default '{}'::jsonb,  -- {"spicy":4,"sour":2,"sweet":3}
  calorie_goal        numeric(6,1),        -- kcal/ngày
  budget_min          numeric(12,0),       -- VND / bữa
  budget_max          numeric(12,0),
  household_size      smallint not null default 1 check (household_size > 0),
  taste_vector        vector(768),         -- vector sở thích, cùng chiều với dish_embeddings
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_user_profiles_updated_at before update on user_profiles
  for each row execute function set_updated_at();

-- Chế độ ăn của người dùng (n-n, một người có thể theo nhiều chế độ)
create table user_diets (
  user_id     uuid references user_profiles(user_id) on delete cascade,
  diet_type_id smallint references diet_types(id),
  primary key (user_id, diet_type_id)
);

-- Dị ứng của người dùng — dùng để loại món 100% ở tầng truy vấn (yêu cầu phi chức năng)
create table user_allergies (
  user_id          uuid references user_profiles(user_id) on delete cascade,
  allergen_group_id smallint references allergen_groups(id),
  primary key (user_id, allergen_group_id)
);

-- Lưu ý: bảng user_disliked_ingredients (tham chiếu ingredients) được tạo
-- ở cuối mục 3, sau khi bảng ingredients đã tồn tại.

-- =====================================================================
-- 3. MÓN ĂN, CÔNG THỨC, NGUYÊN LIỆU (nhóm chức năng F2, F5, F7)
-- =====================================================================

create table categories (
  id    smallserial primary key,
  name  text not null unique,
  slug  text not null unique
);

create table tags (
  id    smallserial primary key,
  name  text not null unique
);

create table ingredients (
  id                 bigserial primary key,
  name               text not null unique,
  default_unit       text not null,          -- 'g', 'ml', 'quả', 'thìa canh'...
  allergen_group_id  smallint references allergen_groups(id),
  aliases            text[] not null default '{}',  -- tên gọi khác, hỗ trợ tìm kiếm/nhập liệu
  created_at         timestamptz not null default now()
);

create table dishes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  image_url    text,
  region_id    smallint references regions(id),
  category_id  smallint references categories(id),
  cook_time_minutes smallint check (cook_time_minutes >= 0),
  difficulty   text check (difficulty in ('easy','medium','hard')),
  servings     smallint not null default 1 check (servings > 0),
  est_cost     numeric(12,0),          -- chi phí ước tính (VND) cho khẩu phần chuẩn
  calories     numeric(6,1),
  protein_g    numeric(6,1),
  carbs_g      numeric(6,1),
  fat_g        numeric(6,1),
  steps        jsonb not null default '[]'::jsonb,  -- [{"order":1,"instruction":"...","duration_minutes":5}]
  is_published boolean not null default false,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_dishes_updated_at before update on dishes
  for each row execute function set_updated_at();

-- Liên kết nhiều-nhiều món <-> nguyên liệu (kèm định lượng)
create table dish_ingredients (
  dish_id       uuid references dishes(id) on delete cascade,
  ingredient_id bigint references ingredients(id) on delete restrict,
  quantity      numeric(10,2) not null,
  unit          text not null,
  is_optional   boolean not null default false,
  primary key (dish_id, ingredient_id)
);

create table dish_tags (
  dish_id uuid references dishes(id) on delete cascade,
  tag_id  smallint references tags(id) on delete cascade,
  primary key (dish_id, tag_id)
);

-- Nguyên liệu người dùng không thích / kiêng (khác với dị ứng) — đặt ở đây
-- vì cần bảng ingredients đã tồn tại trước.
create table user_disliked_ingredients (
  user_id       uuid references user_profiles(user_id) on delete cascade,
  ingredient_id bigint references ingredients(id) on delete cascade,
  primary key (user_id, ingredient_id)
);

-- =====================================================================
-- 4. EMBEDDING & TÌM KIẾM NGỮ NGHĨA (F2.4, RAG cho chatbot)
-- =====================================================================

create table dish_embeddings (
  dish_id    uuid primary key references dishes(id) on delete cascade,
  embedding  vector(768) not null,     -- chiều vector theo model embedding đang dùng (Gemini)
  model      text not null,            -- ví dụ 'text-embedding-004'
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- 5. TƯƠNG TÁC NGƯỜI DÙNG (F6) & DỮ LIỆU CHO GỢI Ý CÁ NHÂN HÓA (mục 7)
-- =====================================================================

create table favorites (
  user_id    uuid references users(id) on delete cascade,
  dish_id    uuid references dishes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

create table collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_collections_updated_at before update on collections
  for each row execute function set_updated_at();

create table collection_dishes (
  collection_id uuid references collections(id) on delete cascade,
  dish_id       uuid references dishes(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, dish_id)
);

create table ratings (
  id         bigserial primary key,
  user_id    uuid references users(id) on delete cascade,
  dish_id    uuid references dishes(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, dish_id)
);
create trigger trg_ratings_updated_at before update on ratings
  for each row execute function set_updated_at();

-- Lịch sử xem — trạng thái rút gọn, tối ưu cho "xem gần đây" (F6.4)
create table view_history (
  user_id        uuid references users(id) on delete cascade,
  dish_id        uuid references dishes(id) on delete cascade,
  view_count     integer not null default 1,
  last_viewed_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

-- Nhật ký sự kiện đầy đủ — nguồn dữ liệu cho chấm điểm gợi ý và thống kê (mục 7.4, F7.5)
create table interaction_logs (
  id         bigserial primary key,
  user_id    uuid references users(id) on delete set null,
  dish_id    uuid references dishes(id) on delete set null,
  event_type text not null check (event_type in
    ('view','search','favorite','unfavorite','hide','rate',
     'click_recommendation','chat_reference')),
  context    jsonb not null default '{}'::jsonb,  -- bữa ăn, thời điểm, nguồn sự kiện...
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 6. CHATBOT AI (F3)
-- =====================================================================

create table chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_chat_sessions_updated_at before update on chat_sessions
  for each row execute function set_updated_at();

create table chat_messages (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid references chat_sessions(id) on delete cascade,
  role                text not null check (role in ('user','assistant','system')),
  content             text not null,
  referenced_dish_ids uuid[] not null default '{}',
  feedback            text check (feedback in ('helpful','unhelpful')),
  feedback_reason     text,
  -- Kết quả xử lý câu hỏi (chỉ áp dụng cho tin nhắn role='assistant'), phục vụ
  -- giám sát chatbot F7.4: lọc nhanh các câu hỏi chưa trả lời được.
  outcome             text check (outcome in ('answered','no_match','out_of_scope','fallback')),
  tokens              integer,
  created_at          timestamptz not null default now()
);

-- =====================================================================
-- 7. CHỈ MỤC (mục 8.2 tài liệu mô tả hệ thống)
-- =====================================================================

-- Tìm kiếm tên món chịu lỗi chính tả, không dấu (F2.1)
create index idx_dishes_name_trgm on dishes using gin (immutable_unaccent(name) gin_trgm_ops);

-- Lọc theo danh mục / vùng miền / trạng thái xuất bản (F2.2)
create index idx_dishes_category on dishes (category_id) where is_published;
create index idx_dishes_region   on dishes (region_id) where is_published;

-- Tìm kiếm ngữ nghĩa (F2.4) — HNSW cho cosine similarity
create index idx_dish_embeddings_hnsw on dish_embeddings
  using hnsw (embedding vector_cosine_ops);

-- So khớp vector sở thích người dùng với embedding món (giai đoạn chấm điểm S_content)
create index idx_user_profiles_taste_vector_hnsw on user_profiles
  using hnsw (taste_vector vector_cosine_ops);

-- Nhật ký & hội thoại theo người dùng, sắp theo thời gian (mục 8.2)
create index idx_interaction_logs_user_time on interaction_logs (user_id, created_at desc);
create index idx_interaction_logs_dish_time on interaction_logs (dish_id, created_at desc);
create index idx_chat_messages_session_time on chat_messages (session_id, created_at);

-- Giám sát chatbot (F7.4): lọc nhanh câu hỏi chưa trả lời được / ngoài phạm vi
create index idx_chat_messages_outcome on chat_messages (outcome, created_at desc)
  where outcome is not null and outcome <> 'answered';

-- Tra cứu điểm trung bình đánh giá theo món
create index idx_ratings_dish on ratings (dish_id);

-- =====================================================================
-- 8. ROW LEVEL SECURITY (mục 11 tài liệu mô tả hệ thống)
-- =====================================================================
-- Backend dùng service role key nên tự động bỏ qua RLS khi thao tác quản trị.
-- Các policy dưới đây áp dụng khi client (JWT người dùng) truy vấn trực tiếp qua Supabase.

alter table users                     enable row level security;
alter table user_profiles             enable row level security;
alter table user_diets                enable row level security;
alter table user_allergies            enable row level security;
alter table user_disliked_ingredients enable row level security;
alter table favorites                 enable row level security;
alter table collections               enable row level security;
alter table collection_dishes         enable row level security;
alter table ratings                   enable row level security;
alter table view_history              enable row level security;
alter table interaction_logs          enable row level security;
alter table chat_sessions             enable row level security;
alter table chat_messages             enable row level security;

alter table dishes            enable row level security;
alter table dish_ingredients  enable row level security;
alter table dish_embeddings   enable row level security;
alter table ingredients       enable row level security;
alter table categories        enable row level security;
alter table tags              enable row level security;
alter table dish_tags         enable row level security;

-- Dữ liệu cá nhân: chỉ chủ tài khoản được đọc/ghi dữ liệu của chính mình
create policy self_access on users
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy self_access on user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on user_diets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on user_allergies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on user_disliked_ingredients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on collections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on collection_dishes
  for all using (
    exists (select 1 from collections c
            where c.id = collection_dishes.collection_id and c.user_id = auth.uid())
  );
create policy self_access on ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on view_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on interaction_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy self_access on chat_messages
  for all using (
    exists (select 1 from chat_sessions s
            where s.id = chat_messages.session_id and s.user_id = auth.uid())
  );

-- Dữ liệu món ăn & danh mục dùng chung: công khai đọc, chỉ đọc món đã xuất bản
create policy public_read on dishes
  for select using (is_published = true);
create policy public_read on dish_ingredients
  for select using (
    exists (select 1 from dishes d where d.id = dish_ingredients.dish_id and d.is_published)
  );
create policy public_read on dish_embeddings for select using (true);
create policy public_read on ingredients      for select using (true);
create policy public_read on categories       for select using (true);
create policy public_read on tags             for select using (true);
create policy public_read on dish_tags        for select using (true);

-- Ghi dữ liệu món ăn / nguyên liệu / danh mục chỉ thực hiện qua service role (backend, F7.1)
-- -> không cần thêm policy INSERT/UPDATE/DELETE cho các bảng này ở phía client.
