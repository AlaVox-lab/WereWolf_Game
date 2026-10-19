import { LoaiHanhDong } from '../chung/LoaiHanhDong.js';
import { LoaiVai } from '../chung/LoaiVai.js';
import { Phe } from '../chung/Phe.js';
import { HanhDongDem } from '../van/HanhDongDem.js';
import type { LuaChon, NguCanhHanhDong, NguoiChoiTrongVan } from './NguCanhHanhDong.js';
import { VaiTro } from './VaiTro.js';

/**
 * Sói — cả bầy thống nhất chọn một mục tiêu để cắn. Mỗi con Sói gửi một đề xuất qua
 * `thucHienLuot()`; cơ chế đồng thuận và chọn ngẫu nhiên khi hết giờ (BR12) nằm ở
 * `BoDieuPhoiVan` (hạng mục 2.2), không nằm trong vai.
 */
export class Soi extends VaiTro {
  readonly loaiVai = LoaiVai.Soi;
  readonly tenVai = 'Sói';
  readonly phe = Phe.SOI;
  readonly doUuTien = 20;
  readonly moTaNangLuc =
    'Mỗi đêm cùng bầy Sói thống nhất chọn một người để cắn. Ban ngày giấu thân phận của mình.';

  override laHanhDongDem(): boolean {
    return true;
  }

  /** Sói chỉ cắn người không thuộc phe Sói — Q13. */
  override layDanhSachMucTieu(nc: NguCanhHanhDong): NguoiChoiTrongVan[] {
    return super.layDanhSachMucTieu(nc).filter((m) => m.vaiTro.phe !== Phe.SOI);
  }

  protected dungNangLuc(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem {
    return new HanhDongDem(nc.nguoiThucHien.id, LoaiHanhDong.CAN, luaChon.mucTieuId, this.doUuTien);
  }
}
