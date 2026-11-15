// REST tài khoản — UC01 đăng ký, UC02 đăng nhập/đăng xuất, phiên hiện tại, UC03 hồ sơ.
import { Router, type Response } from 'express';
import { z } from 'zod';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import { TEN_COOKIE, THOI_HAN_PHIEN_GIAY } from '../../infrastructure/auth/phien.js';
import { boc, type PhuThuocApi } from './app.js';

const LuocDoDangKy = z.object({
  tenDangNhap: z.string().max(40),
  bietDanh: z.string().max(60),
  matKhau: z.string().max(200),
});
const LuocDoDangNhap = z.object({ tenDangNhap: z.string().max(40), matKhau: z.string().max(200) });
const LuocDoHoSo = z.object({
  bietDanh: z.string().max(60).optional(),
  anhDaiDien: z.string().max(20).optional(),
});

export function taoRouterTaiKhoan(phu: PhuThuocApi): Router {
  const r = Router();

  async function datPhien(res: Response, taiKhoanId: string) {
    res.cookie(TEN_COOKIE, await phu.phien.ky(taiKhoanId), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: THOI_HAN_PHIEN_GIAY * 1000,
      path: '/',
    });
  }

  r.post(
    '/dang-ky',
    boc(async (req, res) => {
      const { tenDangNhap, bietDanh, matKhau } = LuocDoDangKy.parse(req.body);
      const phien = await phu.taiKhoan.dangKy(tenDangNhap, bietDanh, matKhau);
      await datPhien(res, phien.id);
      res.status(201).json(phien);
    }),
  );

  r.post(
    '/dang-nhap',
    boc(async (req, res) => {
      const { tenDangNhap, matKhau } = LuocDoDangNhap.parse(req.body);
      const phien = await phu.taiKhoan.dangNhap(tenDangNhap, matKhau);
      await datPhien(res, phien.id);
      res.json(phien);
    }),
  );

  r.post('/dang-xuat', (_req, res) => {
    res.clearCookie(TEN_COOKIE, { path: '/' });
    res.status(204).end();
  });

  r.get('/toi', (req, res) => {
    if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
    res.json(req.phien);
  });

  r.get(
    '/ho-so',
    boc(async (req, res) => {
      if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
      res.json(await phu.taiKhoan.layHoSo(req.phien.id));
    }),
  );

  r.patch(
    '/ho-so',
    boc(async (req, res) => {
      if (!req.phien) throw new LoiNghiepVu('CHUA_DANG_NHAP');
      res.json(await phu.taiKhoan.capNhatHoSo(req.phien.id, LuocDoHoSo.parse(req.body)));
    }),
  );

  return r;
}
