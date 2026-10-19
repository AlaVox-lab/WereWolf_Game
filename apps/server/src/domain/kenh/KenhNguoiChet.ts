import { KenhChat, LoaiKenh, type ThanhVienKenh, type TinhHinhKenh } from './KenhChat.js';

/**
 * Kênh người chết — chỉ người đã bị loại xem và gửi; luôn mở. Người còn sống không bao giờ thấy
 * kênh này, nên người chết trò chuyện được mà không làm lộ thông tin cho ván.
 */
export class KenhNguoiChet extends KenhChat {
  readonly loaiKenh = LoaiKenh.NGUOI_CHET;

  coTheXem(thanhVien: ThanhVienKenh): boolean {
    return !thanhVien.conSong;
  }

  dangMo(_tinhHinh: TinhHinhKenh): boolean {
    return true;
  }

  protected coQuyenGui(thanhVien: ThanhVienKenh): boolean {
    return this.coTheXem(thanhVien);
  }
}
