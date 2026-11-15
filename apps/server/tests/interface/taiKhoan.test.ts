// REST tài khoản (ROADMAP 4.2) — UC01, UC02, đăng xuất, UC03, tài khoản bị khóa (UC23).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { taoMayChuThu, taoNguoiDung } from './mayChuThu.js';

let may: Awaited<ReturnType<typeof taoMayChuThu>>;
beforeAll(async () => {
  may = await taoMayChuThu();
});
afterAll(() => may.dong());

const DANG_NHAP = { tenDangNhap: 'ngan_trang', matKhau: 'matkhau123' };

describe('UC01 — đăng ký', () => {
  it('tạo tài khoản, đặt cookie phiên httpOnly, trả phiên không kèm mật khẩu', async () => {
    const res = await fetch(`${may.url}/api/tai-khoan/dang-ky`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...DANG_NHAP, bietDanh: 'Ngân' }),
    });
    expect(res.status).toBe(201);
    const cookie = res.headers.getSetCookie()[0]!;
    expect(cookie).toMatch(/^ltm_phien=/);
    expect(cookie).toMatch(/HttpOnly/i);
    const body = await res.json();
    expect(body).toMatchObject({ tenDangNhap: 'ngan_trang', bietDanh: 'Ngân', laQuanTri: false });
    expect(JSON.stringify(body)).not.toMatch(/matKhau/);
    expect((await may.kho.taiKhoan.timTheoTen('ngan_trang'))!.matKhauBam).toMatch(/^\$2/);
  });

  it.each([
    [{ tenDangNhap: 'AB', bietDanh: 'Ngân', matKhau: 'matkhau123' }, 'TEN_DANG_NHAP_KHONG_HOP_LE'],
    [{ tenDangNhap: 'hop_le', bietDanh: 'Ngân', matKhau: 'ngan' }, 'MAT_KHAU_QUA_NGAN'],
    [{ tenDangNhap: 'hop_le', bietDanh: 'N', matKhau: 'matkhau123' }, 'BIET_DANH_KHONG_HOP_LE'],
    [{ ...DANG_NHAP, bietDanh: 'Khác' }, 'TRUNG_TEN_DANG_NHAP'],
    [{ tenDangNhap: 'thieu' }, 'DU_LIEU_KHONG_HOP_LE'],
  ])('từ chối dữ liệu sai: %o → %s', async (than, ma) => {
    const r = await taoNguoiDung(may.url).goi('/api/tai-khoan/dang-ky', 'POST', than);
    expect(r.body.loi).toBe(ma);
    expect(r.body.thongDiep).toBeTypeOf('string');
  });
});

describe('UC02 — đăng nhập, phiên, đăng xuất', () => {
  it('đăng nhập đúng thì /toi trả phiên; đăng xuất xóa cookie', async () => {
    const u = taoNguoiDung(may.url);
    expect((await u.goi('/api/tai-khoan/toi')).status).toBe(401);
    expect((await u.goi('/api/tai-khoan/dang-nhap', 'POST', DANG_NHAP)).status).toBe(200);
    expect((await u.goi('/api/tai-khoan/toi')).body.tenDangNhap).toBe('ngan_trang');
    expect((await u.goi('/api/tai-khoan/dang-xuat', 'POST')).status).toBe(204);
    expect((await u.goi('/api/tai-khoan/toi')).status).toBe(401);
  });

  it('sai mật khẩu và sai tên báo cùng một lỗi', async () => {
    const u = taoNguoiDung(may.url);
    const saiMk = await u.goi('/api/tai-khoan/dang-nhap', 'POST', {
      ...DANG_NHAP,
      matKhau: 'x'.repeat(9),
    });
    const saiTen = await u.goi('/api/tai-khoan/dang-nhap', 'POST', {
      ...DANG_NHAP,
      tenDangNhap: 'khong_co',
    });
    expect([saiMk.status, saiMk.body.loi]).toEqual([401, 'SAI_DANG_NHAP']);
    expect(saiTen.body.loi).toBe('SAI_DANG_NHAP');
  });

  it('cookie giả mạo không được nhận', async () => {
    const res = await fetch(`${may.url}/api/tai-khoan/toi`, {
      headers: { cookie: 'ltm_phien=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.gia' },
    });
    expect(res.status).toBe(401);
  });

  it('người chơi ảo không đăng nhập được', async () => {
    await may.kho.taiKhoan.layNguoiChoiAo(1);
    const r = await taoNguoiDung(may.url).goi('/api/tai-khoan/dang-nhap', 'POST', {
      tenDangNhap: 'ao_01',
      matKhau: '!',
    });
    expect(r.body.loi).toBe('SAI_DANG_NHAP');
  });
});

describe('UC23 — tài khoản bị khóa', () => {
  it('không đăng nhập được, và phiên đang có mất hiệu lực ngay', async () => {
    const u = taoNguoiDung(may.url);
    await u.goi('/api/tai-khoan/dang-ky', 'POST', {
      tenDangNhap: 'se_bi_khoa',
      bietDanh: 'Tùng',
      matKhau: 'matkhau123',
    });
    const id = (await u.goi('/api/tai-khoan/toi')).body.id;
    await may.kho.taiKhoan.datKhoa(id, true);
    expect((await u.goi('/api/tai-khoan/toi')).status).toBe(401);
    const dn = await taoNguoiDung(may.url).goi('/api/tai-khoan/dang-nhap', 'POST', {
      tenDangNhap: 'se_bi_khoa',
      matKhau: 'matkhau123',
    });
    expect([dn.status, dn.body.loi]).toEqual([403, 'TAI_KHOAN_BI_KHOA']);
  });
});

describe('UC03 — hồ sơ', () => {
  it('đổi biệt danh và ảnh đại diện; ảnh ngoài sáu tranh bị từ chối', async () => {
    const u = taoNguoiDung(may.url);
    await u.goi('/api/tai-khoan/dang-nhap', 'POST', DANG_NHAP);
    const r = await u.goi('/api/tai-khoan/ho-so', 'PATCH', {
      bietDanh: '  Ngân   Trăng ',
      anhDaiDien: 'TienTri',
    });
    expect(r.body).toMatchObject({ bietDanh: 'Ngân Trăng', anhDaiDien: 'TienTri', soVanDaChoi: 0 });
    const sai = await u.goi('/api/tai-khoan/ho-so', 'PATCH', { anhDaiDien: 'Rong' });
    expect(sai.body.loi).toBe('LUA_CHON_KHONG_HOP_LE');
  });
});
