import { TEN_UNG_DUNG, type PhanHoiSucKhoe } from '@moonvillage/shared';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import type { DichVuTaiKhoan, ThongTinPhien } from '../../application/taikhoan/DichVuTaiKhoan.js';
import type { BoPhien } from '../../infrastructure/auth/phien.js';
import { TEN_COOKIE } from '../../infrastructure/auth/phien.js';
import { dichLoi } from '../thongDiepLoi.js';
import { taoRouterTaiKhoan } from './taiKhoan.js';

/** Mọi thứ tầng REST cần — lắp ráp ở main.ts, kiểm thử truyền bản bộ nhớ. */
export interface PhuThuocApi {
  taiKhoan: DichVuTaiKhoan;
  phien: BoPhien;
  /** Router gắn thêm của các hạng mục sau (phòng, lịch sử, quản trị…). */
  routerThem?: express.Router[];
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Phiên của người gọi — có sau middleware `docPhien`, `null` nếu chưa đăng nhập. */
    phien?: ThongTinPhien | null;
  }
}

/** Gói một handler async: mọi lỗi đi về `xuLyLoi`. */
export const boc =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/** Đọc cookie phiên, gắn `req.phien`. Tài khoản bị khóa coi như chưa đăng nhập (UC23). */
export function taoDocPhien(phu: PhuThuocApi) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const id = await phu.phien.doc(req.cookies?.[TEN_COOKIE]);
      req.phien = id ? await phu.taiKhoan.timPhien(id) : null;
      next();
    } catch (loi) {
      next(loi);
    }
  };
}

// Tạo ứng dụng Express nhưng không lắng nghe cổng — để kiểm thử gọi thẳng được.
export function createApp(phu: PhuThuocApi) {
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());
  app.use(taoDocPhien(phu));

  app.get('/api/health', (_req, res) => {
    const body: PhanHoiSucKhoe = {
      trangThai: 'ok',
      ungDung: TEN_UNG_DUNG,
      thoiDiem: new Date().toISOString(),
    };
    res.json(body);
  });

  app.use('/api/tai-khoan', taoRouterTaiKhoan(phu));
  for (const r of phu.routerThem ?? []) app.use('/api', r);

  app.use((loi: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (loi instanceof ZodError) {
      res
        .status(400)
        .json({ loi: 'DU_LIEU_KHONG_HOP_LE', thongDiep: 'Dữ liệu gửi lên chưa đúng.' });
      return;
    }
    const { maHttp, than } = dichLoi(loi);
    if (maHttp === 500) console.error(loi);
    res.status(maHttp).json(than);
  });
  return app;
}
