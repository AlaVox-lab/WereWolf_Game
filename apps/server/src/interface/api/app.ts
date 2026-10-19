import express from 'express';
import { TEN_UNG_DUNG, type PhanHoiSucKhoe } from '@moonvillage/shared';

// Tạo ứng dụng Express nhưng không lắng nghe cổng — để kiểm thử gọi thẳng được.
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    const body: PhanHoiSucKhoe = {
      trangThai: 'ok',
      ungDung: TEN_UNG_DUNG,
      thoiDiem: new Date().toISOString(),
    };
    res.json(body);
  });

  return app;
}
