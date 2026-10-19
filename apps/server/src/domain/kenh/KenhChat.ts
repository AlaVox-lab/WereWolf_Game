import type { Phe } from '../chung/Phe.js';
import type { TrangThaiVan } from '../chung/TrangThaiVan.js';

export enum LoaiKenh {
  CHUNG = 'CHUNG',
  SOI = 'SOI',
  NGUOI_CHET = 'NGUOI_CHET',
}

/** Phần của người chơi mà kênh cần đọc. `NguoiChoi` (domain/van) khớp giao diện này. */
export interface ThanhVienKenh {
  readonly conSong: boolean;
  readonly vaiTro: { readonly phe: Phe };
}

/**
 * Tình hình ván lúc hỏi kênh. `dangLuotSoi` do bộ điều phối điền — `TrangThaiVan` chỉ biết là pha
 * đêm, không biết đang tới lượt vai nào.
 */
export interface TinhHinhKenh {
  readonly trangThai: TrangThaiVan;
  readonly dangLuotSoi: boolean;
}

/**
 * Kênh trò chuyện — phân cấp thứ hai, theo **quyền hiển thị** chứ không theo năng lực
 * (ARCHITECTURE.md mục 5.2).
 *
 * - `coTheXem()` không phụ thuộc pha: ai có quyền xem thì nhận được tin của kênh.
 * - `coTheGui()` là khung chung (Template Method): kênh phải đang mở **và** người gửi có quyền
 *   gửi. Lớp con chỉ định nghĩa `dangMo()` và `coQuyenGui()`.
 */
export abstract class KenhChat {
  abstract readonly loaiKenh: LoaiKenh;

  abstract coTheXem(thanhVien: ThanhVienKenh): boolean;

  /** Kênh có đang nhận tin nhắn trong tình hình này không. */
  abstract dangMo(tinhHinh: TinhHinhKenh): boolean;

  coTheGui(thanhVien: ThanhVienKenh, tinhHinh: TinhHinhKenh): boolean {
    return this.dangMo(tinhHinh) && this.coQuyenGui(thanhVien);
  }

  protected abstract coQuyenGui(thanhVien: ThanhVienKenh): boolean;
}
