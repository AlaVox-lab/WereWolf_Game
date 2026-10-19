import { describe, expect, it } from 'vitest';
import { docPhieu } from '../../src/application/BoDieuPhoiVan.js';
import { LoiNghiepVu, Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import type { CauHinhBoLuat } from '../../src/domain/luat/index.js';
import { DanLang, Soi, ThoSan, type VaiTro } from '../../src/domain/vaitro/index.js';
import { NguyenNhanChet } from '../../src/domain/van/index.js';
import { chayKichBan, taoTran, type TraLoi, type Tran } from './kichBan.js';

const T = TrangThaiVan;

// Ván 6 người: s (Sói), ts (Thợ săn), A, B, C, D (Dân làng).
const VAI: Record<string, () => VaiTro> = {
  s: () => new Soi(),
  ts: () => new ThoSan(),
  A: () => new DanLang(),
  B: () => new DanLang(),
  C: () => new DanLang(),
  D: () => new DanLang(),
};

const bau = (mucTieuId: string | null) => ({ mucTieuId });
/** Đêm thì trả `dem`, ngày (bỏ phiếu, Thợ săn bắn) thì trả `ngay`. */
const demNgay =
  (dem: TraLoi, ngay: TraLoi) =>
  ({ trangThai }: { trangThai: TrangThaiVan }) =>
    trangThai === T.PHA_DEM ? dem : ngay;

/** Chạy một đêm rồi kiểm tra lần thứ nhất; nếu chưa kết thúc thì chạy cả ngày. */
async function demRoiNgay(tran: Tran, kichBan: Record<string, TraLoi>) {
  const ketQua = await chayKichBan(
    tran,
    (async () => {
      await tran.dieuPhoi.xuLyPhaDem();
      if (tran.dieuPhoi.sauDem()) return null;
      return tran.dieuPhoi.xuLyPhaNgay();
    })(),
    kichBan,
  );
  return { ...ketQua, ketQuaNgay: ketQua.ketQua };
}

const conSong = (tran: Tran) =>
  tran.van
    .layNguoiConSong()
    .map((n) => n.id)
    .sort();

describe('BoDieuPhoiVan — kiểm tra thắng thua sau đêm (UC14 bước 6)', () => {
  it('TC15 — Sói cắn khiến số Sói bằng số Dân: kết thúc ngay khi trời sáng, không mở pha thảo luận', async () => {
    const tran = taoTran(VAI);
    tran.van.danhDauChet(
      ['B', 'C', 'D'].map((id) => ({ nguoiChoiId: id, nguyenNhan: NguyenNhanChet.BI_TREO_CO })),
    );
    // Còn s, ts, A: S = 1, D = 2. Sói cắn A → S = 1, D = 1.
    const { ketQuaNgay } = await demRoiNgay(tran, { s: bau('A') });
    expect(ketQuaNgay).toBeNull();
    expect(tran.van.trangThai).toBe(T.KET_THUC);
    expect(tran.van.pheThang).toBe(Phe.SOI);
    expect(tran.dieuPhoi.layCongBoSang()).toEqual([]);
    expect(tran.van.nhatKy.dangMo()).toBe(false);
  });

  it('chưa ai thắng: công bố người chết **không kèm nguyên nhân**, sang pha công bố', async () => {
    const tran = taoTran(VAI);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), { s: bau('A') });
    expect(tran.dieuPhoi.sauDem()).toBe(false);
    expect(tran.van.trangThai).toBe(T.PHA_CONG_BO);
    expect(tran.dieuPhoi.layCongBoSang()).toEqual(['A']);
  });

  it('sauDem chỉ gọi được ở GIAI_QUYET_DEM', () => {
    expect(() => taoTran(VAI).dieuPhoi.sauDem()).toThrow('CHUYEN_TRANG_THAI_KHONG_HOP_LE');
  });
});

