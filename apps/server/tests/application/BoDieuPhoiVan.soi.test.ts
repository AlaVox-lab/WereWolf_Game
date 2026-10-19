import { describe, expect, it } from 'vitest';
import { LoaiHanhDong, LoaiVai } from '../../src/domain/chung/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  TienTri,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';
import type { CauHinhBoLuat } from '../../src/domain/luat/index.js';
import { chayKichBan, taoTran, type Tran } from './kichBan.js';

// Ván 8 người, hai Sói: s1, s2, bv (Bảo vệ), tt (Tiên tri), pt (Phù thủy), A, B, C (Dân làng).
const VAI: Record<string, () => VaiTro> = {
  s1: () => new Soi(),
  s2: () => new Soi(),
  bv: () => new BaoVe(),
  tt: () => new TienTri(),
  pt: () => new PhuThuy(),
  A: () => new DanLang(),
  B: () => new DanLang(),
  C: () => new DanLang(),
};
const LUOT_BAO_VE = 25_000;
const LUOT_SOI = 45_000;

const yDinhCan = (tran: Tran) =>
  tran.van
    .layLuotHienTai()
    .layYDinh()
    .filter((h) => h.loaiHanhDong === LoaiHanhDong.CAN);

/** Thời điểm Tiên tri được mời — tức lúc lượt Sói vừa kết thúc. */
const lucMoiTienTri = (thuTuMoi: { id: string; luc: number }[]) =>
  thuTuMoi.find((m) => m.id === 'tt')!.luc;

describe('BoDieuPhoiVan — lượt tập thể của Sói (2.2b)', () => {
  it('chỉ Sói là vai hành động tập thể', () => {
    expect(new Soi().laHanhDongTapThe()).toBe(true);
    for (const vai of [new BaoVe(), new TienTri(), new PhuThuy(), new DanLang()]) {
      expect(vai.laHanhDongTapThe()).toBe(false);
    }
  });

  it('hai Sói cùng chọn A: chốt ngay, không chờ hết 45 giây, chỉ một ý định cắn', async () => {
    const tran = taoTran(VAI);
    const { thuTuMoi } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      s1: { mucTieuId: 'A' },
      s2: { mucTieuId: 'A' },
    });
    expect(lucMoiTienTri(thuTuMoi)).toBeLessThan(LUOT_BAO_VE + 5_000);
    expect(yDinhCan(tran).map((h) => h.mucTieuId)).toEqual(['A']);
    expect(tran.van.layNguoiChoi('A').conSong).toBe(false);
  });

  it('Sói đổi ý trong lượt: s1 đề xuất A rồi đổi sang B, s2 chọn B — chốt B', async () => {
    const tran = taoTran(VAI);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      s1: [{ mucTieuId: 'A' }, { mucTieuId: 'B' }],
      s2: { mucTieuId: 'B' },
    });
    expect(yDinhCan(tran).map((h) => h.mucTieuId)).toEqual(['B']);
  });

  it('TC12 — hết giờ mà Sói chưa thống nhất: chọn ngẫu nhiên trong các mục tiêu đã đề xuất', async () => {
    const daChon = new Set<string>();
    for (let hat = 1; hat <= 12; hat++) {
      const tran = taoTran(VAI, {}, hat);
      const { thuTuMoi } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
        s1: { mucTieuId: 'A' },
        s2: { mucTieuId: 'B' },
      });
      expect(lucMoiTienTri(thuTuMoi)).toBeGreaterThanOrEqual(LUOT_BAO_VE + LUOT_SOI);
      const can = yDinhCan(tran);
      expect(can).toHaveLength(1);
      expect(['A', 'B']).toContain(can[0]!.mucTieuId);
      daChon.add(can[0]!.mucTieuId);
    }
    expect(daChon).toEqual(new Set(['A', 'B'])); // cả hai đều có thể bị chọn
  });

  it('TC12 — cùng hạt giống cho cùng mục tiêu (PC03)', async () => {
    const chon = async () => {
      const tran = taoTran(VAI, {}, 7);
      await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
        s1: { mucTieuId: 'A' },
        s2: { mucTieuId: 'B' },
      });
      return yDinhCan(tran)[0]!.mucTieuId;
    };
    expect(await chon()).toBe(await chon());
  });

  it('một Sói đề xuất, Sói kia im lặng: hết giờ chọn mục tiêu duy nhất đã đề xuất', async () => {
    const tran = taoTran(VAI);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), { s1: { mucTieuId: 'C' } });
    expect(yDinhCan(tran).map((h) => h.mucTieuId)).toEqual(['C']);
  });

  it('Q07 — không Sói nào đề xuất: đêm đó không ai bị cắn', async () => {
    const tran = taoTran(VAI);
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem());
    expect(yDinhCan(tran)).toEqual([]);
    expect(ketQua.coNguoiChet()).toBe(false);
  });

  it('Sói chỉ cắn người không phải Sói — đề xuất cắn đồng đội bị từ chối (Q13)', async () => {
    const tran = taoTran(VAI);
    const { loiGhiNhan } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      s1: { mucTieuId: 's2' },
    });
    expect(loiGhiNhan).toContainEqual({ id: 's1', ma: 'MUC_TIEU_KHONG_HOP_LE' });
    expect(yDinhCan(tran)).toEqual([]);
  });
});

