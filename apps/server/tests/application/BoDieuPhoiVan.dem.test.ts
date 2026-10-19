import { describe, expect, it } from 'vitest';
import { BoDieuPhoiVan, docLuaChon } from '../../src/application/BoDieuPhoiVan.js';
import { BoHenGio } from '../../src/application/BoHenGio.js';
import { CongLuaChon } from '../../src/application/CongLuaChon.js';
import {
  DongHoGia,
  LoaiHanhDong,
  LoaiVai,
  LoiNghiepVu,
  NgauNhienCoHat,
  Phe,
  TrangThaiVan,
} from '../../src/domain/chung/index.js';
import { BoLuatChoi, CauHinhVai } from '../../src/domain/luat/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  ThoSan,
  TienTri,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';
import { NguoiChoi, NguyenNhanChet, VanDau } from '../../src/domain/van/index.js';

// Ván 8 người: soi, bv (Bảo vệ), tt (Tiên tri), pt (Phù thủy), ts (Thợ săn), A, B, C (Dân làng).
const VAI: Record<string, () => VaiTro> = {
  soi: () => new Soi(),
  bv: () => new BaoVe(),
  tt: () => new TienTri(),
  pt: () => new PhuThuy(),
  ts: () => new ThoSan(),
  A: () => new DanLang(),
  B: () => new DanLang(),
  C: () => new DanLang(),
};
const CAU_HINH = new CauHinhVai({
  [LoaiVai.Soi]: 1,
  [LoaiVai.BaoVe]: 1,
  [LoaiVai.TienTri]: 1,
  [LoaiVai.PhuThuy]: 1,
  [LoaiVai.ThoSan]: 1,
  [LoaiVai.DanLang]: 3,
});

function taoTran() {
  const nguoiChoi = Object.entries(VAI).map(([id, tao], i) => {
    const nc = new NguoiChoi(id, `tk-${id}`, i + 1);
    nc.nhanVai(tao());
    return nc;
  });
  const van = new VanDau('v1', 'ph1', nguoiChoi, new BoLuatChoi());
  van.chuyenPha('batDauVan');
  van.chuyenPha('chiaVaiXong');
  const dongHo = new DongHoGia();
  const boHenGio = new BoHenGio(dongHo);
  const cong = new CongLuaChon(boHenGio);
  const dieuPhoi = new BoDieuPhoiVan(van, CAU_HINH, {
    boHenGio,
    congLuaChon: cong,
    nguonNgauNhien: new NgauNhienCoHat(1),
  });
  return { van, dongHo, cong, dieuPhoi };
}

const xaHangDoi = async () => {
  for (let i = 0; i < 5; i++) await new Promise<void>((r) => setImmediate(r));
};

/**
 * Chạy `hua` tới khi xong: mỗi vòng xả hàng đợi microtask, ghi ai vừa được mời, trả lời theo
 * `kichBan` (không có trong kịch bản thì để hết giờ), rồi tua đồng hồ 1 giây.
 */
async function chayKichBan<T>(
  tran: ReturnType<typeof taoTran>,
  hua: Promise<T>,
  kichBan: Record<string, unknown> = {},
) {
  const { dongHo, cong, van } = tran;
  let xong = false;
  let ketQua: T | undefined;
  hua.then((v) => {
    xong = true;
    ketQua = v;
  });
  const thuTuMoi: { id: string; luc: number }[] = [];
  const dangMoi = new Set<string>();
  const ids = van.layDanhSachNguoiChoi().map((n) => n.id);
  for (let vong = 0; vong < 2_000 && !xong; vong++) {
    await xaHangDoi();
    for (const id of ids) {
      const moi = cong.dangChoNguoi(id);
      if (moi && !dangMoi.has(id)) {
        thuTuMoi.push({ id, luc: dongHo.bayGio() });
        if (id in kichBan) cong.ghiNhan(id, kichBan[id]);
      }
      if (moi && cong.dangChoNguoi(id)) dangMoi.add(id);
      else dangMoi.delete(id);
    }
    await xaHangDoi();
    if (!xong) dongHo.tua(1_000);
  }
  if (!xong) throw new Error('kịch bản không kết thúc');
  return { ketQua: ketQua as T, thuTuMoi, thoiGian: dongHo.bayGio() };
}

