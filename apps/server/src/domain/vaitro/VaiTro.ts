import type { LoaiHanhDong } from '../chung/LoaiHanhDong.js';
import type { LoaiVai } from '../chung/LoaiVai.js';
import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import type { Phe } from '../chung/Phe.js';
import type { HanhDongDem } from '../van/HanhDongDem.js';
import type { LuaChon, NguCanhHanhDong, NguoiChoiTrongVan } from './NguCanhHanhDong.js';

/**
 * Lớp trừu tượng của sáu vai — phân cấp trung tâm (ARCHITECTURE.md mục 5.1).
 *
 * **Template Method**: `thucHienLuot()` và `kichHoatKhiChet()` là khung chung, lớp con KHÔNG ghi
 * đè. Lớp con chỉ cung cấp ba điểm mở rộng: `layDanhSachMucTieu`, `kiemTraRangBuoc`,
 * `dungNangLuc` (hoặc `taoPhatBan` với vai có kỹ năng lúc chết).
 *
 * Vai **không sửa trạng thái người chơi**: mọi hành động chỉ trả về một `HanhDongDem` là ý định.
 * Trạng thái riêng của vai (lọ thuốc, mục tiêu đêm trước) chỉ đổi khi `BoGiaiQuyetDem` gọi các
 * phương thức cập nhật ở bước giải quyết.
 */
export abstract class VaiTro {
  abstract readonly loaiVai: LoaiVai;
  abstract readonly tenVai: string;
  abstract readonly phe: Phe;
  abstract readonly doUuTien: number;
  /** Hướng dẫn hiển thị cho người mới — nhu cầu N05. */
  abstract readonly moTaNangLuc: string;

  /** Đúng nếu vai được gọi dậy trong pha đêm. `BaoVe`, `Soi`, `TienTri`, `PhuThuy` ghi đè. */
  laHanhDongDem(): boolean {
    return false;
  }

  /** Đúng nếu vai có kỹ năng kích hoạt khi bị loại. `ThoSan` ghi đè. */
  coKyNangKhiChet(): boolean {
    return false;
  }

  /**
   * Khung xử lý một lượt đêm: kiểm tra vai có năng lực đêm, mục tiêu nằm trong danh sách được
   * phép, ràng buộc riêng của vai, rồi mới để lớp con tạo ý định.
   */
  thucHienLuot(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem {
    if (!this.laHanhDongDem()) {
      throw new LoiNghiepVu('VAI_KHONG_CO_NANG_LUC', `${this.loaiVai} không hành động ban đêm`);
    }
    this.kiemTraLuaChon(nc, luaChon);
    return this.dungNangLuc(nc, luaChon);
  }

  /** Khung kỹ năng lúc chết (UC17). Vai không có kỹ năng thì ném lỗi. */
  kichHoatKhiChet(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem {
    if (!this.coKyNangKhiChet()) {
      throw new LoiNghiepVu('VAI_KHONG_CO_NANG_LUC', `${this.loaiVai} không có kỹ năng lúc chết`);
    }
    this.kiemTraLuaChon(nc, luaChon);
    return this.taoPhatBan(nc, luaChon);
  }

  /**
   * Danh sách mục tiêu được phép chọn. Mặc định: mọi người còn sống. `loai` chỉ có nghĩa với vai
   * có nhiều loại hành động.
   */
  layDanhSachMucTieu(nc: NguCanhHanhDong, _loai?: LoaiHanhDong): NguoiChoiTrongVan[] {
    return [...nc.van.layNguoiConSong()];
  }

  /** Ràng buộc riêng của vai ngoài danh sách mục tiêu. Mặc định không có. */
  kiemTraRangBuoc(_nc: NguCanhHanhDong, _luaChon: LuaChon): boolean {
    return true;
  }

  /** Tạo ý định cho lượt đêm. Chỉ được gọi qua `thucHienLuot()`. */
  protected abstract dungNangLuc(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem;

  /** Tạo ý định cho kỹ năng lúc chết. Chỉ vai có kỹ năng mới ghi đè. */
  protected taoPhatBan(_nc: NguCanhHanhDong, _luaChon: LuaChon): HanhDongDem {
    throw new LoiNghiepVu('VAI_KHONG_CO_NANG_LUC', `${this.loaiVai} không có kỹ năng lúc chết`);
  }

  private kiemTraLuaChon(nc: NguCanhHanhDong, luaChon: LuaChon): void {
    const hopLe = this.layDanhSachMucTieu(nc, luaChon.loai).some((m) => m.id === luaChon.mucTieuId);
    if (!hopLe) {
      throw new LoiNghiepVu(
        'MUC_TIEU_KHONG_HOP_LE',
        `${this.loaiVai} không được chọn ${luaChon.mucTieuId}`,
      );
    }
    if (!this.kiemTraRangBuoc(nc, luaChon)) {
      throw new LoiNghiepVu('VI_PHAM_RANG_BUOC', `${this.loaiVai} chọn ${luaChon.mucTieuId}`);
    }
  }
}
