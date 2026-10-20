// Kiểm thử hệ thống không giao diện (hạng mục 2.10) — ST01, ST02, ST04 và tiêu chí 1 000 ván.
// ST03 (mất kết nối) và ST05 (công cụ phát triển) cần máy chủ thời gian thực — Giai đoạn 4.
import { describe, expect, it } from 'vitest';
import type { BoDieuPhoiVan } from '../../src/application/BoDieuPhoiVan.js';
import type { SuKienMien } from '../../src/application/BoPhatSuKien.js';
import { taoGocNhin } from '../../src/application/taoGocNhin.js';
import { LoaiVai, Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import type { CauHinhBoLuat } from '../../src/domain/luat/index.js';
import { DanLang, Soi, ThoSan, type VaiTro } from '../../src/domain/vaitro/index.js';
import { NguyenNhanChet, type SuKien } from '../../src/domain/van/index.js';
import { moPhongMotVan, type KetQuaMoPhong } from '../../src/infrastructure/bot/moPhong.js';
import { chayKichBan, taoTran, type TraLoi } from '../application/kichBan.js';

const T = TrangThaiVan;

/** Công thức mục 16.4 tài liệu gốc — viết lại độc lập với `BoKiemTraThangThua` để đối chiếu. */
function pheThangTheoCongThuc(
  vai: Readonly<Record<string, string>>,
  conSong: readonly string[],
): Phe | null {
  const S = conSong.filter((id) => vai[id] === LoaiVai.Soi).length;
  const D = conSong.length - S;
  if (S === 0) return Phe.DAN; // BR02
  if (S >= D) return Phe.SOI; // BR01
  return null;
}

/** Dựng lại trạng thái cuối **chỉ từ nhật ký**: bảng vai ở CHIA_VAI trừ những người có NGUOI_CHET. */
function dungLaiTuNhatKy(nhatKy: readonly SuKien[]) {
  const vai = nhatKy[0]!.duLieu.vai as Record<string, string>;
  const chet = nhatKy.filter((s) => s.loai === 'NGUOI_CHET').map((s) => s.duLieu.nguoiChoiId);
  return { vai, chet, conSong: Object.keys(vai).filter((id) => !chet.includes(id)) };
}

/**
 * Ván kết thúc **đúng lúc**: ở mỗi lần chuyển pha, những người còn sống tính tới đó chưa thỏa
 * BR01/BR02 — nếu đã thỏa thì lẽ ra ván phải dừng trước lần chuyển pha ấy (TC15).
 */
function kiemKetThucDungLuc(nhatKy: readonly SuKien[]) {
  const vai = nhatKy[0]!.duLieu.vai as Record<string, string>;
  const conSong = new Set(Object.keys(vai));
  for (const s of nhatKy) {
    if (s.loai === 'NGUOI_CHET') conSong.delete(s.duLieu.nguoiChoiId as string);
    if (s.loai === 'CHUYEN_PHA') {
      expect(pheThangTheoCongThuc(vai, [...conSong]), `chuyển pha #${s.thuTu}`).toBeNull();
    }
  }
}

/** "Bản ghi đầy đủ" (ST01, ST02) — dùng chung cho mọi ván mô phỏng. */
function kiemBanGhi(kq: KetQuaMoPhong) {
  const { nhatKy } = kq;
  expect(nhatKy[0]!.loai).toBe('CHIA_VAI');
  expect(nhatKy.filter((s) => s.loai === 'KET_THUC')).toHaveLength(1);
  expect(nhatKy.at(-1)).toMatchObject({ loai: 'KET_THUC', duLieu: { pheThang: kq.pheThang } });
  nhatKy.forEach((s, i) => {
    expect(s.thuTu).toBe(nhatKy[0]!.thuTu + i);
    if (i > 0) expect(s.thoiDiem).toBeGreaterThanOrEqual(nhatKy[i - 1]!.thoiDiem);
  });

  // Mỗi người chết đúng một dòng; trạng thái dựng lại từ nhật ký trùng trạng thái cuối của ván.
  const { vai, chet, conSong } = dungLaiTuNhatKy(nhatKy);
  expect(vai).toEqual(kq.vai);
  expect(new Set(chet).size).toBe(chet.length);
  expect([...conSong].sort()).toEqual([...kq.conSong].sort());

  // Mỗi đêm một kết quả đêm; mỗi ngày đã bỏ phiếu một kết quả bỏ phiếu.
  const dem = (loai: SuKien['loai']) => nhatKy.filter((s) => s.loai === loai).length;
  expect(dem('KET_QUA_DEM')).toBe(kq.soLuot);
  kiemKetThucDungLuc(nhatKy);
  expect([kq.soLuot - 1, kq.soLuot]).toContain(dem('KET_QUA_BO_PHIEU'));

  // Người đã chết không bỏ phiếu nữa.
  const daChet = new Set<string>();
  for (const s of nhatKy) {
    if (s.loai === 'NGUOI_CHET') daChet.add(s.duLieu.nguoiChoiId as string);
    if (s.loai === 'PHIEU_BAU') expect(daChet.has(s.duLieu.nguoiBauId as string)).toBe(false);
  }
}

/** Chạy một ván mô phỏng, nghe mọi sự kiện, trả kèm bộ điều phối để dựng góc nhìn sau ván. */
async function moPhongCoQuanSat(soNguoi: number, hatGiong: number) {
  const suKien: SuKienMien[] = [];
  let dieuPhoi: BoDieuPhoiVan | undefined;
  const kq = await moPhongMotVan({
    soNguoi,
    hatGiong,
    quanSat: (d) => {
      dieuPhoi = d;
      d.suKien.dangKy((sk) => suKien.push(sk));
    },
  });
  return { kq, suKien, dieuPhoi: dieuPhoi! };
}

/** "Công bố đúng phe": sự kiện kết thúc và màn kết thúc của **từng** người chơi đều khớp. */
function kiemCongBo(kq: KetQuaMoPhong, suKien: SuKienMien[], dieuPhoi: BoDieuPhoiVan) {
  expect(suKien.filter((s) => s.loai === 'KET_THUC')).toEqual([
    { loai: 'KET_THUC', pheThang: kq.pheThang },
  ]);
  for (const id of Object.keys(kq.vai)) {
    const ketThuc = taoGocNhin(dieuPhoi, id).ketThuc!;
    expect(ketThuc.pheThang).toBe(kq.pheThang);
    expect(Object.fromEntries(ketThuc.vai.map((v) => [v.id, v.loaiVai]))).toEqual(kq.vai);
    expect(ketThuc.nhatKy).toHaveLength(kq.nhatKy.length);
  }
}

describe('ST01 — ván 6 người, phe Dân thắng', () => {
  it('ST01 — hạt giống 1: ván chạy trọn 5 lượt, công bố đúng phe Dân, bản ghi đầy đủ', async () => {
    const { kq, suKien, dieuPhoi } = await moPhongCoQuanSat(6, 1);
    expect(kq.pheThang).toBe(Phe.DAN);
    expect(kq.soLuot).toBe(5);
    expect(pheThangTheoCongThuc(kq.vai, kq.conSong)).toBe(Phe.DAN);
    expect(dieuPhoi.van.trangThai).toBe(T.KET_THUC);
    kiemBanGhi(kq);
    kiemCongBo(kq, suKien, dieuPhoi);
  });
});

describe('ST02 — ván 8 người, phe Sói thắng', () => {
  it('ST02 — hạt giống 1: ván chạy trọn 5 lượt, công bố đúng phe Sói, bản ghi đầy đủ', async () => {
    const { kq, suKien, dieuPhoi } = await moPhongCoQuanSat(8, 1);
    expect(kq.pheThang).toBe(Phe.SOI);
    expect(kq.soLuot).toBe(5);
    expect(pheThangTheoCongThuc(kq.vai, kq.conSong)).toBe(Phe.SOI);
    // Ván này có đủ bốn nguyên nhân chết — bản ghi phải ghi được cả bốn.
    const nguyenNhan = new Set(
      kq.nhatKy.filter((s) => s.loai === 'NGUOI_CHET').map((s) => s.duLieu.nguyenNhan),
    );
    expect(nguyenNhan).toEqual(
      new Set([
        NguyenNhanChet.BI_CAN,
        NguyenNhanChet.BI_DOC,
        NguyenNhanChet.BI_TREO_CO,
        NguyenNhanChet.BI_BAN,
      ]),
    );
    kiemBanGhi(kq);
    kiemCongBo(kq, suKien, dieuPhoi);
  });
});

// ST04 — ván 8 người: s1, s2 (Sói), ts1, ts2 (Thợ săn — Q06 cho tối đa 2), A, B, C, D (Dân làng).
const VAI_ST04: Record<string, () => VaiTro> = {
  s1: () => new Soi(),
  s2: () => new Soi(),
  ts1: () => new ThoSan(),
  ts2: () => new ThoSan(),
  A: () => new DanLang(),
  B: () => new DanLang(),
  C: () => new DanLang(),
  D: () => new DanLang(),
};
type NgCanh = { lan: number; trangThai: TrangThaiVan };
const chon = (mucTieuId: string) => ({ mucTieuId });

/** Dựng ván ST04, nghe sự kiện; mỗi lần có công bố thì chụp góc nhìn của `nguoiXem`. */
function taoTranST04(nguoiXem: string) {
  const tran = taoTran(VAI_ST04);
  const suKien: SuKienMien[] = [];
  const gocNhin: ReturnType<typeof taoGocNhin>[] = [];
  tran.dieuPhoi.suKien.dangKy((sk) => {
    suKien.push(sk);
    if (sk.loai === 'CONG_BO_SANG' || sk.loai === 'KET_QUA_NGAY') {
      gocNhin.push(taoGocNhin(tran.dieuPhoi, nguoiXem));
    }
  });
  return { tran, suKien, gocNhin };
}

const nguoiChetTrongNhatKy = (nhatKy: readonly SuKien[]) =>
  nhatKy
    .filter((s) => s.loai === 'NGUOI_CHET')
    .map((s) => ({
      id: s.duLieu.nguoiChoiId,
      nguyenNhan: s.duLieu.nguyenNhan,
      ...(s.duLieu.nguoiBanId ? { boi: s.duLieu.nguoiBanId } : {}),
    }));

describe('ST04 — phản ứng dây chuyền Thợ săn', () => {
  it('ST04 — ban đêm: Sói cắn ts1, ts1 bắn ts2, ts2 bắn s1 — 3 người chết, công bố sáng đúng thứ tự', async () => {
    const { tran, suKien, gocNhin } = taoTranST04('A');
    const ngay = (dem: unknown, boPhieu: unknown) => (c: NgCanh) =>
      c.trangThai === T.PHA_DEM ? dem : boPhieu;
    const kichBan: Record<string, TraLoi> = {
      s1: ngay(chon('ts1'), chon('A')),
      s2: ngay(chon('ts1'), chon('A')),
      ts1: chon('ts2'), // chỉ được mời khi chết — bắn ts2
      ts2: chon('s1'),
      A: ngay(undefined, chon('s2')),
      B: ngay(undefined, chon('s2')),
      C: ngay(undefined, chon('s2')),
      D: ngay(undefined, chon('s2')),
    };
    const { ketQua, thuTuMoi } = await chayKichBan(tran, tran.dieuPhoi.chayVan(), kichBan);

    // Số người chết đúng: 3 trong đêm, rồi s2 bị treo — hết Sói, Dân thắng ngay lượt 1.
    expect(ketQua).toBe(Phe.DAN);
    expect(tran.van.luotHienTai).toBe(1);
    expect(nguoiChetTrongNhatKy(tran.van.nhatKy.xuatBanCongKhai())).toEqual([
      { id: 'ts1', nguyenNhan: NguyenNhanChet.BI_CAN },
      { id: 'ts2', nguyenNhan: NguyenNhanChet.BI_BAN, boi: 'ts1' },
      { id: 's1', nguyenNhan: NguyenNhanChet.BI_BAN, boi: 'ts2' },
      { id: 's2', nguyenNhan: NguyenNhanChet.BI_TREO_CO },
    ]);
    // Thợ săn được mời đúng theo dây chuyền: ts1 trước, ts2 sau, đều sau lượt Sói.
    const moiDem = thuTuMoi.map((m) => m.id).slice(0, 4);
    expect(moiDem).toEqual(['s1', 's2', 'ts1', 'ts2']);

    // Thứ tự công bố đúng — cả sự kiện phát cho mọi người lẫn góc nhìn của một Dân làng.
    expect(suKien.filter((s) => s.loai === 'CONG_BO_SANG')).toEqual([
      { loai: 'CONG_BO_SANG', nguoiChet: ['ts1', 'ts2', 's1'] },
    ]);
    expect(gocNhin[0]!.congBoSang).toEqual(['ts1', 'ts2', 's1']);
    expect(gocNhin[0]!.trangThai).toBe(T.PHA_CONG_BO);
  });

  it('ST04 — ban ngày: treo ts1, ts1 bắn ts2, ts2 bắn s1 — người bị treo công bố trước, rồi tới người bị bắn theo thứ tự', async () => {
    const { tran, suKien, gocNhin } = taoTranST04('B');
    const luot = () => tran.van.luotHienTai;
    // Đêm 1 cắn A, đêm 2 cắn B. Ngày 1 cả làng treo ts1, ngày 2 treo s2.
    const lang = (c: NgCanh) =>
      c.trangThai === T.PHA_DEM ? undefined : chon(luot() === 1 ? 'ts1' : 's2');
    const kichBan: Record<string, TraLoi> = {
      s1: (c: NgCanh) => (c.trangThai === T.PHA_DEM ? chon('A') : chon('ts1')),
      s2: (c: NgCanh) =>
        c.trangThai === T.PHA_DEM
          ? chon(luot() === 1 ? 'A' : 'B')
          : chon(luot() === 1 ? 'ts1' : 'C'),
      ts1: (c: NgCanh) => (c.trangThai === T.GIAI_QUYET_PHIEU ? chon('ts2') : lang(c)),
      ts2: (c: NgCanh) => (c.trangThai === T.GIAI_QUYET_PHIEU ? chon('s1') : lang(c)),
      A: lang,
      B: lang,
      C: lang,
      D: lang,
    };
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.chayVan(), kichBan);

    expect(ketQua).toBe(Phe.DAN);
    expect(tran.van.luotHienTai).toBe(2);
    expect(nguoiChetTrongNhatKy(tran.van.nhatKy.xuatBanCongKhai())).toEqual([
      { id: 'A', nguyenNhan: NguyenNhanChet.BI_CAN },
      { id: 'ts1', nguyenNhan: NguyenNhanChet.BI_TREO_CO },
      { id: 'ts2', nguyenNhan: NguyenNhanChet.BI_BAN, boi: 'ts1' },
      { id: 's1', nguyenNhan: NguyenNhanChet.BI_BAN, boi: 'ts2' },
      { id: 'B', nguyenNhan: NguyenNhanChet.BI_CAN },
      { id: 's2', nguyenNhan: NguyenNhanChet.BI_TREO_CO },
    ]);

    // Sau ngày 1 còn s2, B, C, D: S = 1 < D = 3 nên ván đi tiếp — dây chuyền không kết thúc sớm.
    const ketQuaNgay = suKien.filter((s) => s.loai === 'KET_QUA_NGAY');
    expect(ketQuaNgay).toHaveLength(2);
    expect(ketQuaNgay[0]!.ketQua.phatBan.map((p) => [p.nguoiBanId, p.mucTieuId])).toEqual([
      ['ts1', 'ts2'],
      ['ts2', 's1'],
    ]);
    // Góc nhìn công khai của ngày 1: ai bị treo, ai chết thêm theo thứ tự — không lộ ai bắn (Q09).
    const ngay1 = gocNhin.find((g) => g.ketQuaNgay && g.luot === 1)!;
    expect(ngay1.ketQuaNgay).toEqual({
      nguoiBiTreoId: 'ts1',
      coBauLai: false,
      nguoiChetThem: ['ts2', 's1'],
    });
    expect(JSON.stringify(ngay1.ketQuaNgay)).not.toContain('nguoiBanId');
  });
});