describe('BoDieuPhoiVan — pha ngày (2.3)', () => {
  it('đủ các bước: công bố 6 giây, thảo luận 120 giây, bỏ phiếu, treo cổ, sang đêm lượt 2', async () => {
    const tran = taoTran(VAI);
    const { ketQuaNgay, thuTuMoi } = await demRoiNgay(tran, {
      s: demNgay(bau('A'), bau('C')),
      ts: bau('C'),
      B: bau('C'),
      C: bau('B'),
      D: bau('C'),
    });
    expect(ketQuaNgay?.ketQuaPhien).toEqual({ loai: 'TREO_CO', nguoiBiTreoId: 'C' });
    expect(tran.van.layNguoiChoi('C').nguyenNhanChet).toBe(NguyenNhanChet.BI_TREO_CO);
    expect(conSong(tran)).toEqual(['B', 'D', 's', 'ts']);
    expect(tran.van.trangThai).toBe(T.PHA_DEM);
    // Người chết đêm qua (A) không được mời bỏ phiếu; phiếu mở sau công bố + thảo luận.
    const moiBauDauTien = thuTuMoi.find((m) => m.id === 'ts')!.luc;
    const sauDem = thuTuMoi.find((m) => m.id === 's')!.luc;
    expect(moiBauDauTien - sauDem).toBeGreaterThanOrEqual(6_000 + 120_000);
    expect(thuTuMoi.some((m) => m.id === 'A')).toBe(false);
  });

  it('TC14 — Sói cuối cùng bị treo cổ: phe Dân thắng ngay sau bỏ phiếu', async () => {
    const tran = taoTran(VAI);
    await demRoiNgay(tran, {
      s: demNgay(bau('A'), bau('B')),
      ts: bau('s'),
      B: bau('s'),
      C: bau('s'),
      D: bau('s'),
    });
    expect(tran.van.trangThai).toBe(T.KET_THUC);
    expect(tran.van.pheThang).toBe(Phe.DAN);
  });

  it('TC11 — hòa phiếu khi BR11 bật: không ai bị treo cổ', async () => {
    const tran = taoTran(VAI);
    const { ketQuaNgay } = await demRoiNgay(tran, {
      s: demNgay(bau('A'), bau('B')),
      ts: bau('B'),
      B: bau('C'),
      C: bau('C'),
      D: bau(null),
    });
    expect(ketQuaNgay?.ketQuaPhien).toEqual({ loai: 'KHONG_AI' });
    expect(conSong(tran)).toEqual(['B', 'C', 'D', 's', 'ts']);
    expect(tran.van.trangThai).toBe(T.PHA_DEM);
  });

  it('TC19 — tắt BR11: hòa thì bầu lại giữa người hòa, vòng lại treo được người', async () => {
    const tatBR11: Partial<CauHinhBoLuat> = { hoaPhieuKhongAiChet: false };
    const tran = taoTran(VAI, tatBR11);
    const { ketQuaNgay } = await demRoiNgay(tran, {
      // Sói không cắn để còn đủ 6 cử tri; lần mời 0 của Sói là lượt đêm.
      s: [undefined, bau('B'), bau('C')],
      ts: [bau('B'), bau('C')],
      A: [bau('C'), bau('C')],
      B: [bau('C'), bau('C')],
      C: [bau(null), bau('B')],
      D: [bau(null), bau('C')],
    });
    expect(ketQuaNgay?.ketQuaPhien).toEqual({ loai: 'TREO_CO', nguoiBiTreoId: 'C' });
    const phien = tran.van.layLuotHienTai().layDanhSachPhienBauCu();
    expect(phien.map((p) => p.laVongBauLai)).toEqual([false, true]);
    expect(phien[1]!.layDanhSachUngVien()).toEqual(['B', 'C']);
  });

  it('TC09 — Thợ săn bị treo cổ bắn Sói: cả hai chết trong cùng lượt, phe Dân thắng', async () => {
    const tran = taoTran(VAI);
    const { ketQuaNgay } = await demRoiNgay(tran, {
      s: demNgay(bau('A'), bau('ts')),
      ts: ({ trangThai }: { trangThai: TrangThaiVan }) =>
        trangThai === T.GIAI_QUYET_PHIEU ? { mucTieuId: 's' } : bau('ts'),
      B: bau('ts'),
      C: bau('ts'),
      D: bau('ts'),
    });
    expect(ketQuaNgay?.phatBan).toEqual([{ nguoiBanId: 'ts', mucTieuId: 's' }]);
    expect(tran.van.layNguoiChoi('s').luotChet).toBe(tran.van.layNguoiChoi('ts').luotChet);
    expect(tran.van.pheThang).toBe(Phe.DAN);
  });

  it('TC18 — tắt BR09: Thợ săn bị treo cổ không được mời bắn', async () => {
    const tran = taoTran(VAI, { thoSanBanKhiTreoCo: false });
    const { ketQuaNgay, thuTuMoi } = await demRoiNgay(tran, {
      s: demNgay(bau('A'), bau('ts')),
      ts: bau('ts'),
      B: bau('ts'),
      C: bau('ts'),
      D: bau('ts'),
    });
    expect(ketQuaNgay?.phatBan).toEqual([]);
    expect(thuTuMoi.filter((m) => m.id === 'ts')).toHaveLength(1); // chỉ lần mời bỏ phiếu
    expect(tran.van.trangThai).toBe(T.PHA_DEM);
  });

  it('phiếu sai bị từ chối; không ai bầu hợp lệ tới hết giờ thì không ai bị treo', async () => {
    const tran = taoTran(VAI);
    const { ketQuaNgay, loiGhiNhan } = await demRoiNgay(tran, {
      s: demNgay(bau('A'), bau('A')), // A đã chết đêm qua
      ts: 'không phải phiếu',
    });
    expect(loiGhiNhan).toEqual([
      { id: 's', ma: 'MUC_TIEU_KHONG_HOP_LE' },
      { id: 'ts', ma: 'LUA_CHON_KHONG_HOP_LE' },
    ]);
    expect(ketQuaNgay?.ketQuaPhien).toEqual({ loai: 'KHONG_AI' });
  });

  it('xuLyPhaNgay chỉ gọi được ở PHA_CONG_BO', async () => {
    await expect(taoTran(VAI).dieuPhoi.xuLyPhaNgay()).rejects.toThrow(
      'CHUYEN_TRANG_THAI_KHONG_HOP_LE',
    );
  });
});

