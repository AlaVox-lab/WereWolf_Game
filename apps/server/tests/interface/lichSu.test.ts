// REST lịch sử ván (ROADMAP 7.2, UC04) — danh sách ván đã chơi và mở lại bản ghi diễn tiến.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { KhoDuLieu } from '../../src/application/kho/KhoDuLieu.js';
import { BoLuatChoi } from '../../src/domain/luat/BoLuatChoi.js';
import { taoKhoBoNho } from '../../src/infrastructure/repository/boNho/khoBoNho.js';
import { taoMayChuThu, taoNguoiDung } from './mayChuThu.js';

let kho: KhoDuLieu;
let may: Awaited<ReturnType<typeof taoMayChuThu>>;
beforeAll(async () => {
  kho = taoKhoBoNho();
  may = await taoMayChuThu({ kho });
});
afterAll(() => may.dong());

async function nguoiDaDangKy(ten: string) {
  const u = taoNguoiDung(may.url);
  const r = await u.goi('/api/tai-khoan/dang-ky', 'POST', {
    tenDangNhap: ten,
    bietDanh: ten.toUpperCase(),
    matKhau: 'matkhau123',
  });
  return { u, id: r.body.id as string };
}

/** Lưu thẳng một ván đã xong vào kho — hai người: một Sói, một Dân làng; Sói thắng. */
async function luuVanMau(soiId: string, danId: string): Promise<string> {
  const phongId = await kho.phong.taoPhong('LSVAN1', soiId);
  const luc = new Date('2026-11-15T12:00:00Z');
  return kho.van.luuVan({
    phongId,
    trangThai: 'KET_THUC',
    pheThang: 'SOI',
    soLuot: 1,
    batDauLuc: luc,
    ketThucLuc: new Date(luc.getTime() + 60_000),
    boLuat: new BoLuatChoi().layGiaTri(),
    nguoiChoi: [
      { id: soiId, loaiVai: 'Soi', conSong: true, thuTuGhe: 1, trangThaiKyNang: {} },
      { id: danId, loaiVai: 'DanLang', conSong: false, thuTuGhe: 2, trangThaiKyNang: {} },
    ],
    luot: [],
    tinNhan: [],
    nhatKy: [
      {
        thuTu: 1,
        loai: 'NGUOI_CHET',
        duLieu: { nguoiChoiId: danId, nguyenNhan: 'BI_CAN' },
        thoiDiem: luc.getTime() + 30_000,
      },
    ],
    diemCong: [
      { taiKhoanId: soiId, diem: 3, thang: true },
      { taiKhoanId: danId, diem: 1, thang: false },
    ],
  });
}

describe('REST lịch sử ván', () => {
  it('chưa đăng nhập thì không xem được lịch sử', async () => {
    expect((await taoNguoiDung(may.url).goi('/api/lich-su')).status).toBe(401);
  });

  it('UC04 — danh sách ván đã chơi kèm vai của mình, thắng hay thua; mở lại được nhật ký', async () => {
    const soi = await nguoiDaDangKy('ls_soi');
    const dan = await nguoiDaDangKy('ls_dan');
    const vanId = await luuVanMau(soi.id, dan.id);

    const ds = await soi.u.goi('/api/lich-su');
    expect(ds.status).toBe(200);
    expect(ds.body).toEqual([
      expect.objectContaining({
        vanId,
        trangThai: 'KET_THUC',
        pheThang: 'SOI',
        soNguoi: 2,
        loaiVai: 'Soi',
        thang: true,
        ketThucLuc: Date.parse('2026-11-15T12:01:00Z'),
      }),
    ]);
    expect((await dan.u.goi('/api/lich-su')).body[0]).toMatchObject({
      loaiVai: 'DanLang',
      thang: false,
    });

    const ct = await dan.u.goi(`/api/lich-su/${vanId}`);
    expect(ct.status).toBe(200);
    expect(ct.body.nguoiChoi).toEqual([
      expect.objectContaining({ id: soi.id, ten: 'LS_SOI', loaiVai: 'Soi', thuTuGhe: 1 }),
      expect.objectContaining({ id: dan.id, ten: 'LS_DAN', loaiVai: 'DanLang', conSong: false }),
    ]);
    expect(ct.body.nhatKy[0]).toMatchObject({ loai: 'NGUOI_CHET' });
  });

  it('người không ngồi trong ván không mở được nhật ký (lộ vai cả làng); mã lạ là 404', async () => {
    const soi = await nguoiDaDangKy('ls_soi2');
    const dan = await nguoiDaDangKy('ls_dan2');
    const nguoiLa = await nguoiDaDangKy('ls_la');
    const vanId = await luuVanMau(soi.id, dan.id);
    expect((await nguoiLa.u.goi(`/api/lich-su/${vanId}`)).status).toBe(403);
    expect((await nguoiLa.u.goi('/api/lich-su')).body).toEqual([]);
    expect((await soi.u.goi('/api/lich-su/999999')).status).toBe(404);
    expect((await soi.u.goi('/api/lich-su/khong-phai-so')).status).toBe(404);
  });
});
