import { describe, expect, it, vi } from 'vitest';
import { BoGiaiQuyetDem, type ChonMucTieuThoSan } from '../../src/application/BoGiaiQuyetDem.js';
import { LoaiHanhDong } from '../../src/domain/chung/index.js';
import { BoLuatChoi, type CauHinhBoLuat } from '../../src/domain/luat/index.js';
import { DanLang, PhuThuy, Soi, ThoSan, type VaiTro } from '../../src/domain/vaitro/index.js';
import { NguoiChoi, NguyenNhanChet, VanDau } from '../../src/domain/van/index.js';

// Ván 7 người: ts1, ts2 là Thợ săn; soi; pt là Phù thủy; A, B, C là Dân làng.
function taoVan(luat: Partial<CauHinhBoLuat> = {}) {
  const vai: Record<string, VaiTro> = {
    ts1: new ThoSan(),
    ts2: new ThoSan(),
    soi: new Soi(),
    pt: new PhuThuy(),
    A: new DanLang(),
    B: new DanLang(),
    C: new DanLang(),
  };
  const nguoiChoi = Object.entries(vai).map(([id, v], i) => {
    const nc = new NguoiChoi(id, `tk-${id}`, i + 1);
    nc.nhanVai(v);
    return nc;
  });
  const van = new VanDau('v1', 'ph1', nguoiChoi, new BoLuatChoi(luat));
  van.taoLuotMoi();
  return van;
}

/** Bộ chọn theo kịch bản: Thợ săn `id` bắn `kichBan[id]`; không có trong kịch bản thì bỏ qua. */
function theoKichBan(kichBan: Record<string, string | null>): ChonMucTieuThoSan {
  return async (thoSan) => kichBan[thoSan.id] ?? null;
}

const chet = (van: VanDau) =>
  van
    .layDanhSachNguoiChoi()
    .filter((n) => !n.conSong)
    .map((n) => n.id)
    .sort();

