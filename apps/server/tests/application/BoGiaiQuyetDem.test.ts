import { beforeEach, describe, expect, it } from 'vitest';
import { BoGiaiQuyetDem } from '../../src/application/BoGiaiQuyetDem.js';
import { LoaiHanhDong } from '../../src/domain/chung/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  TienTri,
  type LuaChon,
} from '../../src/domain/vaitro/index.js';
import { NguoiChoi, NguyenNhanChet, VanDau } from '../../src/domain/van/index.js';

// Ván 6 người: soi = Sói, bv = Bảo vệ, tt = Tiên tri, pt = Phù thủy, A và B là Dân làng.
function taoVan() {
  const vai = { soi: new Soi(), bv: new BaoVe(), tt: new TienTri(), pt: new PhuThuy() };
  const nguoiChoi = [
    ...Object.entries(vai).map(([id, v], i) => {
      const nc = new NguoiChoi(id, `tk-${id}`, i + 1);
      nc.nhanVai(v);
      return nc;
    }),
    ...['A', 'B'].map((id, i) => {
      const nc = new NguoiChoi(id, `tk-${id}`, i + 5);
      nc.nhanVai(new DanLang());
      return nc;
    }),
  ];
  const van = new VanDau('v1', 'ph1', nguoiChoi, new BoLuatChoi());
  van.taoLuotMoi();

  /** Người chơi `id` hành động qua đúng đường của vai, ý định ghi vào lượt hiện tại. */
  const hanhDong = (id: string, luaChon: LuaChon) => {
    const nguoiThucHien = van.layNguoiChoi(id);
    const luot = van.layLuotHienTai();
    const nanNhanBiCanId = BoGiaiQuyetDem.xemNanNhan(luot.layYDinh()).nanNhanId;
    const nc = { van, luat: van.boLuatChoi, nguoiThucHien, nanNhanBiCanId };
    luot.ghiYDinh(nguoiThucHien.vaiTro.thucHienLuot(nc, luaChon));
  };
  return { van, vai, hanhDong };
}

const chet = (van: VanDau) =>
  van
    .layDanhSachNguoiChoi()
    .filter((n) => !n.conSong)
    .map((n) => n.id)
    .sort();

describe('BoGiaiQuyetDem — bảng xung đột game-rules.md mục 3', () => {
  let boGiaiQuyet: BoGiaiQuyetDem;
  beforeEach(() => {
    boGiaiQuyet = new BoGiaiQuyetDem();
  });

  it('TC01 — Sói cắn A, không ai bảo vệ, không ai cứu: A chết', () => {
    const { van, hanhDong } = taoVan();
    hanhDong('soi', { mucTieuId: 'A' });
    const kq = boGiaiQuyet.giaiQuyet(van);
    expect(kq.layDanhSachChet()).toEqual([{ nguoiChoiId: 'A', nguyenNhan: NguyenNhanChet.BI_CAN }]);
    expect(chet(van)).toEqual(['A']);
    expect(van.layNguoiChoi('A').nguyenNhanChet).toBe(NguyenNhanChet.BI_CAN);
  });

  it('TC02 — Sói cắn A, Bảo vệ đỡ A: A sống, Phù thủy được báo mục tiêu an toàn', () => {
    const { van, hanhDong } = taoVan();
    hanhDong('bv', { mucTieuId: 'A' });
    hanhDong('soi', { mucTieuId: 'A' });
    expect(BoGiaiQuyetDem.xemNanNhan(van.layLuotHienTai().layYDinh())).toEqual({
      nanNhanId: 'A',
      anToan: true,
    });
    const kq = boGiaiQuyet.giaiQuyet(van);
    expect(kq.coNguoiChet()).toBe(false);
    expect(kq.layDanhSachDuocCuu()).toEqual(['A']);
    expect(chet(van)).toEqual([]);
  });

  it('TC03 — Sói cắn A, Phù thủy cứu A: A sống, lọ cứu bị trừ', () => {
    const { van, vai, hanhDong } = taoVan();
    hanhDong('soi', { mucTieuId: 'A' });
    expect(BoGiaiQuyetDem.xemNanNhan(van.layLuotHienTai().layYDinh()).anToan).toBe(false);
    hanhDong('pt', { mucTieuId: 'A', loai: LoaiHanhDong.CUU });
    const kq = boGiaiQuyet.giaiQuyet(van);
    expect(kq.coNguoiChet()).toBe(false);
    expect(vai.pt.layConThuocCuu()).toBe(false);
    expect(vai.pt.layConThuocDoc()).toBe(true);
  });

  it('TC04 — Sói cắn A, Bảo vệ đỡ A, Phù thủy cứu A: A sống, lọ cứu không bị trừ', () => {
    const { van, vai, hanhDong } = taoVan();
    hanhDong('bv', { mucTieuId: 'A' });
    hanhDong('soi', { mucTieuId: 'A' });
    hanhDong('pt', { mucTieuId: 'A', loai: LoaiHanhDong.CUU });
    const kq = boGiaiQuyet.giaiQuyet(van);
    expect(kq.coNguoiChet()).toBe(false);
    expect(vai.pt.layConThuocCuu()).toBe(true);
  });

  it('TC05 — Sói cắn A, Phù thủy độc A: chỉ một người chết là A', () => {
    const { van, vai, hanhDong } = taoVan();
    hanhDong('soi', { mucTieuId: 'A' });
    hanhDong('pt', { mucTieuId: 'A', loai: LoaiHanhDong.DOC });
    const kq = boGiaiQuyet.giaiQuyet(van);
    expect(kq.layDanhSachChet()).toHaveLength(1);
    expect(chet(van)).toEqual(['A']);
    expect(vai.pt.layConThuocDoc()).toBe(false);
  });

  it('TC06 — Sói cắn A, Phù thủy độc B: cả A và B chết', () => {
    const { van, hanhDong } = taoVan();
    hanhDong('soi', { mucTieuId: 'A' });
    hanhDong('pt', { mucTieuId: 'B', loai: LoaiHanhDong.DOC });
    const kq = boGiaiQuyet.giaiQuyet(van);
    expect(kq.layDanhSachChet()).toEqual([
      { nguoiChoiId: 'A', nguyenNhan: NguyenNhanChet.BI_CAN },
      { nguoiChoiId: 'B', nguyenNhan: NguyenNhanChet.BI_DOC },
    ]);
    expect(chet(van)).toEqual(['A', 'B']);
  });
});