describe('Tiêu chí hoàn thành Giai đoạn 2', () => {
  /** Hạt giống quyết định cả bộ luật: mỗi bit bật hoặc tắt một quy tắc tùy biến. */
  const luatTheoHat = (hat: number): Partial<CauHinhBoLuat> => {
    const bit = (i: number) => ((hat * 2_654_435_761) >>> (i + 7)) % 2 === 0;
    return {
      batDemDauCoChet: bit(0),
      camPhuThuyTuCuu: bit(1),
      choBaoVeTuDo: bit(2),
      camDoTrungDem: bit(3),
      thoSanBanKhiTreoCo: bit(4),
      hoaPhieuKhongAiChet: bit(5),
    };
  };

  it('1 000 ván ngẫu nhiên 6–12 người, bộ luật thay đổi theo ván: đều kết thúc đúng lúc, không ném lỗi, phe thắng khớp BR01/BR02', async () => {
    const theoSoNguoi = new Map<number, number>();
    for (let hat = 1; hat <= 1_000; hat++) {
      const soNguoi = 6 + (hat % 7);
      const kq = await moPhongMotVan({ soNguoi, hatGiong: hat, luat: luatTheoHat(hat) });
      // Trạng thái cuối — cả của ván lẫn dựng lại từ nhật ký — cho đúng phe đã công bố.
      expect(pheThangTheoCongThuc(kq.vai, kq.conSong), `hạt giống ${hat}`).toBe(kq.pheThang);
      const { vai, conSong } = dungLaiTuNhatKy(kq.nhatKy);
      expect(pheThangTheoCongThuc(vai, conSong), `hạt giống ${hat}`).toBe(kq.pheThang);
      kiemKetThucDungLuc(kq.nhatKy);
      theoSoNguoi.set(soNguoi, (theoSoNguoi.get(soNguoi) ?? 0) + 1);
    }
    expect([...theoSoNguoi.keys()].sort((a, b) => a - b)).toEqual([6, 7, 8, 9, 10, 11, 12]);
  }, 60_000);
});
