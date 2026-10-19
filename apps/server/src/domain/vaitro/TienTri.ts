import { LoaiHanhDong } from '../chung/LoaiHanhDong.js';
import { LoaiVai } from '../chung/LoaiVai.js';
import { Phe } from '../chung/Phe.js';
import { HanhDongDem } from '../van/HanhDongDem.js';
import type { LuaChon, NguCanhHanhDong, NguoiChoiTrongVan } from './NguCanhHanhDong.js';
import { VaiTro } from './VaiTro.js';

/**
 * Tiên tri — soi phe của một người. Hành động **chỉ đọc**: ý định `SOI_THONG_TIN` chỉ để ghi
 * nhật ký, `BoGiaiQuyetDem` bỏ qua nó; kết quả soi trả riêng cho Tiên tri ngay trong lượt.
 */
export class TienTri extends VaiTro {
  readonly loaiVai = LoaiVai.TienTri;
  readonly tenVai = 'Tiên tri';
  readonly phe = Phe.DAN;
  readonly doUuTien = 30;
  readonly moTaNangLuc =
    'Mỗi đêm chọn một người để soi. Bạn sẽ biết người đó thuộc phe Dân hay phe Sói.';

  override laHanhDongDem(): boolean {
    return true;
  }

  /** Không soi chính mình — Q13. */
  override layDanhSachMucTieu(nc: NguCanhHanhDong): NguoiChoiTrongVan[] {
    return super.layDanhSachMucTieu(nc).filter((m) => m.id !== nc.nguoiThucHien.id);
  }

  protected dungNangLuc(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem {
    return new HanhDongDem(
      nc.nguoiThucHien.id,
      LoaiHanhDong.SOI_THONG_TIN,
      luaChon.mucTieuId,
      this.doUuTien,
    );
  }
}