describe('BoGiaiQuyetDem.xuLyDayChuyen — dây chuyền Thợ săn', () => {
  const bo = new BoGiaiQuyetDem();

  it('TC09 — A bị treo cổ, A là Thợ săn, A bắn B: cả A và B chết trong cùng lượt', async () => {
    const van = taoVan();
    van.danhDauChet([{ nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_TREO_CO }]);
    const phatBan = await bo.xuLyDayChuyen(van, ['ts1'], theoKichBan({ ts1: 'B' }));
    expect(phatBan).toEqual([{ nguoiBanId: 'ts1', mucTieuId: 'B' }]);
    expect(chet(van)).toEqual(['B', 'ts1']);
    expect(van.layNguoiChoi('B')).toMatchObject({
      nguyenNhanChet: NguyenNhanChet.BI_BAN,
      luotChet: van.layNguoiChoi('ts1').luotChet,
    });
  });

  it('TC10 — Thợ săn A bắn B, B cũng là Thợ săn, B bắn C: cả ba chết', async () => {
    const van = taoVan();
    van.danhDauChet([{ nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    const phatBan = await bo.xuLyDayChuyen(van, ['ts1'], theoKichBan({ ts1: 'ts2', ts2: 'C' }));
    expect(phatBan).toEqual([
      { nguoiBanId: 'ts1', mucTieuId: 'ts2' },
      { nguoiBanId: 'ts2', mucTieuId: 'C' },
    ]);
    expect(chet(van)).toEqual(['C', 'ts1', 'ts2']);
  });

  it('TC18 — tắt BR09, Thợ săn bị treo cổ: không được bắn — ngược với TC09', async () => {
    const van = taoVan({ thoSanBanKhiTreoCo: false });
    van.danhDauChet([{ nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_TREO_CO }]);
    const chon = vi.fn(theoKichBan({ ts1: 'B' }));
    expect(await bo.xuLyDayChuyen(van, ['ts1'], chon)).toEqual([]);
    expect(chon).not.toHaveBeenCalled();
    expect(chet(van)).toEqual(['ts1']);
  });

  it.each([NguyenNhanChet.BI_CAN, NguyenNhanChet.BI_DOC, NguyenNhanChet.BI_BAN])(
    'Q02 — tắt BR09, Thợ săn chết vì %s vẫn được bắn',
    async (nguyenNhan) => {
      const van = taoVan({ thoSanBanKhiTreoCo: false });
      van.danhDauChet([{ nguoiChoiId: 'ts1', nguyenNhan }]);
      expect(await bo.xuLyDayChuyen(van, ['ts1'], theoKichBan({ ts1: 'B' }))).toHaveLength(1);
    },
  );

  it('Thợ săn bỏ qua hoặc hết giờ (null) thì không ai bị bắn — UC17 luồng 2a', async () => {
    const van = taoVan();
    van.danhDauChet([{ nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    expect(await bo.xuLyDayChuyen(van, ['ts1'], theoKichBan({}))).toEqual([]);
    expect(chet(van)).toEqual(['ts1']);
  });

  it('chọn ngoài danh sách ứng viên (người đã chết, chính mình) coi như bỏ qua', async () => {
    const van = taoVan();
    van.danhDauChet([
      { nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_CAN },
      { nguoiChoiId: 'A', nguyenNhan: NguyenNhanChet.BI_DOC },
    ]);
    expect(await bo.xuLyDayChuyen(van, ['ts1', 'A'], theoKichBan({ ts1: 'A' }))).toEqual([]);
    expect(await bo.xuLyDayChuyen(van, ['ts1'], theoKichBan({ ts1: 'ts1' }))).toEqual([]);
  });

  it('ứng viên chỉ gồm người còn sống, không có chính Thợ săn', async () => {
    const van = taoVan();
    van.danhDauChet([
      { nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_CAN },
      { nguoiChoiId: 'C', nguyenNhan: NguyenNhanChet.BI_CAN },
    ]);
    let ungVienDaThay: string[] = [];
    await bo.xuLyDayChuyen(van, ['ts1', 'C'], async (_ts, ungVien) => {
      ungVienDaThay = ungVien.map((n) => n.id).sort();
      return null;
    });
    expect(ungVienDaThay).toEqual(['A', 'B', 'pt', 'soi', 'ts2']);
  });

  it('người chết không phải Thợ săn thì không hỏi ai', async () => {
    const van = taoVan();
    van.danhDauChet([{ nguoiChoiId: 'A', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    const chon = vi.fn(theoKichBan({}));
    await bo.xuLyDayChuyen(van, ['A'], chon);
    expect(chon).not.toHaveBeenCalled();
  });

  it('luôn dừng khi hai Thợ săn cùng muốn bắn nhau', async () => {
    const van = taoVan();
    van.danhDauChet([{ nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    // Bộ chọn "xấu tính": luôn ưu tiên bắn Thợ săn còn lại, nếu không thì bắn người đầu tiên.
    const chon = vi.fn<ChonMucTieuThoSan>(async (_ts, ungVien) => {
      return (ungVien.find((n) => n.vaiTro instanceof ThoSan) ?? ungVien[0])?.id ?? null;
    });
    const phatBan = await bo.xuLyDayChuyen(van, ['ts1'], chon);
    expect(phatBan.map((p) => p.nguoiBanId)).toEqual(['ts1', 'ts2']);
    expect(chon).toHaveBeenCalledTimes(2);
  });

  it('ban đêm: người bị bắn vào danh sách chết của đêm; tắt BR09 không ảnh hưởng ban đêm', async () => {
    const van = taoVan({ thoSanBanKhiTreoCo: false });
    const luot = van.layLuotHienTai();
    const ctx = (id: string) => ({
      van,
      luat: van.boLuatChoi,
      nguoiThucHien: van.layNguoiChoi(id),
    });
    luot.ghiYDinh(van.layNguoiChoi('soi').vaiTro.thucHienLuot(ctx('soi'), { mucTieuId: 'ts1' }));
    luot.ghiYDinh(
      van
        .layNguoiChoi('pt')
        .vaiTro.thucHienLuot(ctx('pt'), { mucTieuId: 'A', loai: LoaiHanhDong.DOC }),
    );
    const kq = bo.giaiQuyet(van);
    const nguoiVuaChet = kq.layDanhSachChet().map((c) => c.nguoiChoiId);
    await bo.xuLyDayChuyen(van, nguoiVuaChet, theoKichBan({ ts1: 'B' }), kq);
    kq.chot();
    expect(kq.layDanhSachChet()).toEqual([
      { nguoiChoiId: 'ts1', nguyenNhan: NguyenNhanChet.BI_CAN },
      { nguoiChoiId: 'A', nguyenNhan: NguyenNhanChet.BI_DOC },
      { nguoiChoiId: 'B', nguyenNhan: NguyenNhanChet.BI_BAN },
    ]);
    expect(chet(van)).toEqual(['A', 'B', 'ts1']);
  });
});
