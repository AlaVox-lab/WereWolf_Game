import { describe, expect, it } from 'vitest';
import {
  LoaiHanhDong,
  LoiNghiepVu,
  MaQuyTac,
  Phe,
  TrangThaiVan,
} from '../../src/domain/chung/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  TienTri,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';
import {
  HanhDongDem,
  KetQuaDem,
  LuotChoi,
  NguoiChoi,
  NguyenNhanChet,
  NhatKyVan,
  VanDau,
} from '../../src/domain/van/index.js';

function batLoi(fn: () => unknown): LoiNghiepVu {
  try {
    fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e;
    throw e;
  }
  throw new Error('không ném lỗi');
}

/** n người chơi, mã `p1..pn`, tài khoản `tk1..tkn`, ghế 1..n; vai gán theo danh sách nếu có. */
function taoNguoiChoi(n: number, vai: VaiTro[] = []): NguoiChoi[] {
  return Array.from({ length: n }, (_, i) => {
    const nc = new NguoiChoi(`p${i + 1}`, `tk${i + 1}`, i + 1);
    const v = vai[i];
    if (v) nc.nhanVai(v);
    return nc;
  });
}

const vaiMau = (): VaiTro[] => [
  new Soi(),
  new BaoVe(),
  new TienTri(),
  new PhuThuy(),
  new DanLang(),
  new DanLang(),
];

describe('NguoiChoi', () => {
  it('nhận vai đúng một lần; đọc vai trước khi chia là lỗi', () => {
    const nc = new NguoiChoi('p1', 'tk1', 1);
    expect(nc.daNhanVai()).toBe(false);
    expect(batLoi(() => nc.vaiTro).ma).toBe('CHUA_NHAN_VAI');
    const soi = new Soi();
    nc.nhanVai(soi);
    expect(nc.vaiTro).toBe(soi);
    expect(batLoi(() => nc.nhanVai(new DanLang())).ma).toBe('DA_NHAN_VAI');
  });

  it('đánh dấu chết nhớ nguyên nhân và lượt; không chết được hai lần', () => {
    const nc = new NguoiChoi('p1', 'tk1', 1);
    expect(nc.conSong).toBe(true);
    expect(nc.coTheHanhDong()).toBe(true);
    expect(nc.nguyenNhanChet).toBeNull();
    nc.danhDauChet(NguyenNhanChet.BI_TREO_CO, 2);
    expect(nc.conSong).toBe(false);
    expect(nc.coTheHanhDong()).toBe(false);
    expect(nc.nguyenNhanChet).toBe(NguyenNhanChet.BI_TREO_CO);
    expect(nc.luotChet).toBe(2);
    expect(batLoi(() => nc.danhDauChet(NguyenNhanChet.BI_CAN, 3)).ma).toBe('DA_CHET');
  });
});

