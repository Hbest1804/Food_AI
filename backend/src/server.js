// src/server.js
// Entry point chính của backend Express

import express from 'express';
import cors from 'cors';
import { env } from './config/appConfig.js';
import { testDbConnection } from './config/supabase.js';
import authRoutes from './routes/auth.js';
import metaRoutes from './routes/meta.js';
import ingredientsRoutes from './routes/ingredients.js';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.corsOrigin.split(',').map(o => o.trim()),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health-check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/ingredients', ingredientsRoutes);

// Hỗ trợ trực tiếp không tiền tố /api
app.use('/meta', metaRoutes);
app.use('/ingredients', ingredientsRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route không tồn tại',
    },
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Chuẩn hóa định dạng lỗi theo mục 2.2 của tài liệu đặc tả API
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('🔥 Server error:', err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Lỗi server nội bộ',
      ...(err.details ? { details: err.details } : {}),
    },
  });
});

// ── Khởi động ─────────────────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await testDbConnection();          // ping Supabase trước khi lắng nghe

    app.listen(env.port, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${env.port}`);
      console.log(`   Môi trường : ${env.nodeEnv}`);
      console.log(`   CORS origin: ${env.corsOrigin}`);
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

bootstrap();
