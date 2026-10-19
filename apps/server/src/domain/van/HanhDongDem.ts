import type { LoaiHanhDong } from '../chung/LoaiHanhDong.js';

/**
 * Một **ý định** hành động đêm — chưa áp dụng lên trạng thái người chơi (ARCHITECTURE.md
 * nguyên tắc 2.2). Khớp bảng `hanh_dong_dem`. Bất biến.
 *
 * `doUuTien` được sao chép từ vai lúc tạo để `BoGiaiQuyetDem` sắp xếp mà không cần tra lại vai.
 */
export class HanhDongDem {
  constructor(
    readonly nguoiThucHienId: string,
    readonly loaiHanhDong: LoaiHanhDong,
    readonly mucTieuId: string,
    readonly doUuTien: number,
  ) {
    Object.freeze(this);
  }
}