describe('BoGiaiQuyetDem — hành vi bổ sung', () => {
  it('kết quả không phụ thuộc thứ tự ghi ý định — sắp theo doUuTien (PC03)', () => {
    const theoThuTu = taoVan();
    theoThuTu.hanhDong('bv', { mucTieuId: 'A' });
    theoThuTu.hanhDong('soi', { mucTieuId: 'A' });
    const nguocThuTu = taoVan();
    nguocThuTu.hanhDong('soi', { mucTieuId: 'A' });
    nguocThuTu.hanhDong('bv', { mucTieuId: 'A' });
    const boGiaiQuyet = new BoGiaiQuyetDem();
    expect(boGiaiQuyet.giaiQuyet(nguocThuTu.van).layDanhSachChet()).toEqual(
      boGiaiQuyet.giaiQuyet(theoThuTu.van).layDanhSachChet(),
    );
  });

  it('Bảo vệ đỡ không cản được thuốc độc', () => {
    const { van, hanhDong } = taoVan();
    hanhDong('bv', { mucTieuId: 'B' });
    hanhDong('pt', { mucTieuId: 'B', loai: LoaiHanhDong.DOC });
    new BoGiaiQuyetDem().giaiQuyet(van);
    expect(chet(van)).toEqual(['B']);
  });

  it('đêm không ai hành động thì không ai chết', () => {
    const { van } = taoVan();
    const kq = new BoGiaiQuyetDem().giaiQuyet(van);
    expect(kq.coNguoiChet()).toBe(false);
    expect(van.layLuotHienTai().ketQuaDem).toBe(kq);
  });

  it('ý định soi của Tiên tri không ảnh hưởng kết quả', () => {
    const { van, hanhDong } = taoVan();
    hanhDong('tt', { mucTieuId: 'soi' });
    expect(new BoGiaiQuyetDem().giaiQuyet(van).coNguoiChet()).toBe(false);
  });

  it('BR06 — Bảo vệ nhớ người đỡ đêm nay; bỏ lượt thì xóa', () => {
    const { van, vai, hanhDong } = taoVan();
    const boGiaiQuyet = new BoGiaiQuyetDem();
    hanhDong('bv', { mucTieuId: 'A' });
    boGiaiQuyet.giaiQuyet(van);
    expect(vai.bv.layMucTieuDemTruoc()).toBe('A');
    van.taoLuotMoi();
    boGiaiQuyet.giaiQuyet(van); // đêm 2 Bảo vệ bỏ lượt
    expect(vai.bv.layMucTieuDemTruoc()).toBeNull();
  });

  it('gắn kết quả vào lượt — giải quyết lại cùng một đêm bị chặn', () => {
    const { van } = taoVan();
    const boGiaiQuyet = new BoGiaiQuyetDem();
    boGiaiQuyet.giaiQuyet(van);
    expect(() => boGiaiQuyet.giaiQuyet(van)).toThrow('DEM_DA_GIAI_QUYET');
  });
});