describe('KetQuaDem', () => {
  it('BR08 — cùng một người thêm hai lần chỉ tính một người chết', () => {
    const kq = new KetQuaDem(1);
    expect(kq.coNguoiChet()).toBe(false);
    kq.themNguoiChet('a', NguyenNhanChet.BI_CAN);
    kq.themNguoiChet('a', NguyenNhanChet.BI_DOC);
    expect(kq.layDanhSachChet()).toEqual([{ nguoiChoiId: 'a', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    expect(kq.coNguoiChet()).toBe(true);
  });

  it('ghi người được cứu; chốt rồi thì không sửa được', () => {
    const kq = new KetQuaDem(1);
    kq.themNguoiDuocCuu('b');
    kq.themNguoiDuocCuu('b');
    expect(kq.layDanhSachDuocCuu()).toEqual(['b']);
    kq.chot();
    expect(batLoi(() => kq.themNguoiChet('a', NguyenNhanChet.BI_CAN)).ma).toBe('DEM_DA_GIAI_QUYET');
  });
});

describe('LuotChoi', () => {
  it('mỗi người tối đa một hành động cho mỗi loại trong một lượt (ràng buộc 12.3)', () => {
    const luot = new LuotChoi(1);
    luot.ghiYDinh(new HanhDongDem('s1', LoaiHanhDong.CAN, 'a', 20));
    luot.ghiYDinh(new HanhDongDem('s2', LoaiHanhDong.CAN, 'a', 20));
    expect(batLoi(() => luot.ghiYDinh(new HanhDongDem('s1', LoaiHanhDong.CAN, 'b', 20))).ma).toBe(
      'DA_CO_HANH_DONG',
    );
    expect(luot.layYDinh()).toHaveLength(2);
  });

  it('gắn kết quả đêm một lần; sau đó không ghi thêm ý định', () => {
    const luot = new LuotChoi(1);
    luot.ganKetQuaDem(new KetQuaDem(1));
    expect(luot.ketQuaDem?.soDem).toBe(1);
    expect(batLoi(() => luot.ganKetQuaDem(new KetQuaDem(1))).ma).toBe('DEM_DA_GIAI_QUYET');
    expect(
      batLoi(() => luot.ghiYDinh(new HanhDongDem('bv', LoaiHanhDong.BAO_VE, 'a', 10))).ma,
    ).toBe('DEM_DA_GIAI_QUYET');
  });

  it('HanhDongDem bất biến', () => {
    const hd = new HanhDongDem('bv', LoaiHanhDong.BAO_VE, 'a', 10);
    expect(Object.isFrozen(hd)).toBe(true);
  });
});

describe('NhatKyVan', () => {
  it('chỉ ghi thêm, đánh số theo thứ tự, sự kiện bất biến', () => {
    const nk = new NhatKyVan();
    const duLieu = { nguoiChoiId: 'a' };
    nk.ghiSuKien('CHUYEN_PHA', { pha: 'PHA_DEM' }, 1000);
    const sk = nk.ghiSuKien('NGUOI_CHET', duLieu, 2000);
    duLieu.nguoiChoiId = 'b';
    expect(sk).toMatchObject({ thuTu: 2, thoiDiem: 2000, duLieu: { nguoiChoiId: 'a' } });
    expect(Object.isFrozen(sk)).toBe(true);
    expect(Object.isFrozen(sk.duLieu)).toBe(true);
    expect(nk.soSuKien()).toBe(2);
  });

  it('chưa đóng thì không xuất công khai; đóng rồi thì không ghi thêm', () => {
    const nk = new NhatKyVan();
    nk.ghiSuKien('CHIA_VAI', {}, 0);
    expect(batLoi(() => nk.xuatBanCongKhai()).ma).toBe('NHAT_KY_CHUA_CONG_KHAI');
    nk.dong();
    expect(nk.xuatBanCongKhai().map((s) => s.loai)).toEqual(['CHIA_VAI']);
    expect(batLoi(() => nk.ghiSuKien('KET_THUC', {}, 1)).ma).toBe('NHAT_KY_DA_DONG');
  });
});

describe('VanDau', () => {
  it('cần 6–12 người, không trùng mã, tài khoản hay ghế', () => {
    const luat = new BoLuatChoi();
    expect(batLoi(() => new VanDau('v', 'ph', taoNguoiChoi(5), luat)).ma).toBe(
      'SO_NGUOI_KHONG_HOP_LE',
    );
    expect(batLoi(() => new VanDau('v', 'ph', taoNguoiChoi(13), luat)).ma).toBe(
      'SO_NGUOI_KHONG_HOP_LE',
    );
    const trungTaiKhoan = [...taoNguoiChoi(5), new NguoiChoi('p6', 'tk1', 6)];
    expect(batLoi(() => new VanDau('v', 'ph', trungTaiKhoan, luat)).ma).toBe('TRUNG_NGUOI_CHOI');
    const trungGhe = [...taoNguoiChoi(5), new NguoiChoi('p6', 'tk6', 1)];
    expect(batLoi(() => new VanDau('v', 'ph', trungGhe, luat)).ma).toBe('TRUNG_NGUOI_CHOI');
  });

  it('bắt đầu ở CHO_DU_NGUOI, chưa có lượt; người chơi xếp theo ghế', () => {
    const nguoiChoi = taoNguoiChoi(6).reverse();
    const van = new VanDau('v', 'ph', nguoiChoi, new BoLuatChoi());
    expect(van.trangThai).toBe(TrangThaiVan.CHO_DU_NGUOI);
    expect(van.luotHienTai).toBe(0);
    expect(batLoi(() => van.layLuotHienTai()).ma).toBe('CHUA_CO_LUOT');
    expect(van.layDanhSachNguoiChoi().map((n) => n.thuTuGhe)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('giữ bản sao đã khóa của bộ luật — chủ phòng sửa luật sau đó không ảnh hưởng ván', () => {
    const luatPhong = new BoLuatChoi();
    const van = new VanDau('v', 'ph', taoNguoiChoi(6), luatPhong);
    expect(van.boLuatChoi).not.toBe(luatPhong);
    expect(van.boLuatChoi.dangKhoa()).toBe(true);
    luatPhong.datQuyTac(MaQuyTac.BR06, false);
    expect(van.boLuatChoi.chophep(MaQuyTac.BR06)).toBe(true);
    expect(batLoi(() => van.boLuatChoi.datQuyTac(MaQuyTac.BR06, false)).ma).toBe('BO_LUAT_DA_KHOA');
  });

  it('tạo lượt mới tăng số thứ tự lượt', () => {
    const van = new VanDau('v', 'ph', taoNguoiChoi(6), new BoLuatChoi());
    van.taoLuotMoi();
    const luot2 = van.taoLuotMoi();
    expect(luot2.soThuTu).toBe(2);
    expect(van.luotHienTai).toBe(2);
    expect(van.layLuotHienTai()).toBe(luot2);
  });

  it('danhDauChet ghi lượt hiện tại; layNguoiConSong bỏ người chết', () => {
    const van = new VanDau('v', 'ph', taoNguoiChoi(6, vaiMau()), new BoLuatChoi());
    van.taoLuotMoi();
    van.danhDauChet([
      { nguoiChoiId: 'p5', nguyenNhan: NguyenNhanChet.BI_CAN },
      { nguoiChoiId: 'p6', nguyenNhan: NguyenNhanChet.BI_DOC },
    ]);
    expect(van.layNguoiConSong().map((n) => n.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(van.layNguoiChoi('p6')).toMatchObject({
      luotChet: 1,
      nguyenNhanChet: NguyenNhanChet.BI_DOC,
    });
  });

  it('danhDauChet không áp dụng nửa chừng khi danh sách có mục sai', () => {
    const van = new VanDau('v', 'ph', taoNguoiChoi(6, vaiMau()), new BoLuatChoi());
    van.taoLuotMoi();
    van.danhDauChet([{ nguoiChoiId: 'p6', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    expect(
      batLoi(() =>
        van.danhDauChet([
          { nguoiChoiId: 'p5', nguyenNhan: NguyenNhanChet.BI_TREO_CO },
          { nguoiChoiId: 'p6', nguyenNhan: NguyenNhanChet.BI_BAN },
        ]),
      ).ma,
    ).toBe('DA_CHET');
    expect(van.layNguoiChoi('p5').conSong).toBe(true);
    expect(
      batLoi(() => van.danhDauChet([{ nguoiChoiId: 'x', nguyenNhan: NguyenNhanChet.BI_CAN }])).ma,
    ).toBe('KHONG_TIM_THAY_NGUOI_CHOI');
  });

  it('layPheCua trả phe theo vai — kết quả soi của Tiên tri', () => {
    const van = new VanDau('v', 'ph', taoNguoiChoi(6, vaiMau()), new BoLuatChoi());
    expect(van.layPheCua('p1')).toBe(Phe.SOI);
    expect(van.layPheCua('p5')).toBe(Phe.DAN);
  });

  it('VanDau và NguoiChoi thật dùng được làm ngữ cảnh cho vai (khớp giao diện của 1.3)', () => {
    const van = new VanDau('v', 'ph', taoNguoiChoi(6, vaiMau()), new BoLuatChoi());
    van.taoLuotMoi();
    van.danhDauChet([{ nguoiChoiId: 'p6', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    const baoVe = van.layNguoiChoi('p2');
    const nc = { van, luat: van.boLuatChoi, nguoiThucHien: baoVe };
    expect(baoVe.vaiTro.layDanhSachMucTieu(nc).map((n) => n.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
    ]);
    const hd = baoVe.vaiTro.thucHienLuot(nc, { mucTieuId: 'p5' });
    van.layLuotHienTai().ghiYDinh(hd);
    expect(van.layLuotHienTai().layYDinh()).toEqual([hd]);
  });
});
