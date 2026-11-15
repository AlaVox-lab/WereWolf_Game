// REST phòng — UC06 tạo phòng, danh sách phòng công khai (MH02), xem trước phòng trước khi vào.
// Mọi việc trong phòng (vào, rời, cấu hình, bắt đầu) đi qua Socket.IO (ARCHITECTURE mục 11).
import { Router } from 'express';
import type { SoDangKyPhong } from '../../application/phong/SoDangKyPhong.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import { boc } from './app.js';

export function taoRouterPhong(so: SoDangKyPhong): Router {
  const r = Router();

  r.post(
    '/phong',
    boc(async (req, res) => {
      if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
      const ma = await so.taoPhong(req.phien);
      res.status(201).json(so.chieu(ma));
    }),
  );

  r.get('/phong', (req, res) => {
    if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
    res.json(so.danhSachCongKhai());
  });

  /** Phòng mình đang ở, nếu có — giao diện dùng khi tải lại trang. */
  r.get('/phong-cua-toi', (req, res) => {
    if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
    const ma = so.phongCua(req.phien.id);
    res.json(ma ? so.chieu(ma) : null);
  });

  r.get('/phong/:ma', (req, res) => {
    if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
    res.json(so.chieu(String(req.params.ma)));
  });

  return r;
}