describe('BoDieuPhoiVan — khung pha đêm (2.2a)', () => {
  it('thứ tự bước đêm sinh từ doUuTien của các vai trong cấu hình', () => {
    expect(taoTran().dieuPhoi.layThuTuBuocDem()).toEqual([
      LoaiVai.BaoVe,
      LoaiVai.Soi,
      LoaiVai.TienTri,
      LoaiVai.PhuThuy,
    ]);
  });

  it('mời lần lượt Bảo vệ → Sói → Tiên tri → Phù thủy; Dân làng và Thợ săn không được gọi', async () => {
    const tran = taoTran();
    const { thuTuMoi } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      bv: { mucTieuId: 'A' },
      soi: { mucTieuId: 'B' },
      tt: { mucTieuId: 'C' },
      pt: { mucTieuId: 'C', loai: LoaiHanhDong.DOC },
    });
    expect(thuTuMoi.map((m) => m.id)).toEqual(['bv', 'soi', 'tt', 'pt']);
  });

  it('một đêm đầy đủ: đỡ A, cắn B, soi Sói, cứu B — không ai chết, tới GIAI_QUYET_DEM', async () => {
    const tran = taoTran();
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      bv: { mucTieuId: 'A' },
      soi: { mucTieuId: 'B' },
      tt: { mucTieuId: 'soi' },
      pt: { mucTieuId: 'B', loai: LoaiHanhDong.CUU }, // Phù thủy biết B bị cắn nhờ nanNhanBiCanId
    });
    expect(ketQua.coNguoiChet()).toBe(false);
    expect(tran.van.trangThai).toBe(TrangThaiVan.GIAI_QUYET_DEM);
    expect(
      tran.van
        .layLuotHienTai()
        .layYDinh()
        .map((h) => h.loaiHanhDong),
    ).toEqual([
      LoaiHanhDong.BAO_VE,
      LoaiHanhDong.CAN,
      LoaiHanhDong.SOI_THONG_TIN,
      LoaiHanhDong.CUU,
    ]);
    expect(() => ketQua.themNguoiChet('A', NguyenNhanChet.BI_CAN)).toThrow('DEM_DA_GIAI_QUYET');
  });

  it('Tiên tri nhận đúng phe của người được soi', async () => {
    const tran = taoTran();
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), { tt: { mucTieuId: 'soi' } });
    expect(tran.dieuPhoi.layKetQuaSoi('tt')).toEqual([{ luot: 1, mucTieuId: 'soi', phe: Phe.SOI }]);
    expect(tran.dieuPhoi.layKetQuaSoi('A')).toEqual([]);
  });

  it('BR12 — không ai hành động: mỗi bước chờ đủ thời hạn rồi bỏ lượt, không ai chết', async () => {
    const tran = taoTran();
    const { ketQua, thoiGian } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem());
    expect(ketQua.coNguoiChet()).toBe(false);
    expect(tran.van.layLuotHienTai().layYDinh()).toEqual([]);
    expect(thoiGian).toBeGreaterThanOrEqual(25_000 + 45_000 + 25_000 + 25_000);
  });

  it('Q05 — Bảo vệ đã chết: không ai được mời nhưng bước vẫn kéo dài 8–15 giây', async () => {
    const tran = taoTran();
    tran.van.danhDauChet([{ nguoiChoiId: 'bv', nguyenNhan: NguyenNhanChet.BI_TREO_CO }]);
    const { thuTuMoi } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      soi: { mucTieuId: 'A' },
    });
    expect(thuTuMoi[0]!.id).toBe('soi');
    expect(thuTuMoi[0]!.luc).toBeGreaterThanOrEqual(8_000);
    expect(thuTuMoi[0]!.luc).toBeLessThanOrEqual(16_000);
  });

  it('lựa chọn sai bị từ chối nhưng lời mời vẫn mở', async () => {
    const tran = taoTran();
    const hua = tran.dieuPhoi.xuLyPhaDem();
    await xaHangDoi();
    expect(tran.dieuPhoi.layBuocDemHienTai()).toBe(LoaiVai.BaoVe);
    expect(() => tran.cong.ghiNhan('bv', { mucTieuId: 'khong-ai' })).toThrow(
      'MUC_TIEU_KHONG_HOP_LE',
    );
    expect(() => tran.cong.ghiNhan('bv', 'A')).toThrow('LUA_CHON_KHONG_HOP_LE');
    expect(tran.cong.dangChoNguoi('bv')).toBe(true);
    tran.cong.ghiNhan('bv', { mucTieuId: 'A' });
    await chayKichBan(tran, hua);
    expect(tran.dieuPhoi.layBuocDemHienTai()).toBeNull();
  });

  it('Thợ săn chết ban đêm được mời bắn; người bị bắn vào danh sách chết của đêm', async () => {
    const tran = taoTran();
    const { ketQua, thuTuMoi } = await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      soi: { mucTieuId: 'ts' },
      ts: { mucTieuId: 'soi' },
    });
    expect(thuTuMoi.map((m) => m.id)).toEqual(['bv', 'soi', 'tt', 'pt', 'ts']);
    expect(ketQua.layDanhSachChet()).toEqual([
      { nguoiChoiId: 'ts', nguyenNhan: NguyenNhanChet.BI_CAN },
      { nguoiChoiId: 'soi', nguyenNhan: NguyenNhanChet.BI_BAN },
    ]);
  });

  it('chỉ chạy được khi ván đang ở PHA_DEM', async () => {
    const tran = taoTran();
    tran.van.chuyenPha('ketThucDem');
    await expect(tran.dieuPhoi.xuLyPhaDem()).rejects.toThrow('CHUYEN_TRANG_THAI_KHONG_HOP_LE');
  });
});

describe('docLuaChon — kiểm lựa chọn thô từ ngoài', () => {
  it('nhận đối tượng có mucTieuId, loai tùy chọn', () => {
    expect(docLuaChon({ mucTieuId: 'a' })).toEqual({ mucTieuId: 'a' });
    expect(docLuaChon({ mucTieuId: 'a', loai: 'CUU' })).toEqual({
      mucTieuId: 'a',
      loai: LoaiHanhDong.CUU,
    });
  });

  it.each([null, 'a', 42, {}, { mucTieuId: 1 }, { mucTieuId: 'a', loai: 'BAY' }])(
    'từ chối %o',
    (tho) => {
      expect(() => docLuaChon(tho)).toThrow(LoiNghiepVu);
    },
  );
});
