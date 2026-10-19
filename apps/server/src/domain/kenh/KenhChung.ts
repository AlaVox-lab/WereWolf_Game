import { TrangThaiVan } from '../chung/TrangThaiVan.js';
import { KenhChat, LoaiKenh, type ThanhVienKenh, type TinhHinhKenh } from './KenhChat.js';

/**
 * Kênh chung — mọi người trong ván xem được, kể cả người đã chết (BR14); chỉ người còn sống
 * được gửi. Mở trong pha thảo luận và pha bỏ phiếu, đóng ở pha đêm (Q10).
 */
export class KenhChung extends KenhChat {
  readonly loaiKenh = LoaiKenh.CHUNG;

  coTheXem(_thanhVien: ThanhVienKenh): boolean {
    return true;
  }

  dangMo(tinhHinh: TinhHinhKenh): boolean {
    return (
      tinhHinh.trangThai === TrangThaiVan.PHA_THAO_LUAN ||
      tinhHinh.trangThai === TrangThaiVan.PHA_BO_PHIEU
    );
  }

  protected coQuyenGui(thanhVien: ThanhVienKenh): boolean {
    return thanhVien.conSong;
  }
}
