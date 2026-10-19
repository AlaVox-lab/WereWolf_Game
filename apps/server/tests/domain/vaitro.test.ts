import { describe, expect, it } from 'vitest';
import { LoaiHanhDong, LoiNghiepVu, Phe } from '../../src/domain/chung/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  ThoSan,
  TienTri,
  type NguCanhHanhDong,
  type NguoiChoiTrongVan,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';

// Ván giả tối giản: chỉ đủ phần `VanChiDoc` mà lớp vai được đọc.
interface NguoiChoiGia extends NguoiChoiTrongVan {
  conSong: boolean;
}

function taoVan(vai: Record<string, VaiTro>) {
  const nguoiChoi: NguoiChoiGia[] = Object.entries(vai).map(([id, vaiTro]) => ({
    id,
    vaiTro,
    conSong: true,
  }));
  const van = { layNguoiConSong: () => nguoiChoi.filter((n) => n.conSong) };
  const lay = (id: string) => nguoiChoi.find((n) => n.id === id)!;
  const nguCanh = (
    id: string,
    luat = new BoLuatChoi(),
    nanNhanBiCanId: string | null = null,
  ): NguCanhHanhDong => ({ van, luat, nguoiThucHien: lay(id), nanNhanBiCanId });
  return { lay, nguCanh, giet: (id: string) => (lay(id).conSong = false) };
}

const ids = (ds: readonly NguoiChoiTrongVan[]) => ds.map((n) => n.id).sort();

function batLoi(fn: () => unknown): LoiNghiepVu {
  try {
    fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e;
    throw e;
  }
  throw new Error('không ném lỗi');
}

describe('Phân cấp VaiTro — thuộc tính theo bảng mục 1 game-rules.md', () => {
  it.each([
    [new DanLang(), Phe.DAN, 0, false, false],
    [new BaoVe(), Phe.DAN, 10, true, false],
    [new Soi(), Phe.SOI, 20, true, false],
    [new TienTri(), Phe.DAN, 30, true, false],
    [new PhuThuy(), Phe.DAN, 40, true, false],
    [new ThoSan(), Phe.DAN, 0, false, true],
  ])('%o', (vai, phe, doUuTien, demHanhDong, kyNangKhiChet) => {
    expect(vai.phe).toBe(phe);
    expect(vai.doUuTien).toBe(doUuTien);
    expect(vai.laHanhDongDem()).toBe(demHanhDong);
    expect(vai.coKyNangKhiChet()).toBe(kyNangKhiChet);
    expect(vai.moTaNangLuc.length).toBeGreaterThan(0);
  });

  it('lọc laHanhDongDem() rồi sắp theo doUuTien cho đúng thứ tự gọi ban đêm', () => {
    const tatCa: VaiTro[] = [
      new PhuThuy(),
      new DanLang(),
      new TienTri(),
      new ThoSan(),
      new Soi(),
      new BaoVe(),
    ];
    const thuTu = tatCa
      .filter((v) => v.laHanhDongDem())
      .sort((a, b) => a.doUuTien - b.doUuTien)
      .map((v) => v.loaiVai);
    expect(thuTu).toEqual(['BaoVe', 'Soi', 'TienTri', 'PhuThuy']);
  });

  it('Dân làng và Thợ săn không hành động ban đêm', () => {
    const { nguCanh } = taoVan({ dl: new DanLang(), ts: new ThoSan(), a: new DanLang() });
    for (const id of ['dl', 'ts']) {
      const vai = nguCanh(id).nguoiThucHien.vaiTro;
      expect(batLoi(() => vai.thucHienLuot(nguCanh(id), { mucTieuId: 'a' })).ma).toBe(
        'VAI_KHONG_CO_NANG_LUC',
      );
    }
  });

  it('vai không có kỹ năng lúc chết thì không kích hoạt được', () => {
    const { nguCanh } = taoVan({ bv: new BaoVe(), a: new DanLang() });
    expect(batLoi(() => new BaoVe().kichHoatKhiChet(nguCanh('bv'), { mucTieuId: 'a' })).ma).toBe(
      'VAI_KHONG_CO_NANG_LUC',
    );
  });

  it('chọn mục tiêu ngoài danh sách thì bị chặn, người chết không là mục tiêu', () => {
    const { nguCanh, giet } = taoVan({ bv: new BaoVe(), a: new DanLang(), b: new DanLang() });
    giet('b');
    const bv = nguCanh('bv');
    expect(batLoi(() => bv.nguoiThucHien.vaiTro.thucHienLuot(bv, { mucTieuId: 'b' })).ma).toBe(
      'MUC_TIEU_KHONG_HOP_LE',
    );
    expect(batLoi(() => bv.nguoiThucHien.vaiTro.thucHienLuot(bv, { mucTieuId: 'x' })).ma).toBe(
      'MUC_TIEU_KHONG_HOP_LE',
    );
  });
});

