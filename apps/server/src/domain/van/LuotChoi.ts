import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import type { HanhDongDem } from './HanhDongDem.js';
import type { KetQuaDem } from './KetQuaDem.js';

/**
 * Một lượt = một pha đêm và một pha ngày — khớp bảng `luot_choi`. Giữ các ý định hành động của
 * đêm và kết quả giải quyết. Phiên bỏ phiếu của lượt gắn vào ở hạng mục 1.7.
 */
export class LuotChoi {
  private readonly yDinh: HanhDongDem[] = [];
  private ketQua: KetQuaDem | null = null;

  constructor(readonly soThuTu: number) {}

  /**
   * Ghi một ý định. Ràng buộc toàn vẹn 12.3: trong một lượt, mỗi người tối đa một hành động cho
   * mỗi loại — trùng `UNIQUE (luot_id, nguoi_thuc_hien_id, loai_hanh_dong)` ở cơ sở dữ liệu.
   */
  ghiYDinh(hanhDong: HanhDongDem): void {
    if (this.ketQua) {
      throw new LoiNghiepVu('DEM_DA_GIAI_QUYET', `lượt ${this.soThuTu}`);
    }
    const trung = this.yDinh.some(
      (h) =>
        h.nguoiThucHienId === hanhDong.nguoiThucHienId && h.loaiHanhDong === hanhDong.loaiHanhDong,
    );
    if (trung) {
      throw new LoiNghiepVu(
        'DA_CO_HANH_DONG',
        `${hanhDong.nguoiThucHienId} đã ${hanhDong.loaiHanhDong} ở lượt ${this.soThuTu}`,
      );
    }
    this.yDinh.push(hanhDong);
  }

  layYDinh(): readonly HanhDongDem[] {
    return [...this.yDinh];
  }

  /** Gắn kết quả giải quyết đêm — một lần duy nhất; sau đó không ghi thêm ý định được. */
  ganKetQuaDem(ketQua: KetQuaDem): void {
    if (this.ketQua) throw new LoiNghiepVu('DEM_DA_GIAI_QUYET', `lượt ${this.soThuTu}`);
    this.ketQua = ketQua;
  }

  get ketQuaDem(): KetQuaDem | null {
    return this.ketQua;
  }
}
