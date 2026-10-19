import { describe, expect, it } from 'vitest';
import { LoiNghiepVu, MaQuyTac, Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import { DanLang, Soi } from '../../src/domain/vaitro/index.js';
import {
  ChoDuNguoi,
  DangChiaVai,
  GiaiQuyetDem,
  GiaiQuyetPhieu,
  HuyVan,
  KetThuc,
  NguoiChoi,
  PhaBoPhieu,
  PhaCongBo,
  PhaDem,
  PhaThaoLuan,
  VanDau,
  type TrangThaiVanDau,
} from '../../src/domain/van/index.js';

const T = TrangThaiVan;

/** Sơ đồ 06-state-van-dau.puml viết thành bảng: trạng thái → sự kiện → trạng thái kế tiếp. */
const SO_DO: Record<TrangThaiVan, Partial<Record<string, TrangThaiVan>>> = {
  [T.CHO_DU_NGUOI]: { batDauVan: T.DANG_CHIA_VAI, quaNguongMatKetNoi: T.HUY_VAN },
  [T.DANG_CHIA_VAI]: { chiaVaiXong: T.PHA_DEM, quaNguongMatKetNoi: T.HUY_VAN },
  [T.PHA_DEM]: { ketThucDem: T.GIAI_QUYET_DEM, quaNguongMatKetNoi: T.HUY_VAN },
  [T.GIAI_QUYET_DEM]: {
    chuaKetThuc: T.PHA_CONG_BO,
    thoaDieuKien: T.KET_THUC,
    quaNguongMatKetNoi: T.HUY_VAN,
  },
  [T.PHA_CONG_BO]: { congBoXong: T.PHA_THAO_LUAN, quaNguongMatKetNoi: T.HUY_VAN },
  [T.PHA_THAO_LUAN]: { hetGioThaoLuan: T.PHA_BO_PHIEU, quaNguongMatKetNoi: T.HUY_VAN },
  [T.PHA_BO_PHIEU]: { ketThucBoPhieu: T.GIAI_QUYET_PHIEU, quaNguongMatKetNoi: T.HUY_VAN },
  [T.GIAI_QUYET_PHIEU]: {
    chuaKetThuc: T.PHA_DEM,
    thoaDieuKien: T.KET_THUC,
    quaNguongMatKetNoi: T.HUY_VAN,
  },
  [T.KET_THUC]: {},
  [T.HUY_VAN]: {},
};

const TAT_CA_SU_KIEN = [
  'batDauVan',
  'chiaVaiXong',
  'ketThucDem',
  'chuaKetThuc',
  'thoaDieuKien',
  'congBoXong',
  'hetGioThaoLuan',
  'ketThucBoPhieu',
  'quaNguongMatKetNoi',
] as const;

const TAO: Record<TrangThaiVan, () => TrangThaiVanDau> = {
  [T.CHO_DU_NGUOI]: () => new ChoDuNguoi(),
  [T.DANG_CHIA_VAI]: () => new DangChiaVai(),
  [T.PHA_DEM]: () => new PhaDem(),
  [T.GIAI_QUYET_DEM]: () => new GiaiQuyetDem(),
  [T.PHA_CONG_BO]: () => new PhaCongBo(),
  [T.PHA_THAO_LUAN]: () => new PhaThaoLuan(),
  [T.PHA_BO_PHIEU]: () => new PhaBoPhieu(),
  [T.GIAI_QUYET_PHIEU]: () => new GiaiQuyetPhieu(),
  [T.KET_THUC]: () => new KetThuc(),
  [T.HUY_VAN]: () => new HuyVan(),
};

function batLoi(fn: () => unknown): LoiNghiepVu {
  try {
    fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e;
    throw e;
  }
  throw new Error('không ném lỗi');
}

function taoVan(luat = new BoLuatChoi()) {
  const nguoiChoi = ['s', 'a', 'b', 'c', 'd', 'e'].map((id, i) => {
    const nc = new NguoiChoi(id, `tk-${id}`, i + 1);
    nc.nhanVai(id === 's' ? new Soi() : new DanLang());
    return nc;
  });
  return new VanDau('v1', 'ph1', nguoiChoi, luat);
}

describe('Mẫu State của VanDau — sơ đồ 11.1', () => {
  it('mỗi lớp trạng thái mang đúng mã của nó', () => {
    for (const [ma, tao] of Object.entries(TAO)) expect(tao().ma).toBe(ma);
  });

  it('ma trận 10 trạng thái × 9 sự kiện: đúng mũi tên thì chuyển, còn lại ném lỗi', () => {
    let soO = 0;
    for (const ma of Object.values(T)) {
      for (const suKien of TAT_CA_SU_KIEN) {
        const dich = SO_DO[ma][suKien];
        const trangThai = TAO[ma]();
        if (dich) {
          expect(trangThai[suKien]().ma, `${ma} --${suKien}-->`).toBe(dich);
        } else {
          expect(batLoi(() => trangThai[suKien]()).ma, `${ma} --${suKien}--> (không có)`).toBe(
            'CHUYEN_TRANG_THAI_KHONG_HOP_LE',
          );
        }
        soO++;
      }
    }
    expect(soO).toBe(90);
  });

  it('chỉ CHO_DU_NGUOI cho phép đổi bộ luật; chỉ KET_THUC và HUY_VAN là trạng thái cuối', () => {
    for (const ma of Object.values(T)) {
      expect(TAO[ma]().choPhepDoiBoLuat()).toBe(ma === T.CHO_DU_NGUOI);
      expect(TAO[ma]().laTrangThaiCuoi()).toBe(ma === T.KET_THUC || ma === T.HUY_VAN);
    }
  });
});

describe('VanDau — chuyển pha qua đối tượng trạng thái', () => {
  it('đi trọn hai lượt rồi phe Dân thắng sau bỏ phiếu', () => {
    const van = taoVan();
    expect(van.trangThai).toBe(T.CHO_DU_NGUOI);
    const duongDi = [
      'batDauVan',
      'chiaVaiXong',
      'ketThucDem',
      'chuaKetThuc',
      'congBoXong',
      'hetGioThaoLuan',
      'ketThucBoPhieu',
      'chuaKetThuc', // sang đêm lượt 2
      'ketThucDem',
      'chuaKetThuc',
      'congBoXong',
      'hetGioThaoLuan',
      'ketThucBoPhieu',
    ] as const;
    const daQua = duongDi.map((suKien) => van.chuyenPha(suKien));
    expect(daQua).toEqual([
      T.DANG_CHIA_VAI,
      T.PHA_DEM,
      T.GIAI_QUYET_DEM,
      T.PHA_CONG_BO,
      T.PHA_THAO_LUAN,
      T.PHA_BO_PHIEU,
      T.GIAI_QUYET_PHIEU,
      T.PHA_DEM,
      T.GIAI_QUYET_DEM,
      T.PHA_CONG_BO,
      T.PHA_THAO_LUAN,
      T.PHA_BO_PHIEU,
      T.GIAI_QUYET_PHIEU,
    ]);
    van.ketThuc(Phe.DAN);
    expect(van.trangThai).toBe(T.KET_THUC);
    expect(van.pheThang).toBe(Phe.DAN);
    expect(van.nhatKy.dangMo()).toBe(false);
  });

  it('kết thúc ngay sau giải quyết đêm, bỏ qua pha ngày (UC14 luồng 6a)', () => {
    const van = taoVan();
    van.chuyenPha('batDauVan');
    van.chuyenPha('chiaVaiXong');
    van.chuyenPha('ketThucDem');
    van.ketThuc(Phe.SOI);
    expect(van.trangThai).toBe(T.KET_THUC);
    expect(van.pheThang).toBe(Phe.SOI);
  });

  it('sai thứ tự thì ném lỗi và giữ nguyên trạng thái', () => {
    const van = taoVan();
    expect(batLoi(() => van.chuyenPha('ketThucDem')).ma).toBe('CHUYEN_TRANG_THAI_KHONG_HOP_LE');
    expect(van.trangThai).toBe(T.CHO_DU_NGUOI);
    expect(batLoi(() => van.ketThuc(Phe.DAN)).ma).toBe('CHUYEN_TRANG_THAI_KHONG_HOP_LE');
    expect(van.pheThang).toBeNull();
    expect(van.nhatKy.dangMo()).toBe(true);
  });

  it('Q04 — hủy ván từ giữa pha đêm; ván đã hủy hay đã kết thúc thì không chuyển được nữa', () => {
    const van = taoVan();
    van.chuyenPha('batDauVan');
    van.chuyenPha('chiaVaiXong');
    van.huyVan();
    expect(van.trangThai).toBe(T.HUY_VAN);
    expect(van.pheThang).toBeNull();
    expect(van.nhatKy.dangMo()).toBe(false);
    expect(batLoi(() => van.huyVan()).ma).toBe('CHUYEN_TRANG_THAI_KHONG_HOP_LE');
    expect(batLoi(() => van.chuyenPha('ketThucDem')).ma).toBe('CHUYEN_TRANG_THAI_KHONG_HOP_LE');
  });

  it('TC20 — đổi bộ luật khi ván đang chạy: hệ thống chặn, bộ luật giữ nguyên tới hết ván', () => {
    const luatPhong = new BoLuatChoi();
    const van = taoVan(luatPhong);
    expect(van.choPhepDoiBoLuat()).toBe(true);
    van.chuyenPha('batDauVan');

    // Mọi trạng thái từ lúc bắt đầu tới hết ván đều chặn.
    const conLai = ['chiaVaiXong', 'ketThucDem', 'chuaKetThuc', 'congBoXong'] as const;
    for (const suKien of [undefined, ...conLai]) {
      if (suKien) van.chuyenPha(suKien);
      expect(van.choPhepDoiBoLuat(), van.trangThai).toBe(false);
      expect(batLoi(() => van.boLuatChoi.datQuyTac(MaQuyTac.BR11, false)).ma).toBe(
        'BO_LUAT_DA_KHOA',
      );
    }

    // Chủ phòng sửa bộ luật của phòng giữa chừng — bản của ván không đổi.
    luatPhong.datQuyTac(MaQuyTac.BR11, false);
    expect(van.boLuatChoi.chophep(MaQuyTac.BR11)).toBe(true);
  });
});
