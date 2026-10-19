import { describe, expect, it } from 'vitest';
import { LoaiVai, LoiNghiepVu, MaQuyTac } from '../../src/domain/chung/index.js';
import { BoLuatChoi, CauHinhVai } from '../../src/domain/luat/index.js';

const TUY_BIEN = [
  MaQuyTac.BR03,
  MaQuyTac.BR04,
  MaQuyTac.BR05,
  MaQuyTac.BR06,
  MaQuyTac.BR09,
  MaQuyTac.BR11,
];
const CO_DINH = Object.values(MaQuyTac).filter((ma) => !TUY_BIEN.includes(ma));

function batLoi(fn: () => unknown): LoiNghiepVu {
  try {
    fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e;
    throw e;
  }
  throw new Error('không ném lỗi');
}

describe('BoLuatChoi', () => {
  it('mặc định bật cả sáu quy tắc tùy biến', () => {
    const luat = new BoLuatChoi();
    for (const ma of TUY_BIEN) expect(luat.chophep(ma)).toBe(true);
  });

  it('đúng sáu quy tắc tùy biến, theo thứ tự mã', () => {
    expect(BoLuatChoi.danhSachQuyTacTuyBien()).toEqual(TUY_BIEN);
  });

  it('chophep() phản ánh đúng thuộc tính tương ứng của từng quy tắc', () => {
    const luat = new BoLuatChoi({ camPhuThuyTuCuu: false, thoSanBanKhiTreoCo: false });
    expect(luat.chophep(MaQuyTac.BR04)).toBe(false);
    expect(luat.chophep(MaQuyTac.BR09)).toBe(false);
    expect(luat.chophep(MaQuyTac.BR03)).toBe(true);
    expect(luat.chophep(MaQuyTac.BR05)).toBe(true);
    expect(luat.chophep(MaQuyTac.BR06)).toBe(true);
    expect(luat.chophep(MaQuyTac.BR11)).toBe(true);
  });

  it('tám quy tắc cố định luôn bật, kể cả khi tắt hết quy tắc tùy biến', () => {
    const luat = new BoLuatChoi({
      batDemDauCoChet: false,
      camPhuThuyTuCuu: false,
      choBaoVeTuDo: false,
      camDoTrungDem: false,
      thoSanBanKhiTreoCo: false,
      hoaPhieuKhongAiChet: false,
    });
    expect(CO_DINH).toHaveLength(8);
    for (const ma of CO_DINH) expect(luat.chophep(ma)).toBe(true);
    for (const ma of TUY_BIEN) expect(luat.chophep(ma)).toBe(false);
  });

  it('datQuyTac() bật tắt được từng quy tắc tùy biến', () => {
    const luat = new BoLuatChoi();
    for (const ma of TUY_BIEN) {
      luat.datQuyTac(ma, false);
      expect(luat.chophep(ma)).toBe(false);
      luat.datQuyTac(ma, true);
      expect(luat.chophep(ma)).toBe(true);
    }
  });

  it('không cho đặt quy tắc cố định', () => {
    const luat = new BoLuatChoi();
    for (const ma of CO_DINH) {
      expect(batLoi(() => luat.datQuyTac(ma, false)).ma).toBe('QUY_TAC_CO_DINH');
      expect(luat.chophep(ma)).toBe(true);
    }
  });

  it('mọi tổ hợp đều hợp lệ khi chưa có ràng buộc giữa các quy tắc (Q12)', () => {
    for (let mask = 0; mask < 64; mask++) {
      const luat = new BoLuatChoi();
      TUY_BIEN.forEach((ma, i) => luat.datQuyTac(ma, Boolean(mask & (1 << i))));
      expect(luat.kiemTraHopLe()).toEqual([]);
    }
  });

  it('layMoTa() trả sáu dòng kèm trạng thái và nội dung', () => {
    const moTa = new BoLuatChoi({ choBaoVeTuDo: false }).layMoTa();
    expect(moTa.map((d) => d.ma)).toEqual(TUY_BIEN);
    expect(moTa.find((d) => d.ma === MaQuyTac.BR05)).toMatchObject({
      thuocTinh: 'choBaoVeTuDo',
      dangBat: false,
    });
    for (const dong of moTa) expect(dong.noiDung.length).toBeGreaterThan(0);
  });

  describe('saoChep() — bộ luật bất biến trong ván', () => {
    it('bản sao giữ nguyên giá trị và bị khóa; bản gốc không bị khóa', () => {
      const phong = new BoLuatChoi({ camDoTrungDem: false });
      const van = phong.saoChep();
      expect(van.layGiaTri()).toEqual(phong.layGiaTri());
      expect(van.dangKhoa()).toBe(true);
      expect(phong.dangKhoa()).toBe(false);
      expect(Object.isFrozen(van)).toBe(true);
    });

    it('sửa bản sao bị chặn bằng BO_LUAT_DA_KHOA, giá trị không đổi', () => {
      const van = new BoLuatChoi().saoChep();
      for (const ma of TUY_BIEN) {
        expect(batLoi(() => van.datQuyTac(ma, false)).ma).toBe('BO_LUAT_DA_KHOA');
        expect(van.chophep(ma)).toBe(true);
      }
    });

    it('chủ phòng sửa bộ luật của phòng sau khi ván bắt đầu không làm đổi bản của ván', () => {
      const phong = new BoLuatChoi();
      const van = phong.saoChep();
      phong.datQuyTac(MaQuyTac.BR04, false);
      expect(phong.chophep(MaQuyTac.BR04)).toBe(false);
      expect(van.chophep(MaQuyTac.BR04)).toBe(true);
    });

    it('layGiaTri() trả bản sao, sửa nó không ảnh hưởng bộ luật', () => {
      const van = new BoLuatChoi().saoChep();
      const giaTri = van.layGiaTri();
      giaTri.camPhuThuyTuCuu = false;
      expect(van.chophep(MaQuyTac.BR04)).toBe(true);
    });
  });
});

