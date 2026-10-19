import { LoaiHanhDong } from '../chung/LoaiHanhDong.js';
import { LoaiVai } from '../chung/LoaiVai.js';
import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import { Phe } from '../chung/Phe.js';
import { HanhDongDem } from '../van/HanhDongDem.js';
import type { LuaChon, NguCanhHanhDong, NguoiChoiTrongVan } from './NguCanhHanhDong.js';
import { VaiTro } from './VaiTro.js';

/**
 * Thợ săn — không hành động ban đêm (`laHanhDongDem() = false`) nhưng có kỹ năng lúc chết: bắn
 * một người còn sống (UC17). Phân cấp `VaiTro` vì vậy có **hai điểm mở rộng độc lập**.
 *
 * Có được bắn hay không khi bị treo cổ (BR09) và dây chuyền giữa các Thợ săn (BR10) do
 * `BoGiaiQuyetDem.xuLyDayChuyen()` quyết định — vai chỉ tạo ý định `BAN`.
 */
export class ThoSan extends VaiTro {
  readonly loaiVai = LoaiVai.ThoSan;
  readonly tenVai = 'Thợ săn';
  readonly phe = Phe.DAN;
  readonly doUuTien = 0;
  readonly moTaNangLuc =
    'Bạn không hành động ban đêm. Khi bị loại, bạn được bắn một người bất kỳ còn sống.';

  override coKyNangKhiChet(): boolean {
    return true;
  }

  /** Mọi người còn sống trừ chính mình — lúc kích hoạt Thợ săn thường đã bị loại. */
  override layDanhSachMucTieu(nc: NguCanhHanhDong): NguoiChoiTrongVan[] {
    return super.layDanhSachMucTieu(nc).filter((m) => m.id !== nc.nguoiThucHien.id);
  }

  protected dungNangLuc(): HanhDongDem {
    throw new LoiNghiepVu('VAI_KHONG_CO_NANG_LUC', 'Thợ săn không hành động ban đêm');
  }

  protected override taoPhatBan(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem {
    return new HanhDongDem(nc.nguoiThucHien.id, LoaiHanhDong.BAN, luaChon.mucTieuId, this.doUuTien);
  }
}
