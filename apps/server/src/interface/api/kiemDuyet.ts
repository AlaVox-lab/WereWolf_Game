// REST kiểm duyệt — UC21 báo cáo vi phạm (người chơi), UC22–UC24 quản trị (chỉ AC03).
import type { BaoCaoCongKhai, TaiKhoanQuanTri, TongQuanCongKhai } from '@moonvillage/shared';
import { Router, type Request } from 'express';
import { z } from 'zod';
import type { DichVuBaoCao } from '../../application/kiemduyet/DichVuBaoCao.js';
import type { DichVuQuanTri } from '../../application/kiemduyet/DichVuQuanTri.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import { boc } from './app.js';

const LuocDoBaoCao = z.object({
  vanId: z.string().min(1).max(20),
  nguoiBiBaoCaoId: z.string().min(1).max(20),
  lyDo: z.string().max(1000),
});
const LuocDoXuLy = z.object({
  quyetDinh: z.enum(['CANH_CAO', 'KHOA_TAI_KHOAN', 'BAC_BO']),
  ghiChu: z.string().max(1000),
});
const LuocDoKhoa = z.object({ biKhoa: z.boolean() });

function nguoi(req: Request) {
  if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
  return req.phien;
}

export function taoRouterKiemDuyet(baoCao: DichVuBaoCao, quanTri: DichVuQuanTri): Router {
  const r = Router();

  r.post(
    '/bao-cao',
    boc(async (req, res) => {
      const bc = await baoCao.baoCao(nguoi(req).id, LuocDoBaoCao.parse(req.body));
      res.status(201).json({ id: bc.id, trangThai: bc.trangThai });
    }),
  );

  r.get(
    '/quan-tri/tong-quan',
    boc(async (req, res) => {
      const than: TongQuanCongKhai = await quanTri.tongQuan(nguoi(req));
      res.json(than);
    }),
  );

  r.get(
    '/quan-tri/bao-cao',
    boc(async (req, res) => {
      const ai = nguoi(req);
      const [ds, taiKhoan] = await Promise.all([
        quanTri.danhSachBaoCao(ai),
        quanTri.danhSachTaiKhoan(ai),
      ]);
      const theoId = new Map(taiKhoan.map((t) => [t.id, t]));
      const ten = (id: string) =>
        theoId.get(id)?.hoSo?.bietDanh ?? theoId.get(id)?.tenDangNhap ?? `#${id}`;
      res.json(
        ds.map((b): BaoCaoCongKhai => ({
          id: b.id,
          vanId: b.vanId,
          nguoiBaoCao: { id: b.nguoiBaoCaoId, ten: ten(b.nguoiBaoCaoId) },
          nguoiBiBaoCao: {
            id: b.nguoiBiBaoCaoId,
            ten: ten(b.nguoiBiBaoCaoId),
            biKhoa: theoId.get(b.nguoiBiBaoCaoId)?.biKhoa ?? false,
          },
          lyDo: b.lyDo,
          trangThai: b.trangThai,
          ghiChuXuLy: b.ghiChuXuLy,
          ngayTao: b.ngayTao.getTime(),
        })),
      );
    }),
  );

  r.post(
    '/quan-tri/bao-cao/:id',
    boc(async (req, res) => {
      const bc = await quanTri.xuLyBaoCao(
        nguoi(req),
        String(req.params.id),
        LuocDoXuLy.parse(req.body),
      );
      res.json({ id: bc.id, trangThai: bc.trangThai });
    }),
  );

  r.get(
    '/quan-tri/tai-khoan',
    boc(async (req, res) => {
      const ds = await quanTri.danhSachTaiKhoan(nguoi(req));
      res.json(
        ds.map((t): TaiKhoanQuanTri => ({
          id: t.id,
          tenDangNhap: t.tenDangNhap,
          bietDanh: t.hoSo?.bietDanh ?? t.tenDangNhap,
          anhDaiDien: t.hoSo?.anhDaiDien ?? 'DanLang',
          laQuanTri: t.laQuanTri,
          biKhoa: t.biKhoa,
          soVanDaChoi: t.hoSo?.soVanDaChoi ?? 0,
          ngayTao: new Date(t.ngayTao).getTime(),
        })),
      );
    }),
  );

  r.post(
    '/quan-tri/tai-khoan/:id/khoa',
    boc(async (req, res) => {
      const { biKhoa } = LuocDoKhoa.parse(req.body);
      await quanTri.datKhoa(nguoi(req), String(req.params.id), biKhoa);
      res.status(204).end();
    }),
  );

  return r;
}
