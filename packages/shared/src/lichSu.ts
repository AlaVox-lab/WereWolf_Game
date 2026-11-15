// Hợp đồng REST lịch sử ván (UC04) — kiểu thuần gửi xuống trình duyệt.
import type { LoaiVaiCongKhai, PheCongKhai, SuKienNhatKyCongKhai } from './gocNhin.js';

/** Một dòng trong danh sách ván đã chơi — `GET /api/lich-su`. */
export interface TomTatVanCongKhai {
  vanId: string;
  /** Mili giây kể từ epoch. */
  ketThucLuc: number;
  trangThai: 'KET_THUC' | 'HUY_VAN';
  pheThang: PheCongKhai | null;
  soNguoi: number;
  soLuot: number;
  /** Vai của chính người xem trong ván đó. */
  loaiVai: LoaiVaiCongKhai;
  thang: boolean;
}

/** Ván cũ mở lại — `GET /api/lich-su/:vanId`; chỉ người đã chơi ván đó hoặc quản trị viên. */
export interface ChiTietVanCongKhai {
  vanId: string;
  ketThucLuc: number;
  trangThai: 'KET_THUC' | 'HUY_VAN';
  pheThang: PheCongKhai | null;
  nguoiChoi: {
    id: string;
    ten: string;
    loaiVai: LoaiVaiCongKhai;
    conSong: boolean;
    thuTuGhe: number;
    /** Người chơi ảo không báo cáo vi phạm được (UC21). */
    laNguoiChoiAo: boolean;
  }[];
  nhatKy: SuKienNhatKyCongKhai[];
}
