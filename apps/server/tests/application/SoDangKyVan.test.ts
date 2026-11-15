// Sổ đăng ký ván (ROADMAP 4.6) — UC11 bắt đầu ván từ phòng, chạy trọn ván, mở lại phòng, Q04 hủy.
import { describe, expect, it } from 'vitest';
import { SoDangKyPhong } from '../../src/application/phong/SoDangKyPhong.js';
import type { ThongTinPhien } from '../../src/application/taikhoan/DichVuTaiKhoan.js';
import { SoDangKyVan, type VanDangChay } from '../../src/application/van/SoDangKyVan.js';
import { DongHoGia, NgauNhienCoHat, Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import { NguoiChoiAo } from '../../src/infrastructure/bot/NguoiChoiAo.js';
import { taoKhoBoNho } from '../../src/infrastructure/repository/boNho/khoBoNho.js';

const phien = (i: number): ThongTinPhien => ({
  id: `t${i}`,
  tenDangNhap: `u${i}`,
  bietDanh: `Người ${i}`,
  anhDaiDien: 'DanLang',
  laQuanTri: false,
});

function dung(hatGiong = 3) {
  const dongHo = new DongHoGia();
  const kho = taoKhoBoNho();
  let soBot = 0;
  const van = new SoDangKyVan({
    dongHo,
    nguonNgauNhien: new NgauNhienCoHat(hatGiong),
    thoiGianXemVai: 5_000,
    taoNguoiChoiAo: (id, d, c, b) => new NguoiChoiAo(id, d, c, b, new NgauNhienCoHat(++soBot)),
  });
  const phong = new SoDangKyPhong({
    kho,
    nguonNgauNhien: new NgauNhienCoHat(hatGiong),
    choPhepNguoiChoiAo: true,
    soDangKyVan: van,
  });
  const ketThuc: VanDangChay[] = [];
  van.dangKyKetThuc((v) => {
    ketThuc.push(v);
  });
  return { dongHo, van, phong, ketThuc };
}

/** Tua đồng hồ giả tới khi ván kết thúc (như bộ mô phỏng 2.9). */
async function chayHet(dongHo: DongHoGia, xong: () => boolean) {
  for (let i = 0; i < 50_000 && !xong(); i++) {
    await new Promise<void>((r) => setImmediate(r));
    if (!xong() && !dongHo.tuaToiHenKeTiep()) break;
  }
}

async function phongSanSang(phong: SoDangKyPhong) {
  const ma = await phong.taoPhong(phien(1));
  for (let i = 0; i < 5; i++) await phong.themNguoiChoiAo(ma, 't1');
  phong.goiYCauHinhVai(ma, 't1');
  return ma;
}

describe('SoDangKyVan — bắt đầu và chạy trọn ván', () => {
  it('UC11 — một người thật + 5 người ảo: chia vai, khóa phòng, chạy tới khi có phe thắng, mở lại phòng', async () => {
    const { dongHo, van, phong, ketThuc } = dung();
    const ma = await phongSanSang(phong);
    const vanId = phong.batDauVan(ma, 't1');

    expect(phong.chieu(ma)).toMatchObject({ trangThai: 'DANG_CHOI', vanId });
    await expect(async () => phong.vaoPhong(ma, phien(9))).rejects.toThrow('PHONG_DA_BAT_DAU');
    expect(van.vanCua('t1')).toBe(vanId);
    const g = van.gocNhin(vanId, 't1');
    expect(g.toi.loaiVai).toBeTypeOf('string');
    expect(g.nguoiChoi).toHaveLength(6);

    await chayHet(dongHo, () => ketThuc.length > 0);
    expect(ketThuc).toHaveLength(1);
    expect([Phe.DAN, Phe.SOI]).toContain(ketThuc[0]!.ketQua);
    expect(ketThuc[0]!.van.trangThai).toBe(TrangThaiVan.KET_THUC);
    expect(phong.chieu(ma)).toMatchObject({ trangThai: 'CHO', vanId: null });
    expect(van.vanCua('t1')).toBeNull();
  });

  it('lựa chọn của người thật đi qua đúng cửa CongLuaChon; không ở ván nào thì bị từ chối', async () => {
    const { van, phong } = dung();
    const ma = await phongSanSang(phong);
    phong.batDauVan(ma, 't1');
    expect(() => van.guiLuaChon('t1', { mucTieuId: 'x' })).toThrow('KHONG_CO_YEU_CAU');
    expect(() => van.guiLuaChon('khong_co', {})).toThrow('KHONG_CO_YEU_CAU');
  });

  it('chủ phòng bắt đầu khi bộ vai sai thì bị từ chối, phòng vẫn chờ', async () => {
    const { phong } = dung();
    const ma = await phong.taoPhong(phien(1));
    for (let i = 0; i < 5; i++) await phong.themNguoiChoiAo(ma, 't1');
    phong.datCauHinhVai(ma, 't1', { Soi: 3, DanLang: 3 });
    expect(() => phong.batDauVan(ma, 't1')).toThrow('CAU_HINH_VAI_KHONG_HOP_LE');
    expect(phong.chieu(ma).trangThai).toBe('CHO');
  });

  it('Q04 — hủy ván: báo kết thúc với kết quả null, phòng mở lại', async () => {
    const { van, phong, ketThuc } = dung();
    const ma = await phongSanSang(phong);
    const vanId = phong.batDauVan(ma, 't1');
    van.huyVan(vanId);
    await new Promise<void>((r) => setImmediate(r));
    expect(ketThuc[0]).toMatchObject({ vanId, ketQua: null });
    expect(ketThuc[0]!.van.trangThai).toBe(TrangThaiVan.HUY_VAN);
    expect(phong.chieu(ma).trangThai).toBe('CHO');
  });
});
