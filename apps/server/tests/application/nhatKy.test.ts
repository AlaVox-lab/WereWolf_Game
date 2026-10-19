import { describe, expect, it } from 'vitest';
import { taoGocNhin } from '../../src/application/taoGocNhin.js';
import { Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  ThoSan,
  TienTri,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';
import type { SuKien } from '../../src/domain/van/index.js';
import { chayKichBan, taoTran, type TraLoi, type Tran } from './kichBan.js';

const T = TrangThaiVan;

// Ván 8 người: s1, s2 (Sói), bv, tt, pt, ts (Thợ săn), A, B.
const VAI: Record<string, () => VaiTro> = {
  s1: () => new Soi(),
  s2: () => new Soi(),
  bv: () => new BaoVe(),
  tt: () => new TienTri(),
  pt: () => new PhuThuy(),
  ts: () => new ThoSan(),
  A: () => new DanLang(),
  B: () => new DanLang(),
};
type NgCanh = { lan: number; trangThai: TrangThaiVan };

/**
 * Đêm 1: Sói cắn ts (Thợ săn), ts bắn s1; Tiên tri soi s2; Bảo vệ đỡ A.
 * Ngày 1: cả làng treo s2 — hết Sói, phe Dân thắng.
 */
function kichBan(): Record<string, TraLoi> {
  const ngay = ({ trangThai }: NgCanh) =>
    trangThai === T.PHA_DEM ? undefined : { mucTieuId: 's2' };
  const kb: Record<string, TraLoi> = {};
  for (const id of Object.keys(VAI)) kb[id] = ngay;
  kb.s1 = (c: NgCanh) => (c.trangThai === T.PHA_DEM ? { mucTieuId: 'ts' } : ngay(c));
  kb.s2 = (c: NgCanh) => (c.trangThai === T.PHA_DEM ? { mucTieuId: 'ts' } : { mucTieuId: 'A' });
  kb.bv = (c: NgCanh) => (c.trangThai === T.PHA_DEM ? { mucTieuId: 'A' } : ngay(c));
  kb.tt = (c: NgCanh) => (c.trangThai === T.PHA_DEM ? { mucTieuId: 's2' } : ngay(c));
  kb.ts = { mucTieuId: 's1' }; // chỉ được mời khi chết — bắn s1
  return kb;
}

async function chayCaVan(): Promise<{ tran: Tran; nhatKy: readonly SuKien[] }> {
  const tran = taoTran(VAI);
  await chayKichBan(tran, tran.dieuPhoi.chayVan(), kichBan());
  return { tran, nhatKy: tran.van.nhatKy.xuatBanCongKhai() };
}

const theoLoai = (nhatKy: readonly SuKien[], loai: SuKien['loai']) =>
  nhatKy.filter((s) => s.loai === loai);

describe('NhatKyVan được ghi suốt ván (2.7)', () => {
  it('mở đầu bằng CHIA_VAI, kết thúc bằng KET_THUC; số thứ tự liền mạch, thời điểm không lùi', async () => {
    const { tran, nhatKy } = await chayCaVan();
    expect(tran.van.pheThang).toBe(Phe.DAN);
    expect(nhatKy[0]).toMatchObject({
      loai: 'CHIA_VAI',
      duLieu: { vai: { s1: 'Soi', ts: 'ThoSan' } },
    });
    expect(nhatKy.at(-1)).toMatchObject({ loai: 'KET_THUC', duLieu: { pheThang: Phe.DAN } });
    nhatKy.forEach((sk, i) => {
      expect(sk.thuTu).toBe(i + 1);
      if (i > 0) expect(sk.thoiDiem).toBeGreaterThanOrEqual(nhatKy[i - 1]!.thoiDiem);
    });
    expect(tran.van.nhatKy.dangMo()).toBe(false);
  });

  it('mọi lần chuyển pha đều có mặt, đúng thứ tự', async () => {
    const { nhatKy } = await chayCaVan();
    expect(theoLoai(nhatKy, 'CHUYEN_PHA').map((s) => s.duLieu.trangThai)).toEqual([
      T.GIAI_QUYET_DEM,
      T.PHA_CONG_BO,
      T.PHA_THAO_LUAN,
      T.PHA_BO_PHIEU,
      T.GIAI_QUYET_PHIEU,
    ]);
  });

  it('ý định trong nhật ký khớp đúng ý định đã ghi vào lượt — bầy Sói chỉ một ý định cắn', async () => {
    const { tran, nhatKy } = await chayCaVan();
    const yDinhLuot = tran.van
      .layLuotHienTai()
      .layYDinh()
      .map((h) => ({
        nguoiThucHienId: h.nguoiThucHienId,
        loaiHanhDong: h.loaiHanhDong,
        mucTieuId: h.mucTieuId,
      }));
    const yDinhNhatKy = theoLoai(nhatKy, 'Y_DINH').map(({ duLieu: { luot: _l, ...con } }) => con);
    expect(yDinhNhatKy).toEqual(yDinhLuot);
    expect(yDinhNhatKy.filter((y) => y.loaiHanhDong === 'CAN')).toHaveLength(1);
  });

  it('kết quả soi, kết quả đêm, từng phiếu bầu, kết quả bỏ phiếu đều được ghi', async () => {
    const { nhatKy } = await chayCaVan();
    expect(theoLoai(nhatKy, 'KET_QUA_SOI')[0]?.duLieu).toMatchObject({
      tienTriId: 'tt',
      mucTieuId: 's2',
      phe: Phe.SOI,
    });
    expect(theoLoai(nhatKy, 'KET_QUA_DEM')[0]?.duLieu).toMatchObject({
      luot: 1,
      nguoiChet: [
        { nguoiChoiId: 'ts', nguyenNhan: 'BI_CAN' },
        { nguoiChoiId: 's1', nguyenNhan: 'BI_BAN' },
      ],
    });
    const phieu = theoLoai(nhatKy, 'PHIEU_BAU');
    expect(phieu).toHaveLength(6); // ts và s1 đã chết đêm qua
    expect(phieu.find((p) => p.duLieu.nguoiBauId === 's2')?.duLieu.nguoiBiBauId).toBe('A');
    expect(theoLoai(nhatKy, 'KET_QUA_BO_PHIEU')[0]?.duLieu).toMatchObject({
      ketQuaPhien: { loai: 'TREO_CO', nguoiBiTreoId: 's2' },
      coBauLai: false,
    });
  });

  it('mỗi người chết có một dòng NGUOI_CHET kèm nguyên nhân; bị bắn thì ghi cả người bắn', async () => {
    const { nhatKy } = await chayCaVan();
    expect(theoLoai(nhatKy, 'NGUOI_CHET').map((s) => s.duLieu)).toEqual([
      { luot: 1, nguoiChoiId: 'ts', nguyenNhan: 'BI_CAN' },
      { luot: 1, nguoiChoiId: 's1', nguyenNhan: 'BI_BAN', nguoiBanId: 'ts' },
      { luot: 1, nguoiChoiId: 's2', nguyenNhan: 'BI_TREO_CO' },
    ]);
  });

  it('cùng hạt giống và cùng chuỗi lệnh cho cùng một nhật ký (PC03)', async () => {
    const a = (await chayCaVan()).nhatKy;
    const b = (await chayCaVan()).nhatKy;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('chưa hết ván thì không ai đọc được nhật ký; hết ván thì màn kết thúc có nhật ký đầy đủ', async () => {
    const tran = taoTran(VAI);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem());
    expect(() => tran.van.nhatKy.xuatBanCongKhai()).toThrow('NHAT_KY_CHUA_CONG_KHAI');
    expect(taoGocNhin(tran.dieuPhoi, 'A').ketThuc).toBeNull();

    const { tran: daXong, nhatKy } = await chayCaVan();
    const gocNhin = taoGocNhin(daXong.dieuPhoi, 'A');
    expect(gocNhin.ketThuc?.nhatKy).toHaveLength(nhatKy.length);
    expect(gocNhin.ketThuc?.nhatKy.at(-1)?.loai).toBe('KET_THUC');
  });
});
