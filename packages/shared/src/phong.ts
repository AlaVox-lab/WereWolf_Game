// Hợp đồng phòng chơi (UC06–UC11, UC25) — kiểu thuần gửi xuống trình duyệt.
import type { LoaiVaiCongKhai, MoTaQuyTacCongKhai } from './gocNhin.js';

export type TrangThaiPhongCongKhai = 'CHO' | 'DANG_CHOI' | 'DA_DONG';

export interface ThanhVienCongKhai {
  id: string;
  ten: string;
  /** Mã tranh thẻ vai làm ảnh đại diện. */
  anhDaiDien: string;
  laNguoiChoiAo: boolean;
  laChuPhong: boolean;
  /** Đang có kết nối thời gian thực (BR13). Người chơi ảo luôn đúng. */
  ketNoi: boolean;
}

export interface ViPhamCauHinhCongKhai {
  ma: string;
  loaiVai?: LoaiVaiCongKhai;
  chiTiet: string;
}

/** Ảnh chụp phòng gửi cho mọi thành viên mỗi khi phòng đổi (`phong:cap-nhat`). */
export interface PhongCongKhai {
  maPhong: string;
  chuPhongId: string;
  trangThai: TrangThaiPhongCongKhai;
  congKhai: boolean;
  thanhVien: ThanhVienCongKhai[];
  soNguoiToiDa: number;
  cauHinhVai: Record<LoaiVaiCongKhai, number>;
  /** Vi phạm của bộ vai với số người hiện tại — rỗng thì bắt đầu được. */
  viPham: ViPhamCauHinhCongKhai[];
  boLuat: MoTaQuyTacCongKhai[];
  /** Máy chủ có cho thêm người chơi ảo không (ROADMAP 4.5). */
  choPhepNguoiChoiAo: boolean;
  /** Ván đang chạy trong phòng, nếu có. */
  vanId: string | null;
}

/** Một dòng trong danh sách phòng công khai ở trang chủ (MH02). */
export interface TomTatPhong {
  maPhong: string;
  tenChuPhong: string;
  soNguoi: number;
  soNguoiToiDa: number;
}
