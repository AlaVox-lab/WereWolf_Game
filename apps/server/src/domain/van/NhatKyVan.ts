import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';

/** Các loại sự kiện ghi vào nhật ký. Hạng mục 2.7 ghi chúng ở mọi điểm chuyển pha. */
export type LoaiSuKien =
  | 'CHIA_VAI'
  | 'CHUYEN_PHA'
  | 'Y_DINH'
  | 'KET_QUA_SOI'
  | 'KET_QUA_DEM'
  | 'PHIEU_BAU'
  | 'KET_QUA_BO_PHIEU'
  | 'NGUOI_CHET'
  | 'KET_THUC';

export interface SuKien {
  readonly thuTu: number;
  /** Mili giây kể từ mốc Unix — người gọi lấy từ cổng `DongHo`, nhật ký không tự đọc giờ. */
  readonly thoiDiem: number;
  readonly loai: LoaiSuKien;
  readonly duLieu: Readonly<Record<string, unknown>>;
}

/**
 * Nhật ký ván — **chỉ ghi thêm** (ARCHITECTURE.md mục 9). Không có thao tác xóa hay sửa: đây là
 * bằng chứng cho báo cáo vi phạm, và là nguồn của bản ghi diễn tiến mở sau ván.
 *
 * Nhật ký chứa thông tin bí mật (vai, ý định) nên chỉ xuất được sau khi đã đóng lúc ván kết thúc.
 */
export class NhatKyVan {
  private readonly danhSachSuKien: SuKien[] = [];
  private daDong = false;

  ghiSuKien(loai: LoaiSuKien, duLieu: Record<string, unknown>, thoiDiem: number): SuKien {
    if (this.daDong) throw new LoiNghiepVu('NHAT_KY_DA_DONG', loai);
    const suKien: SuKien = Object.freeze({
      thuTu: this.danhSachSuKien.length + 1,
      thoiDiem,
      loai,
      duLieu: Object.freeze({ ...duLieu }),
    });
    this.danhSachSuKien.push(suKien);
    return suKien;
  }

  soSuKien(): number {
    return this.danhSachSuKien.length;
  }

  /** Đóng nhật ký khi ván kết thúc hoặc bị hủy — không ghi thêm được nữa. */
  dong(): void {
    this.daDong = true;
  }

  dangMo(): boolean {
    return !this.daDong;
  }

  /** Toàn bộ sự kiện theo thứ tự — chỉ sau khi nhật ký đã đóng (UC20). */
  xuatBanCongKhai(): readonly SuKien[] {
    if (!this.daDong) throw new LoiNghiepVu('NHAT_KY_CHUA_CONG_KHAI');
    return [...this.danhSachSuKien];
  }
}
