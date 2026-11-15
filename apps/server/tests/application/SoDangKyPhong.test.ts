// Sổ đăng ký phòng (ROADMAP 4.3) — UC06 tạo phòng, UC07 vào, rời, UC10 loại, danh sách công khai.
import { describe, expect, it } from 'vitest';
import { SoDangKyPhong, DO_DAI_MA_PHONG } from '../../src/application/phong/SoDangKyPhong.js';
import type { ThongTinPhien } from '../../src/application/taikhoan/DichVuTaiKhoan.js';
import { NgauNhienCoHat } from '../../src/domain/chung/index.js';
import { taoKhoBoNho } from '../../src/infrastructure/repository/boNho/khoBoNho.js';

const phien = (i: number): ThongTinPhien => ({
  id: `t${i}`,
  tenDangNhap: `u${i}`,
  bietDanh: `Người ${i}`,
  anhDaiDien: 'Soi',
  laQuanTri: false,
});

function taoSo() {
  const so = new SoDangKyPhong({
    kho: taoKhoBoNho(),
    nguonNgauNhien: new NgauNhienCoHat(1),
    choPhepNguoiChoiAo: true,
  });
  const bao: string[] = [];
  so.dangKy((ma) => bao.push(ma));
  return { so, bao };
}

describe('SoDangKyPhong', () => {
  it('UC06 — mã phòng 6 ký tự dễ đọc, người tạo là chủ phòng, mọi thay đổi được báo', async () => {
    const { so, bao } = taoSo();
    const ma = await so.taoPhong(phien(1));
    expect(ma).toMatch(new RegExp(`^[A-HJ-NP-Z2-9]{${DO_DAI_MA_PHONG}}$`));
    expect(so.chieu(ma)).toMatchObject({
      chuPhongId: 't1',
      trangThai: 'CHO',
      thanhVien: [{ id: 't1', ten: 'Người 1', laChuPhong: true, anhDaiDien: 'Soi', ketNoi: false }],
    });
    expect(bao).toEqual([ma]);
  });

  it('UC07 — vào phòng bằng mã (không phân biệt hoa thường); vào phòng khác thì rời phòng cũ', async () => {
    const { so } = taoSo();
    const a = await so.taoPhong(phien(1));
    const b = await so.taoPhong(phien(2));
    so.vaoPhong(a.toLowerCase(), phien(3));
    expect(so.phongCua('t3')).toBe(a);
    so.vaoPhong(b, phien(3));
    expect(so.thanhVienCua(a)).toEqual(['t1']);
    expect(so.thanhVienCua(b)).toEqual(['t2', 't3']);
    expect(() => so.vaoPhong('ZZZZZZ', phien(4))).toThrow('KHONG_TIM_THAY_PHONG');
  });

  it('Q11 — chủ phòng rời thì chuyển quyền; người cuối rời thì phòng đóng', async () => {
    const { so } = taoSo();
    const ma = await so.taoPhong(phien(1));
    so.vaoPhong(ma, phien(2));
    so.roiPhong(ma, 't1');
    expect(so.chieu(ma).chuPhongId).toBe('t2');
    so.roiPhong(ma, 't2');
    expect(so.coPhong(ma)).toBe(false);
    expect(so.phongCua('t2')).toBeNull();
  });

  it('UC10 — chủ phòng loại người; người bị loại không còn trong phòng', async () => {
    const { so } = taoSo();
    const ma = await so.taoPhong(phien(1));
    so.vaoPhong(ma, phien(2));
    expect(() => so.loai(ma, 't2', 't1')).toThrow('KHONG_PHAI_CHU_PHONG');
    so.loai(ma, 't1', 't2');
    expect(so.phongCua('t2')).toBeNull();
    expect(so.thanhVienCua(ma)).toEqual(['t1']);
  });

  it('danh sách công khai chỉ có phòng đang chờ, chưa đầy, chủ phòng đã mở công khai', async () => {
    const { so } = taoSo();
    const a = await so.taoPhong(phien(1));
    await so.taoPhong(phien(2));
    expect(so.danhSachCongKhai()).toEqual([]);
    so.datCongKhai(a, 't1', true);
    expect(so.danhSachCongKhai()).toEqual([
      { maPhong: a, tenChuPhong: 'Người 1', soNguoi: 1, soNguoiToiDa: 12 },
    ]);
  });

  it('BR13 — trạng thái kết nối hiện trong ảnh chụp phòng', async () => {
    const { so } = taoSo();
    const ma = await so.taoPhong(phien(1));
    so.datKetNoi('t1', true);
    expect(so.chieu(ma).thanhVien[0]!.ketNoi).toBe(true);
    so.datKetNoi('t1', false);
    expect(so.chieu(ma).thanhVien[0]!.ketNoi).toBe(false);
  });
});