describe('BaoVe', () => {
  it('sinh ý định BAO_VE kèm doUuTien, không đổi trạng thái của vai', () => {
    const baoVe = new BaoVe();
    const { nguCanh } = taoVan({ bv: baoVe, a: new DanLang() });
    const hd = baoVe.thucHienLuot(nguCanh('bv'), { mucTieuId: 'a' });
    expect(hd).toMatchObject({
      nguoiThucHienId: 'bv',
      loaiHanhDong: LoaiHanhDong.BAO_VE,
      mucTieuId: 'a',
      doUuTien: 10,
    });
    expect(baoVe.layMucTieuDemTruoc()).toBeNull();
  });

  it('BR05 bật: được tự đỡ; BR05 tắt: không có mình trong danh sách', () => {
    const baoVe = new BaoVe();
    const { nguCanh } = taoVan({ bv: baoVe, a: new DanLang() });
    expect(ids(baoVe.layDanhSachMucTieu(nguCanh('bv')))).toEqual(['a', 'bv']);
    const tatBR05 = new BoLuatChoi({ choBaoVeTuDo: false });
    expect(ids(baoVe.layDanhSachMucTieu(nguCanh('bv', tatBR05)))).toEqual(['a']);
    expect(batLoi(() => baoVe.thucHienLuot(nguCanh('bv', tatBR05), { mucTieuId: 'bv' })).ma).toBe(
      'MUC_TIEU_KHONG_HOP_LE',
    );
  });

  it('TC07 — đỡ A hai đêm liên tiếp: đêm thứ hai A bị loại khỏi danh sách chọn', () => {
    const baoVe = new BaoVe();
    const { nguCanh } = taoVan({ bv: baoVe, a: new DanLang(), b: new DanLang() });
    baoVe.thucHienLuot(nguCanh('bv'), { mucTieuId: 'a' });
    baoVe.capNhatMucTieuDemTruoc('a'); // bước giải quyết đêm 1
    expect(ids(baoVe.layDanhSachMucTieu(nguCanh('bv')))).toEqual(['b', 'bv']);
    expect(batLoi(() => baoVe.thucHienLuot(nguCanh('bv'), { mucTieuId: 'a' })).ma).toBe(
      'MUC_TIEU_KHONG_HOP_LE',
    );
  });

  it('TC17 — tắt BR06: đỡ A hai đêm liên tiếp được phép', () => {
    const baoVe = new BaoVe();
    const tatBR06 = new BoLuatChoi({ camDoTrungDem: false });
    const { nguCanh } = taoVan({ bv: baoVe, a: new DanLang() });
    baoVe.thucHienLuot(nguCanh('bv', tatBR06), { mucTieuId: 'a' });
    baoVe.capNhatMucTieuDemTruoc('a');
    expect(ids(baoVe.layDanhSachMucTieu(nguCanh('bv', tatBR06)))).toContain('a');
    expect(baoVe.thucHienLuot(nguCanh('bv', tatBR06), { mucTieuId: 'a' }).mucTieuId).toBe('a');
  });

  it('bỏ lượt một đêm thì đêm sau đỡ lại người cũ được', () => {
    const baoVe = new BaoVe();
    const { nguCanh } = taoVan({ bv: baoVe, a: new DanLang() });
    baoVe.capNhatMucTieuDemTruoc('a');
    baoVe.capNhatMucTieuDemTruoc(null); // đêm kế bỏ lượt
    expect(baoVe.thucHienLuot(nguCanh('bv'), { mucTieuId: 'a' }).mucTieuId).toBe('a');
  });
});

