// PhongChoi (ROADMAP 4.3, 4.4) — thành viên, chủ phòng (Q11), loại người, cấu hình, bắt đầu ván.
import { describe, expect, it } from 'vitest';
import { LoaiVai, MaQuyTac, TrangThaiVan } from '../../src/domain/chung/index.js';
import { CauHinhVai } from '../../src/domain/luat/index.js';
import { PhongChoi, TrangThaiPhong } from '../../src/domain/phong/PhongChoi.js';

const nguoi = (i: number, ao = false) => ({ taiKhoanId: `t${i}`, ten: `N${i}`, laNguoiChoiAo: ao });

function phongCo(soNguoi: number) {
  const p = new PhongChoi('ABC234', nguoi(1));
  for (let i = 2; i <= soNguoi; i++) p.themThanhVien(nguoi(i));
  return p;
}

describe('PhongChoi — thành viên', () => {
  it('người tạo là chủ phòng; vào lại không bị trùng; tối đa 12 người', () => {
    const p = phongCo(12);
    expect(p.maChuPhong).toBe('t1');
    p.themThanhVien(nguoi(5));
    expect(p.layThanhVien()).toHaveLength(12);
    expect(() => p.themThanhVien(nguoi(13))).toThrow('PHONG_DA_DAY');
  });

  it('người chơi ảo không làm chủ phòng được', () => {
    expect(() => new PhongChoi('ABC234', nguoi(1, true))).toThrow('KHONG_CO_QUYEN');
  });

  it('Q11 — chủ phòng rời: quyền sang người thật vào sớm nhất; chỉ còn người ảo thì phòng đóng', () => {
    const p = new PhongChoi('ABC234', nguoi(1));
    p.themThanhVien(nguoi(2, true));
    p.themThanhVien(nguoi(3));
    p.themThanhVien(nguoi(4));
    expect(p.roiPhong('t1')).toBe(false);
    expect(p.maChuPhong).toBe('t3');
    p.roiPhong('t4');
    expect(p.roiPhong('t3')).toBe(true);
    expect(p.trangThai).toBe(TrangThaiPhong.DA_DONG);
    expect(p.layThanhVien()).toHaveLength(0);
  });

  it('UC10 — chỉ chủ phòng loại được người, không tự loại mình', () => {
    const p = phongCo(3);
    expect(() => p.loaiThanhVien('t2', 't3')).toThrow('KHONG_PHAI_CHU_PHONG');
    expect(() => p.loaiThanhVien('t1', 't1')).toThrow('KHONG_CO_QUYEN');
    p.loaiThanhVien('t1', 't3');
    expect(p.coThanhVien('t3')).toBe(false);
  });
});

describe('PhongChoi — cấu hình và bắt đầu ván', () => {
  it('UC08 — chỉ chủ phòng đặt bộ vai; vi phạm tính theo số người hiện có', () => {
    const p = phongCo(7);
    expect(() => p.datCauHinhVai('t2', CauHinhVai.macDinh(7))).toThrow('KHONG_PHAI_CHU_PHONG');
    expect(p.kiemTraBatDau().map((v) => v.ma)).toContain('TONG_VAI_KHAC_SO_NGUOI');
    p.datCauHinhVai('t1', CauHinhVai.macDinh(7));
    expect(p.kiemTraBatDau()).toEqual([]);
  });

  it('UC11 — bắt đầu ván: ghế theo thứ tự vào phòng, phòng khóa; cấu hình sai thì không bắt đầu', () => {
    const p = phongCo(6);
    p.datCauHinhVai('t1', new CauHinhVai({ [LoaiVai.Soi]: 3, [LoaiVai.DanLang]: 3 }));
    expect(() => p.batDauVan('t1', 'v1')).toThrow('CAU_HINH_VAI_KHONG_HOP_LE');
    p.datCauHinhVai('t1', CauHinhVai.macDinh(6));
    expect(() => p.batDauVan('t2', 'v1')).toThrow('KHONG_PHAI_CHU_PHONG');
    const van = p.batDauVan('t1', 'v1');
    expect(van.trangThai).toBe(TrangThaiVan.CHO_DU_NGUOI);
    expect(van.layDanhSachNguoiChoi().map((n) => [n.id, n.thuTuGhe])).toEqual(
      [1, 2, 3, 4, 5, 6].map((i) => [`t${i}`, i]),
    );
    expect(p.trangThai).toBe(TrangThaiPhong.DANG_CHOI);
    expect(() => p.themThanhVien(nguoi(9))).toThrow('PHONG_DA_BAT_DAU');
    expect(() => p.datCauHinhVai('t1', CauHinhVai.macDinh(6))).toThrow('PHONG_DA_BAT_DAU');
  });

  it('UC25 + TC20 — đổi luật phòng khi đang chơi bị chặn; ván giữ bản đã khóa', () => {
    const p = phongCo(6);
    p.datQuyTac('t1', MaQuyTac.BR11, false);
    p.datCauHinhVai('t1', CauHinhVai.macDinh(6));
    const van = p.batDauVan('t1', 'v1');
    expect(() => p.datQuyTac('t1', MaQuyTac.BR04, false)).toThrow('PHONG_DA_BAT_DAU');
    expect(van.boLuatChoi.chophep(MaQuyTac.BR11)).toBe(false);
    expect(() => van.boLuatChoi.datQuyTac(MaQuyTac.BR04, false)).toThrow('BO_LUAT_DA_KHOA');
    p.ketThucVan();
    expect(p.trangThai).toBe(TrangThaiPhong.CHO);
    p.datQuyTac('t1', MaQuyTac.BR04, false);
    expect(van.boLuatChoi.chophep(MaQuyTac.BR04)).toBe(true);
  });
});
