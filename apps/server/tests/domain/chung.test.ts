import { describe, expect, it } from 'vitest';
import {
  DongHoGia,
  LoaiHanhDong,
  LoiNghiepVu,
  MaQuyTac,
  NgauNhienCoHat,
  TrangThaiVan,
} from '../../src/domain/chung/index.js';

describe('Kiểu dùng chung', () => {
  it('đủ 14 mã quy tắc, 6 loại hành động, 10 trạng thái ván', () => {
    expect(Object.values(MaQuyTac)).toHaveLength(14);
    expect(Object.values(LoaiHanhDong)).toHaveLength(6);
    expect(Object.values(TrangThaiVan)).toHaveLength(10);
  });

  it('LoiNghiepVu mang mã lỗi và là một Error', () => {
    const loi = new LoiNghiepVu('BO_LUAT_DA_KHOA', 'ván đã bắt đầu');
    expect(loi).toBeInstanceOf(Error);
    expect(loi.ma).toBe('BO_LUAT_DA_KHOA');
    expect(loi.message).toBe('BO_LUAT_DA_KHOA: ván đã bắt đầu');
  });
});

describe('DongHoGia', () => {
  it('thời gian chỉ trôi khi tua', () => {
    const dongHo = new DongHoGia(1000);
    expect(dongHo.bayGio()).toBe(1000);
    dongHo.tua(250);
    expect(dongHo.bayGio()).toBe(1250);
  });

  it('gọi hẹn theo thời điểm, cùng thời điểm thì theo thứ tự đặt', () => {
    const dongHo = new DongHoGia();
    const thuTu: string[] = [];
    dongHo.datHen(30, () => thuTu.push('c'));
    dongHo.datHen(10, () => thuTu.push('a'));
    dongHo.datHen(10, () => thuTu.push('b'));
    dongHo.tua(20);
    expect(thuTu).toEqual(['a', 'b']);
    dongHo.tua(10);
    expect(thuTu).toEqual(['a', 'b', 'c']);
  });

  it('bayGio() trong lúc gọi hẹn bằng đúng thời điểm của hẹn đó', () => {
    const dongHo = new DongHoGia();
    let luc = -1;
    dongHo.datHen(40, () => (luc = dongHo.bayGio()));
    dongHo.tua(100);
    expect(luc).toBe(40);
    expect(dongHo.bayGio()).toBe(100);
  });

  it('hủy hẹn thì không gọi nữa', () => {
    const dongHo = new DongHoGia();
    let daGoi = false;
    const huy = dongHo.datHen(10, () => (daGoi = true));
    huy();
    huy();
    dongHo.tua(50);
    expect(daGoi).toBe(false);
    expect(dongHo.soHenDangCho()).toBe(0);
  });

  it('hẹn đặt trong lúc tua cũng được gọi nếu tới hạn trong khoảng tua', () => {
    const dongHo = new DongHoGia();
    const thuTu: number[] = [];
    dongHo.datHen(10, () => {
      thuTu.push(dongHo.bayGio());
      dongHo.datHen(15, () => thuTu.push(dongHo.bayGio()));
    });
    dongHo.tua(30);
    expect(thuTu).toEqual([10, 25]);
  });
});

describe('NgauNhienCoHat', () => {
  it('cùng hạt giống cho cùng dãy số, khác hạt giống cho dãy khác', () => {
    const lay = (hat: number) => {
      const nguon = new NgauNhienCoHat(hat);
      return Array.from({ length: 5 }, () => nguon.tiepTheo());
    };
    expect(lay(42)).toEqual(lay(42));
    expect(lay(42)).not.toEqual(lay(43));
  });

  it('soNguyen nằm trong [0, gioiHan) và phân bố gần đều', () => {
    const nguon = new NgauNhienCoHat(7);
    const dem = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60_000; i++) {
      const so = nguon.soNguyen(6);
      expect(so).toBeGreaterThanOrEqual(0);
      expect(so).toBeLessThan(6);
      dem[so]!++;
    }
    for (const lan of dem) expect(Math.abs(lan - 10_000)).toBeLessThan(500);
  });

  it('từ chối giới hạn không hợp lệ', () => {
    const nguon = new NgauNhienCoHat(1);
    expect(() => nguon.soNguyen(0)).toThrow(RangeError);
    expect(() => nguon.soNguyen(2.5)).toThrow(RangeError);
  });
});
