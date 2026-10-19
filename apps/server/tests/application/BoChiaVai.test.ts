import { describe, expect, it } from 'vitest';
import { BoChiaVai } from '../../src/application/BoChiaVai.js';
import { LoaiVai, LoiNghiepVu, NgauNhienCoHat, Phe } from '../../src/domain/chung/index.js';
import { BoLuatChoi, CauHinhVai } from '../../src/domain/luat/index.js';
import { BaoVe, DanLang, PhuThuy, Soi, ThoSan, TienTri } from '../../src/domain/vaitro/index.js';
import { NguoiChoi, VanDau } from '../../src/domain/van/index.js';

function batLoi(fn: () => unknown): LoiNghiepVu {
  try {
    fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e;
    throw e;
  }
  throw new Error('không ném lỗi');
}

/** Ván n người chưa chia vai, đã sang DANG_CHIA_VAI. */
function taoVan(n: number) {
  const nguoiChoi = Array.from(
    { length: n },
    (_, i) => new NguoiChoi(`p${i + 1}`, `tk${i + 1}`, i + 1),
  );
  const van = new VanDau('v1', 'ph1', nguoiChoi, new BoLuatChoi());
  van.chuyenPha('batDauVan');
  return van;
}

const CAU_HINH_9 = new CauHinhVai({
  [LoaiVai.Soi]: 2,
  [LoaiVai.BaoVe]: 1,
  [LoaiVai.TienTri]: 1,
  [LoaiVai.PhuThuy]: 1,
  [LoaiVai.ThoSan]: 1,
  [LoaiVai.DanLang]: 3,
});

describe('BoChiaVai — Factory', () => {
  it('taoVai() sinh đúng lớp cho từng loại, mỗi lần một đối tượng mới', () => {
    const bo = new BoChiaVai(new NgauNhienCoHat(1));
    const mongDoi = {
      [LoaiVai.DanLang]: DanLang,
      [LoaiVai.BaoVe]: BaoVe,
      [LoaiVai.Soi]: Soi,
      [LoaiVai.TienTri]: TienTri,
      [LoaiVai.PhuThuy]: PhuThuy,
      [LoaiVai.ThoSan]: ThoSan,
    };
    for (const [loai, Lop] of Object.entries(mongDoi)) {
      const vai = bo.taoVai(loai as LoaiVai);
      expect(vai).toBeInstanceOf(Lop);
      expect(vai.loaiVai).toBe(loai);
    }
    expect(bo.taoVai(LoaiVai.PhuThuy)).not.toBe(bo.taoVai(LoaiVai.PhuThuy));
  });

  it('sinhDanhSachVai() đúng số lượng từng vai theo cấu hình', () => {
    const ds = new BoChiaVai(new NgauNhienCoHat(1)).sinhDanhSachVai(CAU_HINH_9);
    expect(ds).toHaveLength(9);
    expect(ds.filter((v) => v.loaiVai === LoaiVai.Soi)).toHaveLength(2);
    expect(ds.filter((v) => v.loaiVai === LoaiVai.DanLang)).toHaveLength(3);
  });
});