describe('Soi', () => {
  it('sinh ý định CAN; chỉ cắn người không thuộc phe Sói (Q13)', () => {
    const soi = new Soi();
    const { nguCanh } = taoVan({ s1: soi, s2: new Soi(), a: new DanLang(), tt: new TienTri() });
    expect(ids(soi.layDanhSachMucTieu(nguCanh('s1')))).toEqual(['a', 'tt']);
    expect(soi.thucHienLuot(nguCanh('s1'), { mucTieuId: 'a' })).toMatchObject({
      loaiHanhDong: LoaiHanhDong.CAN,
      doUuTien: 20,
    });
    expect(batLoi(() => soi.thucHienLuot(nguCanh('s1'), { mucTieuId: 's2' })).ma).toBe(
      'MUC_TIEU_KHONG_HOP_LE',
    );
  });
});

describe('TienTri', () => {
  it('sinh ý định chỉ đọc SOI_THONG_TIN; không soi chính mình (Q13)', () => {
    const tienTri = new TienTri();
    const { nguCanh } = taoVan({ tt: tienTri, s: new Soi() });
    expect(ids(tienTri.layDanhSachMucTieu(nguCanh('tt')))).toEqual(['s']);
    expect(tienTri.thucHienLuot(nguCanh('tt'), { mucTieuId: 's' }).loaiHanhDong).toBe(
      LoaiHanhDong.SOI_THONG_TIN,
    );
  });
});

