// src/server.js
// Entry point chính của backend Express

import express from 'express';
import cors from 'cors';
import { env } from './config/appConfig.js';
import { testDbConnection } from './config/supabase.js';
import authRoutes from './routes/auth.js';

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

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('🔥 Server error:', err);
  res.status(500).json({ error: 'Lỗi server nội bộ' });
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
