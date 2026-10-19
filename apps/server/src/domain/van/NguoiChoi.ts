import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import type { NguoiChoiTrongVan } from '../vaitro/NguCanhHanhDong.js';
import type { VaiTro } from '../vaitro/VaiTro.js';
import type { NguyenNhanChet } from './NguyenNhanChet.js';

/**
 * Hiện thân của một tài khoản trong **một** ván — khớp bảng `nguoi_choi_trong_van`. Chỉ mang mã
 * tài khoản, không mang cả đối tượng `TaiKhoan` (ARCHITECTURE.md mục 5.4).
 *
 * Khớp giao diện `NguoiChoiTrongVan` mà phân cấp `VaiTro` đọc. Người mất kết nối vẫn giữ nhân
 * vật (BR13) — kết nối là chuyện của tầng thời gian thực, không phải trạng thái miền.
 */
export class NguoiChoi implements NguoiChoiTrongVan {
  private vai: VaiTro | null = null;
  private dangSong = true;
  private nguyenNhan: NguyenNhanChet | null = null;
  private luotBiLoai: number | null = null;

  constructor(
    readonly id: string,
    readonly taiKhoanId: string,
    readonly thuTuGhe: number,
  ) {}

  /** Vai đã được chia. Đọc trước khi chia vai là lỗi lập trình. */
  get vaiTro(): VaiTro {
    if (!this.vai) throw new LoiNghiepVu('CHUA_NHAN_VAI', this.id);
    return this.vai;
  }

  get conSong(): boolean {
    return this.dangSong;
  }

  /** Nguyên nhân bị loại — `null` khi còn sống. Dùng cho BR09 và nhật ký. */
  get nguyenNhanChet(): NguyenNhanChet | null {
    return this.nguyenNhan;
  }

  /** Số thứ tự lượt bị loại — `null` khi còn sống. */
  get luotChet(): number | null {
    return this.luotBiLoai;
  }

  daNhanVai(): boolean {
    return this.vai !== null;
  }

  /** Gán vai một lần duy nhất, lúc chia vai (UC12). */
  nhanVai(vaiTro: VaiTro): void {
    if (this.vai) throw new LoiNghiepVu('DA_NHAN_VAI', this.id);
    this.vai = vaiTro;
  }

  /** Chuyển sang trạng thái đã chết. Chỉ `VanDau.danhDauChet()` gọi. */
  danhDauChet(nguyenNhan: NguyenNhanChet, luot: number): void {
    if (!this.dangSong) throw new LoiNghiepVu('DA_CHET', this.id);
    this.dangSong = false;
    this.nguyenNhan = nguyenNhan;
    this.luotBiLoai = luot;
  }

  /** Còn được hành động trong ván không — người chết chỉ còn xem và nhắn kênh người chết. */
  coTheHanhDong(): boolean {
    return this.dangSong;
  }
}
