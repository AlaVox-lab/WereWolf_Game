// REST phòng (ROADMAP 4.3) — tạo phòng, danh sách công khai, xem trước, phòng của tôi.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { taoMayChuThu, taoNguoiDung } from './mayChuThu.js';

let may: Awaited<ReturnType<typeof taoMayChuThu>>;
beforeAll(async () => {
  may = await taoMayChuThu();
});
afterAll(() => may.dong());

async function nguoiDaDangKy(ten: string) {
  const u = taoNguoiDung(may.url);
  await u.goi('/api/tai-khoan/dang-ky', 'POST', {
    tenDangNhap: ten,
    bietDanh: ten.toUpperCase(),
    matKhau: 'matkhau123',
  });
  return u;
}

describe('REST phòng', () => {
  it('chưa đăng nhập thì không tạo được phòng', async () => {
    const r = await taoNguoiDung(may.url).goi('/api/phong', 'POST');
    expect(r.status).toBe(401);
  });

  it('UC06 — tạo phòng trả ảnh chụp phòng; phòng-của-tôi trả đúng phòng đó', async () => {
    const u = await nguoiDaDangKy('chu_phong');
    const r = await u.goi('/api/phong', 'POST');
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ trangThai: 'CHO', soNguoiToiDa: 12, choPhepNguoiChoiAo: true });
    expect(r.body.thanhVien).toHaveLength(1);
    expect((await u.goi('/api/phong-cua-toi')).body.maPhong).toBe(r.body.maPhong);
    expect((await u.goi(`/api/phong/${r.body.maPhong}`)).body.chuPhongId).toBe(r.body.chuPhongId);
    expect((await u.goi('/api/phong/ZZZZZZ')).status).toBe(404);
  });

  it('danh sách công khai chỉ có phòng chủ phòng đã mở công khai', async () => {
    const u = await nguoiDaDangKy('chu_cong_khai');
    const { body } = await u.goi('/api/phong', 'POST');
    expect(
      (await u.goi('/api/phong')).body.some((p: { maPhong: string }) => p.maPhong === body.maPhong),
    ).toBe(false);
    may.phong.datCongKhai(body.maPhong, body.chuPhongId, true);
    const ds = (await u.goi('/api/phong')).body;
    expect(ds).toContainEqual({
      maPhong: body.maPhong,
      tenChuPhong: 'CHU_CONG_KHAI',
      soNguoi: 1,
      soNguoiToiDa: 12,
    });
  });
});