describe('BoChiaVai — chia vai (UC12)', () => {
  it('mỗi người đúng một vai; bộ vai sau chia khớp cấu hình', () => {
    const van = taoVan(9);
    const bang = new BoChiaVai(new NgauNhienCoHat(42)).chiaVai(van, CAU_HINH_9);
    expect(Object.keys(bang).sort()).toEqual(
      van
        .layDanhSachNguoiChoi()
        .map((n) => n.id)
        .sort(),
    );
    for (const n of van.layDanhSachNguoiChoi()) expect(n.vaiTro.loaiVai).toBe(bang[n.id]);
    const dem = (loai: LoaiVai) => Object.values(bang).filter((l) => l === loai).length;
    for (const loai of Object.values(LoaiVai)) expect(dem(loai)).toBe(CAU_HINH_9.soLuong(loai));
    expect(van.layNguoiConSong().filter((n) => n.vaiTro.phe === Phe.SOI)).toHaveLength(2);
  });

  it('cùng hạt giống cho cùng kết quả (PC03); khác hạt giống thường cho kết quả khác', () => {
    const chia = (hat: number) =>
      new BoChiaVai(new NgauNhienCoHat(hat)).chiaVai(taoVan(9), CAU_HINH_9);
    expect(chia(7)).toEqual(chia(7));
    const khac = [1, 2, 3, 4, 5].map(chia).map((b) => JSON.stringify(b));
    expect(new Set(khac).size).toBeGreaterThan(1);
  });

  it('luồng 2a — tổng vai không khớp số người: báo lỗi, không ai nhận vai', () => {
    const van = taoVan(8);
    const loi = batLoi(() => new BoChiaVai(new NgauNhienCoHat(1)).chiaVai(van, CAU_HINH_9));
    expect(loi.ma).toBe('CAU_HINH_VAI_KHONG_HOP_LE');
    expect(loi.message).toContain('TONG_VAI_KHAC_SO_NGUOI');
    expect(van.layDanhSachNguoiChoi().some((n) => n.daNhanVai())).toBe(false);
  });

  it('cấu hình vi phạm Q06 (quá nhiều Sói) cũng bị chặn trước khi gán', () => {
    const van = taoVan(6);
    const cauHinh = new CauHinhVai({ [LoaiVai.Soi]: 2, [LoaiVai.DanLang]: 4 });
    const loi = batLoi(() => new BoChiaVai(new NgauNhienCoHat(1)).chiaVai(van, cauHinh));
    expect(loi.message).toContain('QUA_NHIEU_SOI');
    expect(van.layDanhSachNguoiChoi().some((n) => n.daNhanVai())).toBe(false);
  });

  it('chỉ chia khi ván đang DANG_CHIA_VAI và chưa chia lần nào', () => {
    const nguoiChoi = Array.from({ length: 6 }, (_, i) => new NguoiChoi(`p${i}`, `tk${i}`, i));
    const vanChuaBatDau = new VanDau('v', 'ph', nguoiChoi, new BoLuatChoi());
    const cauHinh = new CauHinhVai({ [LoaiVai.Soi]: 1, [LoaiVai.DanLang]: 5 });
    const bo = new BoChiaVai(new NgauNhienCoHat(1));
    expect(batLoi(() => bo.chiaVai(vanChuaBatDau, cauHinh)).ma).toBe(
      'CHUYEN_TRANG_THAI_KHONG_HOP_LE',
    );
    const van = taoVan(6);
    bo.chiaVai(van, cauHinh);
    expect(batLoi(() => bo.chiaVai(van, cauHinh)).ma).toBe('DA_NHAN_VAI');
  });
});

describe('BoChiaVai — phân bố ngẫu nhiên đều', () => {
  it('xaoTron() cho 6 hoán vị của 3 phần tử với tần suất gần như nhau (60 000 lần)', () => {
    const bo = new BoChiaVai(new NgauNhienCoHat(2026));
    const dem = new Map<string, number>();
    for (let i = 0; i < 60_000; i++) {
      const khoa = bo.xaoTron(['a', 'b', 'c']).join('');
      dem.set(khoa, (dem.get(khoa) ?? 0) + 1);
    }
    expect(dem.size).toBe(6);
    for (const lan of dem.values()) expect(Math.abs(lan - 10_000)).toBeLessThan(400);
  });

  it('xaoTron() không sửa danh sách gốc', () => {
    const goc = [1, 2, 3, 4];
    new BoChiaVai(new NgauNhienCoHat(1)).xaoTron(goc);
    expect(goc).toEqual([1, 2, 3, 4]);
  });

  it('10 000 lần chia 6 người 1 Sói: mỗi ghế nhận Sói khoảng 1/6 số lần', () => {
    const bo = new BoChiaVai(new NgauNhienCoHat(99));
    const cauHinh = new CauHinhVai({ [LoaiVai.Soi]: 1, [LoaiVai.DanLang]: 5 });
    const demSoi = new Map<string, number>();
    for (let i = 0; i < 10_000; i++) {
      const bang = bo.chiaVai(taoVan(6), cauHinh);
      const soi = Object.entries(bang).find(([, loai]) => loai === LoaiVai.Soi)![0];
      demSoi.set(soi, (demSoi.get(soi) ?? 0) + 1);
    }
    expect(demSoi.size).toBe(6);
    for (const lan of demSoi.values()) expect(Math.abs(lan - 10_000 / 6)).toBeLessThan(150);
  });
});
