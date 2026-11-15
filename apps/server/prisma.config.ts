// Cấu hình Prisma 7 — đường dẫn lược đồ, migration, seed và chuỗi kết nối.
// DATABASE_URL lấy từ biến môi trường; mặc định trùng infra/.env.example để chạy ngay khi phát triển.
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ?? 'postgresql://moonvillage:moonvillage@localhost:5433/moonvillage',
  },
});