describe('PhuThuy', () => {
  it('cứu chỉ được nạn nhân Sói vừa cắn', () => {
    const phuThuy = new PhuThuy();
    const { nguCanh } = taoVan({ pt: phuThuy, a: new DanLang(), b: new DanLang() });
    const nc = nguCanh('pt', new BoLuatChoi(), 'a');
    expect(ids(phuThuy.layDanhSachMucTieu(nc, LoaiHanhDong.CUU))).toEqual(['a']);
    expect(phuThuy.thucHienLuot(nc, { mucTieuId: 'a', loai: LoaiHanhDong.CUU })).toMatchObject({
      loaiHanhDong: LoaiHanhDong.CUU,
      mucTieuId: 'a',
      doUuTien: 40,
    });
    expect(
      batLoi(() => phuThuy.thucHienLuot(nc, { mucTieuId: 'b', loai: LoaiHanhDong.CUU })).ma,
    ).toBe('MUC_TIEU_KHONG_HOP_LE');
  });

  it('đêm Sói không cắn ai thì không có ai để cứu', () => {
    const phuThuy = new PhuThuy();
    const { nguCanh } = taoVan({ pt: phuThuy, a: new DanLang() });
    expect(phuThuy.layDanhSachMucTieu(nguCanh('pt'), LoaiHanhDong.CUU)).toEqual([]);
  });

  it('TC08 — BR04 bật: Phù thủy là nạn nhân thì không được tự cứu', () => {
    const phuThuy = new PhuThuy();
    const { nguCanh } = taoVan({ pt: phuThuy, a: new DanLang() });
    const nc = nguCanh('pt', new BoLuatChoi(), 'pt');
    expect(phuThuy.layDanhSachMucTieu(nc, LoaiHanhDong.CUU)).toEqual([]);
    expect(
      batLoi(() => phuThuy.thucHienLuot(nc, { mucTieuId: 'pt', loai: LoaiHanhDong.CUU })).ma,
    ).toBe('MUC_TIEU_KHONG_HOP_LE');
  });

  it('TC16 — tắt BR04: Phù thủy tự cứu được — ngược với TC08', () => {
    const phuThuy = new PhuThuy();
    const { nguCanh } = taoVan({ pt: phuThuy, a: new DanLang() });
    const nc = nguCanh('pt', new BoLuatChoi({ camPhuThuyTuCuu: false }), 'pt');
    expect(ids(phuThuy.layDanhSachMucTieu(nc, LoaiHanhDong.CUU))).toEqual(['pt']);
    expect(phuThuy.thucHienLuot(nc, { mucTieuId: 'pt', loai: LoaiHanhDong.CUU }).mucTieuId).toBe(
      'pt',
    );
  });

  it('độc được mọi người còn sống trừ chính mình (Q13)', () => {
    const phuThuy = new PhuThuy();
    const { nguCanh } = taoVan({ pt: phuThuy, a: new DanLang(), s: new Soi() });
    const nc = nguCanh('pt');
    expect(ids(phuThuy.layDanhSachMucTieu(nc, LoaiHanhDong.DOC))).toEqual(['a', 's']);
    expect(phuThuy.thucHienLuot(nc, { mucTieuId: 's', loai: LoaiHanhDong.DOC }).loaiHanhDong).toBe(
      LoaiHanhDong.DOC,
    );
  });

  it('Q08 — một lượt chỉ một hành động: thiếu loại hoặc sai loại bị chặn', () => {
    const phuThuy = new PhuThuy();
    const { nguCanh } = taoVan({ pt: phuThuy, a: new DanLang() });
    const nc = nguCanh('pt', new BoLuatChoi(), 'a');
    expect(batLoi(() => phuThuy.thucHienLuot(nc, { mucTieuId: 'a' })).ma).toBe('VI_PHAM_RANG_BUOC');
    expect(
      batLoi(() => phuThuy.thucHienLuot(nc, { mucTieuId: 'a', loai: LoaiHanhDong.CAN })).ma,
    ).toBe('VI_PHAM_RANG_BUOC');
  });

  it('ghi ý định không trừ lọ; trừ ở bước giải quyết thì hết lọ', () => {
    const phuThuy = new PhuThuy();
    const { nguCanh } = taoVan({ pt: phuThuy, a: new DanLang() });
    const nc = nguCanh('pt', new BoLuatChoi(), 'a');
    phuThuy.thucHienLuot(nc, { mucTieuId: 'a', loai: LoaiHanhDong.CUU });
    expect(phuThuy.layConThuocCuu()).toBe(true);

    phuThuy.truThuocCuu();
    phuThuy.truThuocDoc();
    expect(phuThuy.layDanhSachMucTieu(nc, LoaiHanhDong.CUU)).toEqual([]);
    expect(phuThuy.layDanhSachMucTieu(nc, LoaiHanhDong.DOC)).toEqual([]);
    expect(batLoi(() => phuThuy.truThuocCuu()).ma).toBe('VI_PHAM_RANG_BUOC');
  });
});

describe('ThoSan', () => {
  it('kỹ năng lúc chết sinh ý định BAN tới một người còn sống khác', () => {
    const thoSan = new ThoSan();
    const { nguCanh, giet } = taoVan({ ts: thoSan, a: new DanLang(), s: new Soi() });
    giet('ts');
    expect(ids(thoSan.layDanhSachMucTieu(nguCanh('ts')))).toEqual(['a', 's']);
    expect(thoSan.kichHoatKhiChet(nguCanh('ts'), { mucTieuId: 's' })).toMatchObject({
      nguoiThucHienId: 'ts',
      loaiHanhDong: LoaiHanhDong.BAN,
      mucTieuId: 's',
    });
    expect(batLoi(() => thoSan.kichHoatKhiChet(nguCanh('ts'), { mucTieuId: 'ts' })).ma).toBe(
      'MUC_TIEU_KHONG_HOP_LE',
    );
  });
});
