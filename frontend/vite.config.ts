import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import { apiApp } from './api.ts';

function apiPlugin(): Plugin {
  return {
    name: 'culina-api',
    configureServer(server) {
      server.middlewares.use(apiApp);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true, // Tự động mở trình duyệt mỗi khi chạy npm run dev
      hmr: true, // Bật Hot Module Replacement để đồng bộ tức thì code lên trình duyệt
      watch: {
        usePolling: true, // Đảm bảo bắt sự kiện sửa file 100% trên Windows
      },
    },
  };
});