describe('BoDieuPhoiVan — báo trước cho Phù thủy (BR07)', () => {
  it('Bảo vệ đỡ đúng người bị cắn: Phù thủy được báo mục tiêu an toàn, cứu không mất lọ', async () => {
    const tran = taoTran(VAI);
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      bv: { mucTieuId: 'A' },
      s1: { mucTieuId: 'A' },
      s2: { mucTieuId: 'A' },
      pt: { mucTieuId: 'A', loai: LoaiHanhDong.CUU },
    });
    expect(tran.dieuPhoi.layThongTinNanNhan()).toEqual({ nanNhanId: 'A', anToan: true });
    expect(ketQua.coNguoiChet()).toBe(false);
    expect((tran.van.layNguoiChoi('pt').vaiTro as PhuThuy).layConThuocCuu()).toBe(true);
  });

  it('không được đỡ: Phù thủy được báo nạn nhân, không an toàn', async () => {
    const tran = taoTran(VAI);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      bv: { mucTieuId: 'B' },
      s1: { mucTieuId: 'A' },
      s2: { mucTieuId: 'A' },
    });
    expect(tran.dieuPhoi.layThongTinNanNhan()).toEqual({ nanNhanId: 'A', anToan: false });
  });
});

describe('BoDieuPhoiVan — đêm đầu theo BR03 (Q01)', () => {
  const TAT_BR03: Partial<CauHinhBoLuat> = { batDemDauCoChet: false };

  /** Đưa ván từ GIAI_QUYET_DEM qua một ngày không ai bị treo sang đêm kế tiếp. */
  const quaNgay = (tran: Tran) => {
    for (const suKien of [
      'chuaKetThuc',
      'congBoXong',
      'hetGioThaoLuan',
      'ketThucBoPhieu',
      'chuaKetThuc',
    ] as const) {
      tran.van.chuyenPha(suKien);
    }
  };

  it('tắt BR03: đêm 1 không gọi Sói, Phù thủy không được độc — không ai chết', async () => {
    const tran = taoTran(VAI, TAT_BR03);
    expect(tran.dieuPhoi.layThuTuBuocDem()).toContain(LoaiVai.Soi);
    const { ketQua, thuTuMoi, loiGhiNhan } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      s1: { mucTieuId: 'A' },
      s2: { mucTieuId: 'A' },
      pt: { mucTieuId: 'B', loai: LoaiHanhDong.DOC },
    });
    expect(thuTuMoi.map((m) => m.id)).toEqual(['bv', 'tt', 'pt']);
    expect(loiGhiNhan).toEqual([{ id: 'pt', ma: 'VI_PHAM_RANG_BUOC' }]);
    expect(ketQua.coNguoiChet()).toBe(false);
  });

  it('tắt BR03: từ đêm 2 Sói cắn và Phù thủy độc bình thường', async () => {
    const tran = taoTran(VAI, TAT_BR03);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem());
    quaNgay(tran);
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      s1: { mucTieuId: 'A' },
      s2: { mucTieuId: 'A' },
      pt: { mucTieuId: 'B', loai: LoaiHanhDong.DOC },
    });
    expect(ketQua.layDanhSachChet().map((c) => c.nguoiChoiId)).toEqual(['A', 'B']);
  });

  it('BR03 bật (mặc định): đêm 1 Sói cắn bình thường', async () => {
    const tran = taoTran(VAI);
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      s1: { mucTieuId: 'C' },
      s2: { mucTieuId: 'C' },
    });
    expect(ketQua.layDanhSachChet().map((c) => c.nguoiChoiId)).toEqual(['C']);
  });
});
