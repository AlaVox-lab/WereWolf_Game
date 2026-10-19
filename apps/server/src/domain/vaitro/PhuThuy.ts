import { LoaiHanhDong } from '../chung/LoaiHanhDong.js';
import { LoaiVai } from '../chung/LoaiVai.js';
import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import { MaQuyTac } from '../chung/MaQuyTac.js';
import { Phe } from '../chung/Phe.js';
import { HanhDongDem } from '../van/HanhDongDem.js';
import type { LuaChon, NguCanhHanhDong, NguoiChoiTrongVan } from './NguCanhHanhDong.js';
import { VaiTro } from './VaiTro.js';

/**
 * Phù thủy — một lọ cứu và một lọ độc, mỗi lọ dùng một lần trong cả ván. Mỗi đêm tối đa **một**
 * hành động (Q08): một lượt nhận đúng một `LuaChon` và trả đúng một ý định `CUU` hoặc `DOC`.
 *
 * Lọ thuốc **chỉ bị trừ ở bước giải quyết** qua `truThuocCuu()` / `truThuocDoc()` — nhờ vậy cứu
 * người đã được Bảo vệ đỡ thì không mất lọ (BR07, TC04).
 */
export class PhuThuy extends VaiTro {
  readonly loaiVai = LoaiVai.PhuThuy;
  readonly tenVai = 'Phù thủy';
  readonly phe = Phe.DAN;
  readonly doUuTien = 40;
  readonly moTaNangLuc =
    'Bạn có một lọ cứu và một lọ độc, mỗi lọ dùng một lần cả ván. Mỗi đêm bạn biết ai bị Sói cắn và được chọn cứu, đầu độc một người, hoặc bỏ qua.';

  private conThuocCuu = true;
  private conThuocDoc = true;

  override laHanhDongDem(): boolean {
    return true;
  }

  /**
   * - `CUU`: chỉ nạn nhân Sói vừa cắn, khi còn lọ cứu; BR04 bật thì không cứu được chính mình.
   * - `DOC`: mọi người còn sống trừ chính mình (Q13), khi còn lọ độc.
   * - Không nêu `loai`: hợp của hai danh sách — để giao diện biết có thể chọn ai.
   */
  override layDanhSachMucTieu(nc: NguCanhHanhDong, loai?: LoaiHanhDong): NguoiChoiTrongVan[] {
    const conSong = super.layDanhSachMucTieu(nc);
    const cuu = conSong.filter(
      (m) =>
        this.conThuocCuu &&
        m.id === nc.nanNhanBiCanId &&
        !(nc.luat.chophep(MaQuyTac.BR04) && m.id === nc.nguoiThucHien.id),
    );
    const doc = conSong.filter((m) => this.conThuocDoc && m.id !== nc.nguoiThucHien.id);
    if (loai === LoaiHanhDong.CUU) return cuu;
    if (loai === LoaiHanhDong.DOC) return doc;
    return conSong.filter((m) => cuu.includes(m) || doc.includes(m));
  }

  override kiemTraRangBuoc(_nc: NguCanhHanhDong, luaChon: LuaChon): boolean {
    return luaChon.loai === LoaiHanhDong.CUU || luaChon.loai === LoaiHanhDong.DOC;
  }

  layConThuocCuu(): boolean {
    return this.conThuocCuu;
  }

  layConThuocDoc(): boolean {
    return this.conThuocDoc;
  }

  /** Chỉ `BoGiaiQuyetDem` gọi, khi thuốc cứu thực sự cứu được người. */
  truThuocCuu(): void {
    if (!this.conThuocCuu) throw new LoiNghiepVu('VI_PHAM_RANG_BUOC', 'đã hết lọ cứu');
    this.conThuocCuu = false;
  }

  /** Chỉ `BoGiaiQuyetDem` gọi, khi áp dụng thuốc độc. */
  truThuocDoc(): void {
    if (!this.conThuocDoc) throw new LoiNghiepVu('VI_PHAM_RANG_BUOC', 'đã hết lọ độc');
    this.conThuocDoc = false;
  }

  protected dungNangLuc(nc: NguCanhHanhDong, luaChon: LuaChon): HanhDongDem {
    // kiemTraRangBuoc() đã bảo đảm loai là CUU hoặc DOC.
    const loai = luaChon.loai as LoaiHanhDong.CUU | LoaiHanhDong.DOC;
    return new HanhDongDem(nc.nguoiThucHien.id, loai, luaChon.mucTieuId, this.doUuTien);
  }
}
