import type { PhienBauCu } from '../baucu/PhienBauCu.js';
import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import type { HanhDongDem } from './HanhDongDem.js';
import type { KetQuaDem } from './KetQuaDem.js';

/**
 * Một lượt = một pha đêm và một pha ngày — khớp bảng `luot_choi`. Giữ các ý định hành động của
 * đêm, kết quả giải quyết, và phiên bỏ phiếu của ngày (kèm vòng bầu lại nếu có — Q03).
 */
export class LuotChoi {
  private readonly yDinh: HanhDongDem[] = [];
  private ketQua: KetQuaDem | null = null;
  private readonly danhSachPhien: PhienBauCu[] = [];

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

  /**
   * Gắn phiên bỏ phiếu của ngày. Tối đa hai phiên: phiên chính, và vòng bầu lại chỉ khi phiên
   * chính kết thúc bằng `BAU_LAI`.
   */
  ganPhienBauCu(phien: PhienBauCu): void {
    const truoc = this.danhSachPhien.at(-1);
    const hopLe = truoc
      ? phien.laVongBauLai && !truoc.laVongBauLai && truoc.ketQuaPhien?.loai === 'BAU_LAI'
      : !phien.laVongBauLai;
    if (!hopLe || phien.soLuot !== this.soThuTu) {
      throw new LoiNghiepVu('PHIEN_DA_CHOT', `lượt ${this.soThuTu} không nhận thêm phiên`);
    }
    this.danhSachPhien.push(phien);
  }

  /** Phiên bỏ phiếu đang có hiệu lực — vòng bầu lại nếu có, không thì phiên chính. */
  get phienBauCu(): PhienBauCu | null {
    return this.danhSachPhien.at(-1) ?? null;
  }

  layDanhSachPhienBauCu(): readonly PhienBauCu[] {
    return [...this.danhSachPhien];
  }
}
