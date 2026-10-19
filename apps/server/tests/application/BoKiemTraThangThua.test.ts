import { describe, expect, it } from 'vitest';
import { BoKiemTraThangThua, KetQuaThangThua } from '../../src/application/BoKiemTraThangThua.js';
import { PhienBauCu } from '../../src/domain/baucu/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import { DanLang, Soi, TienTri, type VaiTro } from '../../src/domain/vaitro/index.js';
import { NguoiChoi, NguyenNhanChet, VanDau } from '../../src/domain/van/index.js';

const bo = new BoKiemTraThangThua();

/** Ván `soSoi` Sói + `soDan` người phe Dân; mã Sói là s1, s2…; mã Dân là d1, d2… */
function taoVan(soSoi: number, soDan: number) {
  const tao = (tienTo: string, so: number, vai: () => VaiTro, ghe: number) =>
    Array.from({ length: so }, (_, i) => {
      const nc = new NguoiChoi(`${tienTo}${i + 1}`, `tk-${tienTo}${i + 1}`, ghe + i);
      nc.nhanVai(vai());
      return nc;
    });
  const van = new VanDau(
    'v1',
    'ph1',
    [...tao('s', soSoi, () => new Soi(), 1), ...tao('d', soDan, () => new DanLang(), 100)],
    new BoLuatChoi(),
  );
  van.taoLuotMoi();
  return van;
}

const giet = (van: VanDau, ...ids: string[]) =>
  van.danhDauChet(ids.map((nguoiChoiId) => ({ nguoiChoiId, nguyenNhan: NguyenNhanChet.BI_CAN })));

describe('BoKiemTraThangThua — công thức mục 16.4', () => {
  it('đầu ván 2 Sói, 6 Dân: ván tiếp tục', () => {
    expect(bo.kiemTra(taoVan(2, 6))).toBe(KetQuaThangThua.CHUA_KET_THUC);
  });

  it('TC13 — còn 2 Sói và 2 Dân: phe Sói thắng ngay (BR01)', () => {
    const van = taoVan(2, 6);
    giet(van, 'd1', 'd2', 'd3', 'd4');
    expect(bo.kiemTra(van)).toBe(KetQuaThangThua.PHE_SOI_THANG);
  });

  it('TC14 — Sói cuối cùng bị treo cổ: phe Dân thắng ngay (BR02)', () => {
    const van = taoVan(2, 6);
    giet(van, 's1');
    const phien = new PhienBauCu(
      1,
      van.layNguoiConSong().map((n) => n.id),
      0,
    );
    for (const n of van.layNguoiConSong()) phien.ghiPhieu(n.id, 's2', 1);
    const kq = phien.kiemPhieu(van.boLuatChoi);
    expect(kq).toEqual({ loai: 'TREO_CO', nguoiBiTreoId: 's2' });
    van.danhDauChet([{ nguoiChoiId: 's2', nguyenNhan: NguyenNhanChet.BI_TREO_CO }]);
    expect(bo.kiemTra(van)).toBe(KetQuaThangThua.PHE_DAN_THANG);
  });

  it.each([
    // [Sói còn sống, Dân còn sống, kết quả]
    [0, 1, KetQuaThangThua.PHE_DAN_THANG], // S = 0
    [0, 0, KetQuaThangThua.PHE_DAN_THANG], // S = 0 ưu tiên trước S ≥ D
    [1, 0, KetQuaThangThua.PHE_SOI_THANG], // S > D
    [1, 1, KetQuaThangThua.PHE_SOI_THANG], // S = D
    [2, 2, KetQuaThangThua.PHE_SOI_THANG], // S = D
    [3, 2, KetQuaThangThua.PHE_SOI_THANG], // S > D
    [1, 2, KetQuaThangThua.CHUA_KET_THUC], // S = D − 1
    [2, 3, KetQuaThangThua.CHUA_KET_THUC], // S = D − 1
    [3, 9, KetQuaThangThua.CHUA_KET_THUC],
  ])('biên: %i Sói, %i Dân còn sống → %s', (soi, dan, ketQua) => {
    const van = taoVan(3, 9);
    const chet = [
      ...Array.from({ length: 3 - soi }, (_, i) => `s${i + 1}`),
      ...Array.from({ length: 9 - dan }, (_, i) => `d${i + 1}`),
    ];
    if (chet.length) giet(van, ...chet);
    expect(bo.kiemTra(van)).toBe(ketQua);
  });

  it('chỉ đếm theo phe của vai, không theo tên vai — Tiên tri tính là phe Dân', () => {
    const van = taoVan(1, 5);
    const tienTri = new NguoiChoi('tt', 'tk-tt', 50);
    tienTri.nhanVai(new TienTri());
    const vanCoTienTri = new VanDau(
      'v2',
      'ph1',
      [...van.layDanhSachNguoiChoi().slice(0, 5), tienTri],
      new BoLuatChoi(),
    );
    vanCoTienTri.taoLuotMoi();
    giet(vanCoTienTri, 'd1', 'd2', 'd3');
    // Còn s1, d4, tt: S = 1, D = 2
    expect(bo.kiemTra(vanCoTienTri)).toBe(KetQuaThangThua.CHUA_KET_THUC);
  });
});
