import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// `vite build --mode pages`: bản tĩnh chỉ có ván mẫu, đặt dưới https://<chủ>.github.io/WereWolf_Game/.
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/WereWolf_Game/' : '/',
  plugins: [react(), tailwindcss()],
  // `@/` trỏ vào src/ — đường dẫn mà các component kéo từ registry shadcn dùng.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    // Chuyển tiếp lời gọi API và Socket.IO sang máy chủ ứng dụng khi chạy phát triển.
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
}));
