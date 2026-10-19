import { describe, expect, it } from 'vitest';
import { BoQuanLyKenh, DO_DAI_TIN_NHAN_TOI_DA } from '../../src/application/BoQuanLyKenh.js';
import { LoiNghiepVu } from '../../src/domain/chung/index.js';
import { LoaiKenh } from '../../src/domain/kenh/index.js';
import { BaoVe, DanLang, Soi, type VaiTro } from '../../src/domain/vaitro/index.js';
import { NguyenNhanChet } from '../../src/domain/van/index.js';
import { taoTran, xaHangDoi } from './kichBan.js';

const K = LoaiKenh;

// Ván 7 người: s1, s2 (Sói), bv (Bảo vệ), A, B, C, D (Dân làng). Ván bắt đầu ở PHA_DEM.
const VAI: Record<string, () => VaiTro> = {
  s1: () => new Soi(),
  s2: () => new Soi(),
  bv: () => new BaoVe(),
  A: () => new DanLang(),
  B: () => new DanLang(),
  C: () => new DanLang(),
  D: () => new DanLang(),
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

/** Ván đặt ở pha thảo luận, A đã chết; quản lý kênh với cờ lượt Sói điều khiển tay. */
function taoBanNgay() {
  const tran = taoTran(VAI);
  const { van } = tran;
  let luotSoi = false;
  const kenh = new BoQuanLyKenh(van, () => luotSoi);
  return {
    van,
    kenh,
    datLuotSoi: (v: boolean) => (luotSoi = v),
    sangNgay: () => {
      van.taoLuotMoi();
      van.danhDauChet([{ nguoiChoiId: 'A', nguyenNhan: NguyenNhanChet.BI_CAN }]);
      for (const s of ['ketThucDem', 'chuaKetThuc', 'congBoXong'] as const) van.chuyenPha(s);
    },
  };
}

describe('BoQuanLyKenh — kênh nào mở', () => {
  it('pha đêm ngoài lượt Sói: chỉ kênh người chết; trong lượt Sói: thêm kênh Sói', () => {
    const { kenh, datLuotSoi } = taoBanNgay();
    expect(kenh.kenhDangMo()).toEqual([K.NGUOI_CHET]);
    datLuotSoi(true);
    expect(kenh.kenhDangMo()).toEqual([K.SOI, K.NGUOI_CHET]);
  });

  it('pha thảo luận: kênh chung và kênh người chết (Q10)', () => {
    const ban = taoBanNgay();
    ban.sangNgay();
    expect(ban.kenh.kenhDangMo()).toEqual([K.CHUNG, K.NGUOI_CHET]);
  });
});

describe('BoQuanLyKenh — ai xem được', () => {
  it('kênh Sói chỉ Sói còn sống; Sói chết rời kênh Sói, vào kênh người chết (BR14)', () => {
    const { van, kenh } = taoBanNgay();
    expect(kenh.layNguoiXem(K.SOI)).toEqual(['s1', 's2']);
    van.taoLuotMoi();
    van.danhDauChet([{ nguoiChoiId: 's2', nguyenNhan: NguyenNhanChet.BI_DOC }]);
    expect(kenh.layNguoiXem(K.SOI)).toEqual(['s1']);
    expect(kenh.layNguoiXem(K.NGUOI_CHET)).toEqual(['s2']);
    expect(kenh.cacKenhXemDuoc('s2')).toEqual([K.CHUNG, K.NGUOI_CHET]);
  });

  it('kênh chung: mọi người trong ván, kể cả người đã chết', () => {
    const ban = taoBanNgay();
    ban.sangNgay();
    expect(ban.kenh.layNguoiXem(K.CHUNG)).toHaveLength(7);
    expect(ban.kenh.cacKenhXemDuoc('B')).toEqual([K.CHUNG]);
  });
});

describe('BoQuanLyKenh — gửi và đọc tin nhắn (UC18)', () => {
  it('ban ngày: người sống gửi kênh chung được; người chết thì không, nhưng gửi kênh người chết được', () => {
    const ban = taoBanNgay();
    ban.sangNgay();
    const tin = ban.kenh.guiTinNhan('B', K.CHUNG, '  Tôi nghi s1  ', 1_000);
    expect(tin).toMatchObject({ thuTu: 1, kenh: K.CHUNG, nguoiGuiId: 'B', noiDung: 'Tôi nghi s1' });
    expect(Object.isFrozen(tin)).toBe(true);
    expect(batLoi(() => ban.kenh.guiTinNhan('A', K.CHUNG, 'tôi bị oan', 1_001)).ma).toBe(
      'KHONG_DUOC_GUI',
    );
    expect(ban.kenh.guiTinNhan('A', K.NGUOI_CHET, 'chào hội người chết', 1_002).thuTu).toBe(2);
  });

  it('ban đêm: kênh chung đóng; kênh Sói chỉ mở trong lượt Sói và chỉ cho Sói', () => {
    const { kenh, datLuotSoi } = taoBanNgay();
    expect(batLoi(() => kenh.guiTinNhan('B', K.CHUNG, 'alo', 1)).ma).toBe('KHONG_DUOC_GUI');
    expect(batLoi(() => kenh.guiTinNhan('s1', K.SOI, 'cắn B nhé', 1)).ma).toBe('KHONG_DUOC_GUI');
    datLuotSoi(true);
    expect(kenh.guiTinNhan('s1', K.SOI, 'cắn B nhé', 2).kenh).toBe(K.SOI);
    expect(batLoi(() => kenh.guiTinNhan('bv', K.SOI, 'tôi nghe lén', 3)).ma).toBe('KHONG_DUOC_GUI');
  });

  it('lịch sử kênh lọc theo quyền xem: Dân không đọc được kênh Sói, người sống không đọc kênh người chết', () => {
    const { kenh, datLuotSoi } = taoBanNgay();
    datLuotSoi(true);
    kenh.guiTinNhan('s1', K.SOI, 'cắn B', 1);
    kenh.guiTinNhan('s2', K.SOI, 'đồng ý', 2);
    expect(kenh.layTinNhan(K.SOI, 's2').map((t) => t.noiDung)).toEqual(['cắn B', 'đồng ý']);
    expect(batLoi(() => kenh.layTinNhan(K.SOI, 'B')).ma).toBe('KHONG_DUOC_XEM');
    expect(batLoi(() => kenh.layTinNhan(K.NGUOI_CHET, 'B')).ma).toBe('KHONG_DUOC_XEM');
    expect(kenh.layTinNhan(K.CHUNG, 'B')).toEqual([]);
  });

  it('nội dung rỗng hoặc quá dài bị từ chối, không ghi gì', () => {
    const ban = taoBanNgay();
    ban.sangNgay();
    expect(batLoi(() => ban.kenh.guiTinNhan('B', K.CHUNG, '   ', 1)).ma).toBe(
      'TIN_NHAN_KHONG_HOP_LE',
    );
    const dai = 'a'.repeat(DO_DAI_TIN_NHAN_TOI_DA + 1);
    expect(batLoi(() => ban.kenh.guiTinNhan('B', K.CHUNG, dai, 1)).ma).toBe(
      'TIN_NHAN_KHONG_HOP_LE',
    );
    expect(ban.kenh.guiTinNhan('B', K.CHUNG, 'a'.repeat(DO_DAI_TIN_NHAN_TOI_DA), 1).thuTu).toBe(1);
  });
});

describe('BoQuanLyKenh gắn với BoDieuPhoiVan', () => {
  it('kênh Sói mở đúng trong lượt Sói của pha đêm thật, đóng khi sang lượt khác', async () => {
    const tran = taoTran(VAI);
    const { dieuPhoi, cong } = tran;
    const dem = dieuPhoi.xuLyPhaDem();
    await xaHangDoi();
    expect(dieuPhoi.dangLuotTapThe()).toBe(false); // lượt Bảo vệ
    expect(dieuPhoi.quanLyKenh.kenhDangMo()).not.toContain(K.SOI);

    cong.ghiNhan('bv', { mucTieuId: 'A' });
    await xaHangDoi();
    expect(dieuPhoi.dangLuotTapThe()).toBe(true); // lượt Sói
    expect(dieuPhoi.quanLyKenh.coTheGui('s1', K.SOI)).toBe(true);
    dieuPhoi.quanLyKenh.guiTinNhan('s1', K.SOI, 'cắn B', tran.dongHo.bayGio());

    cong.ghiNhan('s1', { mucTieuId: 'B' });
    cong.ghiNhan('s2', { mucTieuId: 'B' });
    await dem;
    expect(dieuPhoi.dangLuotTapThe()).toBe(false);
    expect(dieuPhoi.quanLyKenh.coTheGui('s1', K.SOI)).toBe(false);
  });
});
