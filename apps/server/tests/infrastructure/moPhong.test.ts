import { describe, expect, it } from 'vitest';
import { DongHoGia, LoaiVai, Phe } from '../../src/domain/chung/index.js';
import { CauHinhVai } from '../../src/domain/luat/index.js';
import { moPhongMotVan } from '../../src/infrastructure/bot/moPhong.js';

describe('CauHinhVai.macDinh', () => {
  it.each([6, 7, 8, 9, 10, 11, 12])('bộ vai mặc định %i người hợp lệ theo Q06', (n) => {
    const c = CauHinhVai.macDinh(n);
    expect(c.kiemTraHopLe(n)).toEqual([]);
    expect(c.soLuong(LoaiVai.Soi) * 3).toBeLessThan(n);
    expect(c.soLuong(LoaiVai.Soi)).toBeGreaterThanOrEqual(1);
  });

  it('số Sói là lớn nhất còn nhỏ hơn một phần ba', () => {
    expect([6, 7, 9, 10, 12].map((n) => CauHinhVai.macDinh(n).soLuong(LoaiVai.Soi))).toEqual([
      1, 2, 2, 3, 3,
    ]);
  });
});

describe('DongHoGia.tuaToiHenKeTiep', () => {
  it('nhảy thẳng tới hẹn sớm nhất, gọi cả các hẹn cùng thời điểm; hết hẹn thì trả false', () => {
    const dongHo = new DongHoGia(100);
    const goi: string[] = [];
    dongHo.datHen(50, () => goi.push('b'));
    dongHo.datHen(20, () => goi.push('a1'));
    dongHo.datHen(20, () => goi.push('a2'));
    expect(dongHo.tuaToiHenKeTiep()).toBe(true);
    expect(dongHo.bayGio()).toBe(120);
    expect(goi).toEqual(['a1', 'a2']);
    expect(dongHo.tuaToiHenKeTiep()).toBe(true);
    expect(dongHo.bayGio()).toBe(150);
    expect(dongHo.tuaToiHenKeTiep()).toBe(false);
    expect(dongHo.bayGio()).toBe(150);
  });
});

describe('moPhongMotVan (2.9)', () => {
  it('chạy trọn một ván qua đúng đường bắt đầu ván thật, trả phe thắng, số lượt, vai, nhật ký', async () => {
    const kq = await moPhongMotVan({ soNguoi: 8, hatGiong: 42 });
    expect([Phe.DAN, Phe.SOI]).toContain(kq.pheThang);
    expect(kq.soLuot).toBeGreaterThanOrEqual(1);
    expect(Object.keys(kq.vai)).toHaveLength(8);
    expect(Object.values(kq.vai).filter((v) => v === LoaiVai.Soi)).toHaveLength(2);
    expect(kq.nhatKy[0]?.loai).toBe('CHIA_VAI');
    expect(kq.nhatKy.at(-1)).toMatchObject({ loai: 'KET_THUC', duLieu: { pheThang: kq.pheThang } });
    expect(kq.thoiGianGiaLap).toBe(kq.nhatKy.at(-1)!.thoiDiem);
  });

  it('cùng tùy chọn và hạt giống cho cùng một ván (PC03)', async () => {
    const a = await moPhongMotVan({ soNguoi: 10, hatGiong: 7 });
    const b = await moPhongMotVan({ soNguoi: 10, hatGiong: 7 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('nhận bộ luật tùy biến — tắt BR11 thì có ván xuất hiện vòng bầu lại', async () => {
    let coBauLai = false;
    for (let hat = 1; hat <= 40 && !coBauLai; hat++) {
      const kq = await moPhongMotVan({
        soNguoi: 9,
        hatGiong: hat,
        luat: { hoaPhieuKhongAiChet: false },
      });
      coBauLai = kq.nhatKy.some((s) => s.loai === 'PHIEU_BAU' && s.duLieu.vongBauLai === true);
    }
    expect(coBauLai).toBe(true);
  });

  it('vượt giới hạn bước thì báo lỗi thay vì lặp vô tận', async () => {
    await expect(moPhongMotVan({ soNguoi: 8, hatGiong: 1, gioiHanBuoc: 3 })).rejects.toThrow(
      'chưa kết thúc',
    );
  });

  it('200 ván 6–12 người đều kết thúc với phe thắng hợp lệ', async () => {
    for (let hat = 1; hat <= 200; hat++) {
      const kq = await moPhongMotVan({ soNguoi: 6 + (hat % 7), hatGiong: hat });
      expect([Phe.DAN, Phe.SOI]).toContain(kq.pheThang);
    }
  });
});
