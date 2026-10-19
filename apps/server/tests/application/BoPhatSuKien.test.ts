import { describe, expect, it, vi } from 'vitest';
import { BoPhatSuKien, type SuKienMien } from '../../src/application/BoPhatSuKien.js';
import { LoaiHanhDong, Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import { LoaiKenh } from '../../src/domain/kenh/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  TienTri,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';
import { chayKichBan, taoTran, xaHangDoi } from './kichBan.js';

const CHUYEN_PHA: SuKienMien = { loai: 'CHUYEN_PHA', trangThai: TrangThaiVan.PHA_DEM, luot: 1 };

describe('BoPhatSuKien — Observer', () => {
  const taoBo = (khiLoi?: (loi: unknown) => void) =>
    new BoPhatSuKien((dt) => {
      if (dt.loai === 'TAT_CA') return ['a', 'b', 'c'];
      if (dt.loai === 'NGUOI_CHOI') return [dt.nguoiChoiId];
      return dt.kenh === LoaiKenh.SOI ? ['a'] : [];
    }, khiLoi);

  it('phát tới mọi người nghe, kèm danh sách người nhận đã dịch', () => {
    const bo = taoBo();
    const nhan: unknown[] = [];
    bo.dangKy((sk, nguoiNhan) => nhan.push([sk.loai, nguoiNhan]));
    bo.phat(CHUYEN_PHA, { loai: 'TAT_CA' });
    bo.phat(CHUYEN_PHA, { loai: 'NGUOI_CHOI', nguoiChoiId: 'b' });
    bo.phat(CHUYEN_PHA, { loai: 'KENH', kenh: LoaiKenh.SOI });
    expect(nhan).toEqual([
      ['CHUYEN_PHA', ['a', 'b', 'c']],
      ['CHUYEN_PHA', ['b']],
      ['CHUYEN_PHA', ['a']],
    ]);
  });

  it('dangKyNguoiChoi chỉ nhận sự kiện có mình trong danh sách người nhận', () => {
    const bo = taoBo();
    const cuaB: SuKienMien[] = [];
    bo.dangKyNguoiChoi('b', (sk) => cuaB.push(sk));
    bo.phat(CHUYEN_PHA, { loai: 'NGUOI_CHOI', nguoiChoiId: 'a' });
    bo.phat(CHUYEN_PHA, { loai: 'KENH', kenh: LoaiKenh.SOI });
    bo.phat(CHUYEN_PHA, { loai: 'TAT_CA' });
    expect(cuaB).toHaveLength(1);
  });

  it('hủy đăng ký thì thôi nhận', () => {
    const bo = taoBo();
    const nghe = vi.fn();
    const huy = bo.dangKy(nghe);
    huy();
    bo.phat(CHUYEN_PHA, { loai: 'TAT_CA' });
    expect(nghe).not.toHaveBeenCalled();
  });

  it('một người nghe ném lỗi không chặn người nghe khác và không làm hỏng việc phát', () => {
    const khiLoi = vi.fn();
    const bo = taoBo(khiLoi);
    const sau = vi.fn();
    bo.dangKy(() => {
      throw new Error('hỏng');
    });
    bo.dangKy(sau);
    expect(() => bo.phat(CHUYEN_PHA, { loai: 'TAT_CA' })).not.toThrow();
    expect(sau).toHaveBeenCalledOnce();
    expect(khiLoi).toHaveBeenCalledOnce();
  });
});

describe('BoDieuPhoiVan phát sự kiện — mỗi người chỉ nhận phần của mình', () => {
  // Ván 7 người: s1, s2 (Sói), bv, tt, pt, A, B.
  const VAI: Record<string, () => VaiTro> = {
    s1: () => new Soi(),
    s2: () => new Soi(),
    bv: () => new BaoVe(),
    tt: () => new TienTri(),
    pt: () => new PhuThuy(),
    A: () => new DanLang(),
    B: () => new DanLang(),
  };

  /** Ghi lại mọi sự kiện mỗi người nhận được. */
  function ngheTheoNguoi(tran: ReturnType<typeof taoTran>) {
    const theoNguoi = new Map<string, SuKienMien[]>();
    for (const n of tran.van.layDanhSachNguoiChoi()) {
      theoNguoi.set(n.id, []);
      tran.dieuPhoi.suKien.dangKyNguoiChoi(n.id, (sk) => theoNguoi.get(n.id)!.push(sk));
    }
    return (id: string) => theoNguoi.get(id)!;
  }

  it('lời mời hành động chỉ tới người được mời; kết quả soi chỉ tới Tiên tri', async () => {
    const tran = taoTran(VAI);
    const cua = ngheTheoNguoi(tran);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      s1: { mucTieuId: 'A' },
      s2: { mucTieuId: 'A' },
      tt: { mucTieuId: 's1' },
    });
    const loiMoi = (id: string) => cua(id).filter((s) => s.loai === 'MOI_HANH_DONG');
    expect(loiMoi('bv')).toHaveLength(1);
    expect(loiMoi('A')).toEqual([]);
    expect(loiMoi('bv')[0]).toMatchObject({ nguoiChoiId: 'bv', viec: 'HANH_DONG_DEM' });

    const ketQuaSoi = (id: string) => cua(id).filter((s) => s.loai === 'KET_QUA_SOI');
    expect(ketQuaSoi('tt')).toEqual([
      { loai: 'KET_QUA_SOI', luot: 1, mucTieuId: 's1', phe: Phe.SOI },
    ]);
    for (const id of ['s1', 's2', 'bv', 'pt', 'A', 'B']) expect(ketQuaSoi(id)).toEqual([]);
  });

  it('mọi người nhận chuyển pha và đổi bước đêm như nhau', async () => {
    const tran = taoTran(VAI);
    const cua = ngheTheoNguoi(tran);
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem());
    const congKhai = (id: string) =>
      cua(id).filter((s) => s.loai === 'CHUYEN_PHA' || s.loai === 'DOI_BUOC_DEM');
    expect(congKhai('A')).toEqual(congKhai('s1'));
    expect(congKhai('A').map((s) => (s.loai === 'DOI_BUOC_DEM' ? s.buoc : s.trangThai))).toEqual([
      'BaoVe',
      'Soi',
      'TienTri',
      'PhuThuy',
      null,
      TrangThaiVan.GIAI_QUYET_DEM,
    ]);
  });

  it('tin nhắn kênh Sói chỉ tới Sói; công bố buổi sáng tới cả làng, không kèm nguyên nhân', async () => {
    const tran = taoTran(VAI);
    const cua = ngheTheoNguoi(tran);
    const dem = tran.dieuPhoi.xuLyPhaDem();
    await xaHangDoi();
    tran.cong.ghiNhan('bv', { mucTieuId: 'B' });
    await xaHangDoi();
    tran.dieuPhoi.quanLyKenh.guiTinNhan('s1', LoaiKenh.SOI, 'cắn A', tran.dongHo.bayGio());
    await chayKichBan(tran, dem, {
      s1: { mucTieuId: 'A' },
      s2: { mucTieuId: 'A' },
      pt: { mucTieuId: 'B', loai: LoaiHanhDong.DOC },
    });
    tran.dieuPhoi.sauDem();

    const tinNhan = (id: string) => cua(id).filter((s) => s.loai === 'TIN_NHAN');
    expect(tinNhan('s1')).toHaveLength(1);
    expect(tinNhan('s2')).toHaveLength(1);
    for (const id of ['bv', 'tt', 'pt', 'A', 'B']) expect(tinNhan(id)).toEqual([]);

    const congBo = cua('tt').find((s) => s.loai === 'CONG_BO_SANG');
    expect(congBo).toEqual({ loai: 'CONG_BO_SANG', nguoiChet: ['A', 'B'] });
    expect(JSON.stringify(congBo)).not.toMatch(/BI_CAN|BI_DOC/);
  });

  it('kết thúc ván: cả làng nhận KET_THUC', async () => {
    const tran = taoTran(VAI);
    const cua = ngheTheoNguoi(tran);
    // Ban đêm không ai làm gì; ban ngày cả làng bầu Sói còn sống đầu tiên — hai ngày là hết Sói.
    const soiConSong = () => tran.van.layNguoiConSong().find((n) => n.vaiTro.phe === Phe.SOI)!.id;
    const bauSoi = ({ trangThai }: { trangThai: TrangThaiVan }) =>
      trangThai === TrangThaiVan.PHA_DEM ? undefined : { mucTieuId: soiConSong() };
    await chayKichBan(tran, tran.dieuPhoi.chayVan(), {
      bv: bauSoi,
      tt: bauSoi,
      pt: bauSoi,
      A: bauSoi,
      B: bauSoi,
    });
    expect(tran.van.pheThang).toBe(Phe.DAN);
    for (const id of ['s1', 'A']) {
      expect(cua(id).filter((s) => s.loai === 'KET_THUC')).toEqual([
        { loai: 'KET_THUC', pheThang: Phe.DAN },
      ]);
    }
  });
});
