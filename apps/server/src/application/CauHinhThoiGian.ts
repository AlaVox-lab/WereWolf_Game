import { LoaiVai } from '../domain/chung/LoaiVai.js';

/**
 * Thời lượng các bước của ván, mili giây. Mặc định theo `game-rules.md` mục 4 — chỉnh sau buổi
 * chơi thử bằng cấu hình, không sửa mã điều phối. Bộ mô phỏng (2.9) truyền giá trị nhỏ để chạy
 * nhanh.
 */
export interface CauHinhThoiGian {
  /** Thời lượng lượt đêm của từng vai có năng lực đêm. */
  readonly luotVai: Readonly<Partial<Record<LoaiVai, number>>>;
  /** Thợ săn chọn mục tiêu (UC17). */
  readonly thoSanBan: number;
  /** Bước giả của vai không còn ai sống (Q05): chờ ngẫu nhiên trong khoảng này. */
  readonly buocGiaToiThieu: number;
  readonly buocGiaToiDa: number;
}

export const THOI_GIAN_MAC_DINH: CauHinhThoiGian = {
  luotVai: {
    [LoaiVai.BaoVe]: 25_000,
    [LoaiVai.Soi]: 45_000,
    [LoaiVai.TienTri]: 25_000,
    [LoaiVai.PhuThuy]: 25_000,
  },
  thoSanBan: 15_000,
  buocGiaToiThieu: 8_000,
  buocGiaToiDa: 15_000,
};
