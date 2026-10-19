import type { LoaiHanhDong } from '../chung/LoaiHanhDong.js';
import type { BoLuatChoi } from '../luat/BoLuatChoi.js';
import type { VaiTro } from './VaiTro.js';

/**
 * Phần của một người chơi mà lớp vai cần đọc. `NguoiChoi` (domain/van, hạng mục 1.4) khớp giao
 * diện này — khai báo ở đây để phân cấp `VaiTro` không phụ thuộc vòng với `NguoiChoi`.
 */
export interface NguoiChoiTrongVan {
  readonly id: string;
  readonly vaiTro: VaiTro;
}

/** Phần của ván mà lớp vai được phép đọc — chỉ đọc, vai không bao giờ sửa ván. */
export interface VanChiDoc {
  layNguoiConSong(): readonly NguoiChoiTrongVan[];
}

/**
 * Ngữ cảnh truyền vào mỗi lần vai hành động. Vai nhận bộ luật **qua ngữ cảnh**, không giữ tham
 * chiếu — điểm nối của mẫu Strategy (ARCHITECTURE.md mục 5.1, 5.3).
 */
export interface NguCanhHanhDong {
  readonly van: VanChiDoc;
  readonly luat: BoLuatChoi;
  readonly nguoiThucHien: NguoiChoiTrongVan;
  /** Nạn nhân Sói vừa chọn trong đêm này, theo ý định chưa áp dụng — chỉ Phù thủy dùng. */
  readonly nanNhanBiCanId?: string | null;
}

/**
 * Một nhóm lựa chọn mà vai đưa ra trong lượt: loại hành động (nếu vai có nhiều loại) và các mục
 * tiêu hợp lệ. Góc nhìn dùng nó để hiển thị "việc cần làm" mà không phải hỏi tên vai.
 */
export interface NhomLuaChon {
  readonly loai?: LoaiHanhDong;
  readonly mucTieu: readonly NguoiChoiTrongVan[];
}

/** Lựa chọn của người chơi trong lượt của mình. */
export interface LuaChon {
  readonly mucTieuId: string;
  /** Chỉ cần với vai có nhiều loại hành động — Phù thủy chọn `CUU` hoặc `DOC`. */
  readonly loai?: LoaiHanhDong;
}
