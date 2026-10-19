import { Phe } from '../chung/Phe.js';
import { TrangThaiVan } from '../chung/TrangThaiVan.js';
import { KenhChat, LoaiKenh, type ThanhVienKenh, type TinhHinhKenh } from './KenhChat.js';

/**
 * Kênh Sói — chỉ Sói **còn sống** xem và gửi. Sói đã chết rơi khỏi kênh (BR14). Chỉ mở trong pha
 * đêm, đúng lượt của Sói, để bầy thảo luận và đề xuất mục tiêu (UC13 luồng con Sói).
 */
export class KenhSoi extends KenhChat {
  readonly loaiKenh = LoaiKenh.SOI;

  coTheXem(thanhVien: ThanhVienKenh): boolean {
    return thanhVien.conSong && thanhVien.vaiTro.phe === Phe.SOI;
  }

  dangMo(tinhHinh: TinhHinhKenh): boolean {
    return tinhHinh.trangThai === TrangThaiVan.PHA_DEM && tinhHinh.dangLuotSoi;
  }

  protected coQuyenGui(thanhVien: ThanhVienKenh): boolean {
    return this.coTheXem(thanhVien);
  }
}
