// REST bảng xếp hạng — UC05, MH10. Ai đã đăng nhập cũng xem được.
import type { BangXepHangCongKhai } from '@moonvillage/shared';
import { Router } from 'express';
import type { DichVuXepHang } from '../../application/xephang/DichVuXepHang.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import { boc } from './app.js';

export function taoRouterXepHang(xepHang: DichVuXepHang): Router {
  const r = Router();
  r.get(
    '/xep-hang',
    boc(async (req, res) => {
      if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
      const { mua, dong } = await xepHang.bangMuaHienTai();
      const than: BangXepHangCongKhai = {
        mua: { ...mua, batDau: mua.batDau.getTime() },
        dong,
      };
      res.json(than);
    }),
  );
  return r;
}