describe('CauHinhVai', () => {
  const cauHinh = (soLuong: Partial<Record<LoaiVai, number>>) => new CauHinhVai(soLuong);
  const maViPham = (c: CauHinhVai, n: number) => c.kiemTraHopLe(n).map((v) => v.ma);

  it('vai không khai báo có số lượng 0; tongSoVai() cộng đủ sáu vai', () => {
    const c = cauHinh({ [LoaiVai.Soi]: 2, [LoaiVai.DanLang]: 5, [LoaiVai.ThoSan]: 1 });
    expect(c.soLuong(LoaiVai.PhuThuy)).toBe(0);
    expect(c.tongSoVai()).toBe(8);
    expect(c.layDanhSach()).toEqual({
      DanLang: 5,
      BaoVe: 0,
      Soi: 2,
      TienTri: 0,
      PhuThuy: 0,
      ThoSan: 1,
    });
  });

  it('bộ vai đủ sáu loại cho 9 người là hợp lệ', () => {
    const c = cauHinh({
      [LoaiVai.Soi]: 2,
      [LoaiVai.BaoVe]: 1,
      [LoaiVai.TienTri]: 1,
      [LoaiVai.PhuThuy]: 1,
      [LoaiVai.ThoSan]: 1,
      [LoaiVai.DanLang]: 3,
    });
    expect(c.kiemTraHopLe(9)).toEqual([]);
  });

  it.each([
    [6, 1, true],
    [6, 2, false],
    [7, 2, true],
    [8, 2, true],
    [9, 2, true],
    [9, 3, false],
    [10, 3, true],
    [12, 3, true],
    [12, 4, false],
  ])('%i người, %i Sói → hợp lệ: %s (Sói < n/3)', (n, soi, hopLe) => {
    const c = cauHinh({ [LoaiVai.Soi]: soi, [LoaiVai.DanLang]: n - soi });
    expect(c.kiemTraHopLe(n).length === 0).toBe(hopLe);
  });

  it('không có Sói thì báo THIEU_SOI', () => {
    expect(maViPham(cauHinh({ [LoaiVai.DanLang]: 6 }), 6)).toEqual(['THIEU_SOI']);
  });

  it('số người ngoài khoảng 6–12 thì báo SO_NGUOI_NGOAI_KHOANG', () => {
    expect(maViPham(cauHinh({ [LoaiVai.Soi]: 1, [LoaiVai.DanLang]: 4 }), 5)).toContain(
      'SO_NGUOI_NGOAI_KHOANG',
    );
    expect(maViPham(cauHinh({ [LoaiVai.Soi]: 4, [LoaiVai.DanLang]: 9 }), 13)).toContain(
      'SO_NGUOI_NGOAI_KHOANG',
    );
  });

  it('tổng vai khác số người thì báo TONG_VAI_KHAC_SO_NGUOI', () => {
    expect(maViPham(cauHinh({ [LoaiVai.Soi]: 1, [LoaiVai.DanLang]: 4 }), 6)).toEqual([
      'TONG_VAI_KHAC_SO_NGUOI',
    ]);
  });

  it('vai đặc biệt vượt giới hạn thì chỉ rõ vai nào', () => {
    const c = cauHinh({
      [LoaiVai.Soi]: 2,
      [LoaiVai.PhuThuy]: 2,
      [LoaiVai.ThoSan]: 3,
      [LoaiVai.DanLang]: 3,
    });
    const viPham = c.kiemTraHopLe(10).filter((v) => v.ma === 'VUOT_GIOI_HAN_VAI');
    expect(viPham.map((v) => v.loaiVai).sort()).toEqual([LoaiVai.PhuThuy, LoaiVai.ThoSan]);
  });

  it('cho phép 2 Thợ săn — cần cho dây chuyền BR10', () => {
    const c = cauHinh({ [LoaiVai.Soi]: 2, [LoaiVai.ThoSan]: 2, [LoaiVai.DanLang]: 4 });
    expect(c.kiemTraHopLe(8)).toEqual([]);
  });

  it('số lượng âm hoặc không nguyên thì báo SO_LUONG_KHONG_HOP_LE', () => {
    expect(maViPham(cauHinh({ [LoaiVai.Soi]: 1, [LoaiVai.DanLang]: -1 }), 6)).toEqual([
      'SO_LUONG_KHONG_HOP_LE',
    ]);
    expect(maViPham(cauHinh({ [LoaiVai.Soi]: 1.5, [LoaiVai.DanLang]: 5 }), 6)).toContain(
      'SO_LUONG_KHONG_HOP_LE',
    );
  });

  it('khớp luật Q06 ở mọi tổ hợp vai cho phòng 6–12 người', () => {
    // Đối chiếu kiemTraHopLe() với công thức viết lại độc lập, trên mọi tổ hợp có tổng bằng n.
    let soToHop = 0;
    for (let n = 6; n <= 12; n++) {
      for (let soi = 0; soi <= 5; soi++)
        for (let baoVe = 0; baoVe <= 2; baoVe++)
          for (let tienTri = 0; tienTri <= 2; tienTri++)
            for (let phuThuy = 0; phuThuy <= 2; phuThuy++)
              for (let thoSan = 0; thoSan <= 3; thoSan++) {
                const danLang = n - soi - baoVe - tienTri - phuThuy - thoSan;
                if (danLang < 0) continue;
                const mongDoi =
                  soi >= 1 &&
                  3 * soi < n &&
                  baoVe <= 1 &&
                  tienTri <= 1 &&
                  phuThuy <= 1 &&
                  thoSan <= 2;
                const c = cauHinh({
                  [LoaiVai.Soi]: soi,
                  [LoaiVai.BaoVe]: baoVe,
                  [LoaiVai.TienTri]: tienTri,
                  [LoaiVai.PhuThuy]: phuThuy,
                  [LoaiVai.ThoSan]: thoSan,
                  [LoaiVai.DanLang]: danLang,
                });
                expect(
                  c.kiemTraHopLe(n).length === 0,
                  `${n} người ${JSON.stringify(c.layDanhSach())}`,
                ).toBe(mongDoi);
                soToHop++;
              }
    }
    expect(soToHop).toBeGreaterThan(1000);
  });
});