describe('BoDieuPhoiVan.chayVan — trọn một ván', () => {
  it('phe Dân thắng: đêm 1 Sói cắn A, ngày 1 cả làng treo Sói', async () => {
    const tran = taoTran(VAI);
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.chayVan(), {
      s: demNgay(bau('A'), bau('B')),
      ts: bau('s'),
      B: bau('s'),
      C: bau('s'),
      D: bau('s'),
    });
    expect(ketQua).toBe(Phe.DAN);
    expect(tran.van.luotHienTai).toBe(1);
  });

  it('phe Sói thắng: mỗi đêm cắn một Dân, cả làng bỏ trắng — thắng lúc trời sáng đêm 4', async () => {
    const vai: Record<string, () => VaiTro> = {
      s: () => new Soi(),
      A: () => new DanLang(),
      B: () => new DanLang(),
      C: () => new DanLang(),
      D: () => new DanLang(),
      E: () => new DanLang(),
    };
    const tran = taoTran(vai);
    const danConSong = () => tran.van.layNguoiConSong().find((n) => n.id !== 's')!.id;
    const kichBan: Record<string, TraLoi> = {
      s: ({ trangThai }: { trangThai: TrangThaiVan }) =>
        trangThai === T.PHA_DEM ? bau(danConSong()) : bau(null),
    };
    for (const id of ['A', 'B', 'C', 'D', 'E']) kichBan[id] = bau(null);
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.chayVan(), kichBan);
    expect(ketQua).toBe(Phe.SOI);
    expect(tran.van.luotHienTai).toBe(4);
    expect(tran.van.layDanhSachLuot()[3]!.phienBauCu).toBeNull(); // không có ngày 4
  });
});

describe('docPhieu', () => {
  it('nhận mã người chơi hoặc null (bỏ trắng)', () => {
    expect(docPhieu({ mucTieuId: 'a' })).toBe('a');
    expect(docPhieu({ mucTieuId: null })).toBeNull();
  });

  it.each([null, 'a', {}, { mucTieuId: 3 }])('từ chối %o', (tho) => {
    expect(() => docPhieu(tho)).toThrow(LoiNghiepVu);
  });
});
