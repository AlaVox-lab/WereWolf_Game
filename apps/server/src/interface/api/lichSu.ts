// REST lịch sử ván — UC04: danh sách ván đã chơi, mở lại bản ghi diễn tiến của một ván cũ.
import type { ChiTietVanCongKhai, TomTatVanCongKhai } from '@moonvillage/shared';
import { Router } from 'express';
import type { DichVuLichSu } from '../../application/van/DichVuLichSu.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import { boc } from './app.js';

export function taoRouterLichSu(lichSu: DichVuLichSu): Router {
  const r = Router();

  r.get(
    '/lich-su',
    boc(async (req, res) => {
      if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
      const ds = await lichSu.lichSuCua(req.phien.id);
      res.json(
        ds.map(
          (v): TomTatVanCongKhai =>
            ({
              ...v,
              ketThucLuc: v.ketThucLuc.getTime(),
            }) as TomTatVanCongKhai,
        ),
      );
    }),
  );

  r.get(
    '/lich-su/:vanId',
    boc(async (req, res) => {
      if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
      const v = await lichSu.xemVan(String(req.params.vanId), req.phien);
      res.json({ ...v, ketThucLuc: v.ketThucLuc.getTime() } as ChiTietVanCongKhai);
    }),
  );

  return r;
}
