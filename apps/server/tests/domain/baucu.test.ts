import { describe, expect, it } from 'vitest';
import { PhienBauCu, PhieuBau } from '../../src/domain/baucu/index.js';
import { LoiNghiepVu } from '../../src/domain/chung/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import { LuotChoi } from '../../src/domain/van/index.js';

const CU_TRI = ['a', 'b', 'c', 'd', 'e', 'f'];
const LUAT_MAC_DINH = new BoLuatChoi();
const TAT_BR11 = new BoLuatChoi({ hoaPhieuKhongAiChet: false });

function batLoi(fn: () => unknown): LoiNghiepVu {
  try {
    fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e;
    throw e;
  }
  throw new Error('không ném lỗi');
}

/** Bỏ phiếu theo bảng `{ nguoiBau: nguoiBiBau }`; `null` là bỏ trắng. */
function bau(phien: PhienBauCu, phieu: Record<string, string | null>) {
  Object.entries(phieu).forEach(([tu, cho], i) => phien.ghiPhieu(tu, cho, 1000 + i));
}

describe('PhienBauCu — ghi phiếu', () => {
  it('ghi phiếu và phiếu trắng; đếm phiếu bỏ qua phiếu trắng', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    bau(phien, { a: 'c', b: 'c', d: null, e: 'a' });
    expect([...phien.demPhieu()]).toEqual([
      ['c', 2],
      ['a', 1],
    ]);
    expect(phien.layDanhSachPhieu()[2]!.laBoTrang()).toBe(true);
    expect(phien.daDuPhieu()).toBe(false);
  });

  it('mỗi người một phiếu (ràng buộc 12.3)', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    phien.ghiPhieu('a', 'b', 1);
    expect(batLoi(() => phien.ghiPhieu('a', 'c', 2)).ma).toBe('DA_BO_PHIEU');
    expect(batLoi(() => phien.ghiPhieu('a', null, 2)).ma).toBe('DA_BO_PHIEU');
  });

  it('người chết không được bầu và không bị bầu', () => {
    const conSong = ['a', 'b', 'c', 'd', 'e'];
    const phien = new PhienBauCu(1, conSong, 99_000);
    expect(batLoi(() => phien.ghiPhieu('f', 'a', 1)).ma).toBe('KHONG_CO_QUYEN_BAU');
    expect(batLoi(() => phien.ghiPhieu('a', 'f', 1)).ma).toBe('MUC_TIEU_KHONG_HOP_LE');
  });

  it('đủ phiếu khi mọi cử tri đã bầu, kể cả bỏ trắng', () => {
    const phien = new PhienBauCu(1, ['a', 'b'], 99_000);
    bau(phien, { a: 'b', b: null });
    expect(phien.daDuPhieu()).toBe(true);
  });

  it('PhieuBau bất biến', () => {
    expect(Object.isFrozen(new PhieuBau('a', 'b', 1))).toBe(true);
  });
});

