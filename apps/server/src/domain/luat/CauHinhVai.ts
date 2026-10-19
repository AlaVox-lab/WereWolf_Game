import { LoaiVai } from '../chung/LoaiVai.js';

/** Mã vi phạm cấu hình vai — tầng `interface` dịch thành câu tiếng Việt (UC11 luồng 3a). */
export type MaViPhamCauHinh =
  | 'SO_NGUOI_NGOAI_KHOANG'
  | 'SO_LUONG_KHONG_HOP_LE'
  | 'TONG_VAI_KHAC_SO_NGUOI'
  | 'THIEU_SOI'
  | 'QUA_NHIEU_SOI'
  | 'VUOT_GIOI_HAN_VAI';

export interface ViPhamCauHinh {
  ma: MaViPhamCauHinh;
  /** Vai liên quan, nếu vi phạm gắn với một vai cụ thể. */
  loaiVai?: LoaiVai;
  chiTiet: string;
}

/**
 * Cấu hình bộ vai của một phòng: mỗi vai bao nhiêu người (UC08). Bất biến — đổi cấu hình là tạo
 * đối tượng mới.
 *
 * Ràng buộc theo UC11 bước 3 và quyết định Q06 (`game-rules.md` mục 6):
 * - phòng từ 6 đến 12 người, tổng số vai bằng số người
 * - 1 ≤ số Sói < n/3
 * - Bảo vệ, Tiên tri, Phù thủy tối đa 1; Thợ săn tối đa 2; Dân làng là phần còn lại
 */
export class CauHinhVai {
  static readonly SO_NGUOI_TOI_THIEU = 6;
  static readonly SO_NGUOI_TOI_DA = 12;
  static readonly GIOI_HAN_VAI: Readonly<Partial<Record<LoaiVai, number>>> = {
    [LoaiVai.BaoVe]: 1,
    [LoaiVai.TienTri]: 1,
    [LoaiVai.PhuThuy]: 1,
    [LoaiVai.ThoSan]: 2,
  };

  private readonly danhSachVaiVaSoLuong: ReadonlyMap<LoaiVai, number>;

  constructor(soLuong: Partial<Record<LoaiVai, number>>) {
    const bang = new Map<LoaiVai, number>();
    for (const loai of Object.values(LoaiVai)) {
      bang.set(loai, soLuong[loai] ?? 0);
    }
    this.danhSachVaiVaSoLuong = bang;
  }

  /** Số người mang vai `loai`. */
  soLuong(loai: LoaiVai): number {
    return this.danhSachVaiVaSoLuong.get(loai) ?? 0;
  }

  /** Tổng số vai trong cấu hình. */
  tongSoVai(): number {
    let tong = 0;
    for (const so of this.danhSachVaiVaSoLuong.values()) tong += so;
    return tong;
  }

  /** Bản sao số lượng từng vai, theo thứ tự khai báo của `LoaiVai`. */
  layDanhSach(): Record<LoaiVai, number> {
    return Object.fromEntries(this.danhSachVaiVaSoLuong) as Record<LoaiVai, number>;
  }

  /** Mọi vi phạm của cấu hình đối với một phòng `soNguoi` người. Mảng rỗng là hợp lệ. */
  kiemTraHopLe(soNguoi: number): ViPhamCauHinh[] {
    const viPham: ViPhamCauHinh[] = [];
    const { SO_NGUOI_TOI_THIEU: toiThieu, SO_NGUOI_TOI_DA: toiDa } = CauHinhVai;

    if (!Number.isInteger(soNguoi) || soNguoi < toiThieu || soNguoi > toiDa) {
      viPham.push({
        ma: 'SO_NGUOI_NGOAI_KHOANG',
        chiTiet: `cần ${toiThieu}–${toiDa} người, đang có ${soNguoi}`,
      });
    }

    for (const [loai, so] of this.danhSachVaiVaSoLuong) {
      if (!Number.isInteger(so) || so < 0) {
        viPham.push({ ma: 'SO_LUONG_KHONG_HOP_LE', loaiVai: loai, chiTiet: `số lượng ${so}` });
      }
    }
    // Số lượng sai thì các phép đếm phía dưới vô nghĩa.
    if (viPham.some((v) => v.ma === 'SO_LUONG_KHONG_HOP_LE')) return viPham;

    const tong = this.tongSoVai();
    if (tong !== soNguoi) {
      viPham.push({
        ma: 'TONG_VAI_KHAC_SO_NGUOI',
        chiTiet: `tổng ${tong} vai cho ${soNguoi} người`,
      });
    }

    const soSoi = this.soLuong(LoaiVai.Soi);
    if (soSoi < 1) {
      viPham.push({ ma: 'THIEU_SOI', loaiVai: LoaiVai.Soi, chiTiet: 'cần ít nhất 1 Sói' });
    } else if (soSoi * 3 >= soNguoi) {
      // So sánh bằng số nguyên để tránh sai số: Sói < n/3 ⇔ 3·Sói < n.
      viPham.push({
        ma: 'QUA_NHIEU_SOI',
        loaiVai: LoaiVai.Soi,
        chiTiet: `${soSoi} Sói không nhỏ hơn một phần ba của ${soNguoi} người`,
      });
    }

    for (const [loai, gioiHan] of Object.entries(CauHinhVai.GIOI_HAN_VAI) as [LoaiVai, number][]) {
      const so = this.soLuong(loai);
      if (so > gioiHan) {
        viPham.push({
          ma: 'VUOT_GIOI_HAN_VAI',
          loaiVai: loai,
          chiTiet: `${so} ${loai}, tối đa ${gioiHan}`,
        });
      }
    }

    return viPham;
  }
}
