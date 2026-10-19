import { LoaiHanhDong } from '../chung/LoaiHanhDong.js';
import { LoaiVai } from '../chung/LoaiVai.js';
import { MaQuyTac } from '../chung/MaQuyTac.js';
import { Phe } from '../chung/Phe.js';
import { HanhDongDem } from '../van/HanhDongDem.js';
import type { LuaChon, NguCanhHanhDong, NguoiChoiTrongVan } from './NguCanhHanhDong.js';
import { VaiTro } from './VaiTro.js';

/** Bảo vệ — chọn một người để che chắn trong đêm. BR05 (tự đỡ), BR06 (không trùng đêm trước). */
export class BaoVe extends VaiTro {
  readonly loaiVai = LoaiVai.BaoVe;
  readonly tenVai = 'Bảo vệ';
  readonly phe = Phe.DAN;
  readonly doUuTien = 10;
  readonly moTaNangLuc =
    'Mỗi đêm chọn một người để che chắn. Nếu Sói cắn đúng người đó, người đó sống sót.';

  /** Người được đỡ ở đêm liền trước; `null` nếu đêm trước không đỡ ai. Dùng cho BR06. */
  private mucTieuDemTruoc: string | null = null;

  override laHanhDongDem(): boolean {
    return true;
  }

  override layDanhSachMucTieu(nc: NguCanhHanhDong): NguoiChoiTrongVan[] {
    let ds = super.layDanhSachMucTieu(nc);
    if (!nc.luat.chophep(MaQuyTac.BR05)) {
      ds = ds.filter((m) => m.id !== nc.nguoiThucHien.id);
    }
    if (nc.luat.chophep(MaQuyTac.BR06) && this.mucTieuDemTruoc !== null) {
      ds = ds.filter((m) => m.id !== this.mucTieuDemTruoc);
    }
    return ds;
  }

  override kiemTraRangBuoc(nc: NguCanhHanhDong, luaChon: LuaChon): boolean {
    return !(nc.luat.chophep(MaQuyTac.BR06) && luaChon.mucTieuId === this.mucTieuDemTruoc);
  }

  /** Mục tiêu đêm trước — để kiểm thử và chiếu góc nhìn cho chính Bảo vệ. */
  layMucTieuDemTruoc(): string | null {
    return this.mucTieuDemTruoc;
  }

  /**
   * Ghi người được đỡ trong đêm vừa giải quyết (`null` nếu bỏ lượt). Chỉ `BoGiaiQuyetDem` gọi,
   * ở bước giải quyết — không gọi lúc ghi ý định.
   */
  capNhatMucTieuDemTruoc(mucTieuId: string | null): void {
    this.mucTieuDemTruoc = mucTieuId;
  }

  protected dungNangLuc(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem {
    return new HanhDongDem(
      nc.nguoiThucHien.id,
      LoaiHanhDong.BAO_VE,
      luaChon.mucTieuId,
      this.doUuTien,
    );
  }
}