describe('PhienBauCu — kiểm phiếu', () => {
  it('một người nhiều phiếu nhất duy nhất thì bị treo cổ', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    bau(phien, { a: 'c', b: 'c', c: 'a', d: 'c', e: 'b' });
    expect(phien.kiemPhieu(LUAT_MAC_DINH)).toEqual({ loai: 'TREO_CO', nguoiBiTreoId: 'c' });
  });

  it('không có phiếu hợp lệ nào (toàn bỏ trắng hoặc hết giờ không ai bầu) thì không ai chết', () => {
    const toanTrang = new PhienBauCu(1, CU_TRI, 99_000);
    bau(toanTrang, { a: null, b: null });
    expect(toanTrang.kiemPhieu(LUAT_MAC_DINH)).toEqual({ loai: 'KHONG_AI' });
    expect(new PhienBauCu(1, CU_TRI, 99_000).kiemPhieu(LUAT_MAC_DINH)).toEqual({
      loai: 'KHONG_AI',
    });
  });

  it('TC11 — hai người cùng số phiếu cao nhất: không ai bị treo cổ', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    bau(phien, { a: 'c', b: 'c', c: 'd', d: 'c', e: 'd', f: 'd' });
    expect(phien.kiemPhieu(LUAT_MAC_DINH)).toEqual({ loai: 'KHONG_AI' });
  });

  it('TC19 — tắt BR11, hai người hòa: bầu lại giữa hai người đó thay vì bỏ qua (Q03)', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    bau(phien, { a: 'c', b: 'c', c: 'd', d: 'c', e: 'd', f: 'd' });
    expect(phien.kiemPhieu(TAT_BR11)).toEqual({ loai: 'BAU_LAI', ungVien: ['c', 'd'] });

    const vongLai = phien.taoVongBauLai(120_000);
    expect(vongLai.laVongBauLai).toBe(true);
    expect(vongLai.layDanhSachUngVien()).toEqual(['c', 'd']);
    expect(batLoi(() => vongLai.ghiPhieu('a', 'e', 1)).ma).toBe('MUC_TIEU_KHONG_HOP_LE');
    bau(vongLai, { a: 'c', b: 'c', c: 'd', d: 'c', e: 'c', f: 'd' });
    expect(vongLai.kiemPhieu(TAT_BR11)).toEqual({ loai: 'TREO_CO', nguoiBiTreoId: 'c' });
  });

  it('tắt BR11, vòng bầu lại vẫn hòa: không ai bị treo cổ (Q03)', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    bau(phien, { a: 'c', b: 'd' });
    const vongLai = (phien.kiemPhieu(TAT_BR11), phien.taoVongBauLai(120_000));
    bau(vongLai, { a: 'c', b: 'd' });
    expect(vongLai.kiemPhieu(TAT_BR11)).toEqual({ loai: 'KHONG_AI' });
    expect(batLoi(() => vongLai.taoVongBauLai(130_000)).ma).toBe('KHONG_THE_BAU_LAI');
  });

  it('hòa ba người khi tắt BR11 cũng bầu lại đủ ba người', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    bau(phien, { a: 'b', b: 'c', c: 'a' });
    expect(phien.kiemPhieu(TAT_BR11)).toEqual({ loai: 'BAU_LAI', ungVien: ['a', 'b', 'c'] });
  });

  it('kiểm phiếu xong thì chốt: không ghi thêm phiếu, gọi lại trả cùng kết quả', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    bau(phien, { a: 'b' });
    const kq = phien.kiemPhieu(LUAT_MAC_DINH);
    expect(batLoi(() => phien.ghiPhieu('c', 'd', 5)).ma).toBe('PHIEN_DA_CHOT');
    expect(phien.kiemPhieu(TAT_BR11)).toBe(kq);
    expect(phien.ketQuaPhien).toBe(kq);
  });

  it('không có kết quả BAU_LAI thì không mở được vòng bầu lại', () => {
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    expect(batLoi(() => phien.taoVongBauLai(1)).ma).toBe('KHONG_THE_BAU_LAI');
    phien.kiemPhieu(LUAT_MAC_DINH);
    expect(batLoi(() => phien.taoVongBauLai(1)).ma).toBe('KHONG_THE_BAU_LAI');
  });
});

describe('LuotChoi — gắn phiên bỏ phiếu', () => {
  it('nhận phiên chính, rồi vòng bầu lại chỉ khi phiên chính ra BAU_LAI', () => {
    const luot = new LuotChoi(1);
    const phien = new PhienBauCu(1, CU_TRI, 99_000);
    luot.ganPhienBauCu(phien);
    bau(phien, { a: 'b', b: 'a' });
    phien.kiemPhieu(TAT_BR11);
    const vongLai = phien.taoVongBauLai(120_000);
    luot.ganPhienBauCu(vongLai);
    expect(luot.phienBauCu).toBe(vongLai);
    expect(luot.layDanhSachPhienBauCu()).toEqual([phien, vongLai]);
  });

  it('từ chối phiên thứ hai không phải vòng bầu lại, và phiên của lượt khác', () => {
    const luot = new LuotChoi(1);
    expect(batLoi(() => luot.ganPhienBauCu(new PhienBauCu(2, CU_TRI, 1))).ma).toBe('PHIEN_DA_CHOT');
    luot.ganPhienBauCu(new PhienBauCu(1, CU_TRI, 1));
    expect(batLoi(() => luot.ganPhienBauCu(new PhienBauCu(1, CU_TRI, 1))).ma).toBe('PHIEN_DA_CHOT');
  });
});
