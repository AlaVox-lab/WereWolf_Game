// Hợp đồng Socket.IO (ARCHITECTURE mục 11.2, 11.3) — tên sự kiện và kiểu dữ liệu hai chiều.
// Mọi lệnh trả lời qua acknowledgement `PhanHoiLenh`.
import type { GocNhinNguoiChoi, LoaiKenhCongKhai } from './gocNhin.js';
import type { PhongCongKhai } from './phong.js';

export type PhanHoiLenh = { ok: true } | { ok: false; loi: string; thongDiep: string };

export interface TinNhanCongKhai {
  thuTu: number;
  kenh: LoaiKenhCongKhai;
  nguoiGuiId: string;
  noiDung: string;
  thoiDiem: number;
}

/** Góc nhìn kèm giờ máy chủ lúc gửi — trình duyệt bù lệch đồng hồ khi đếm ngược. */
export interface GoiGocNhin {
  gocNhin: GocNhinNguoiChoi;
  bayGioMayChu: number;
}

export interface SuKienMayChu {
  /** Phòng mình đang ở đổi; `null` khi mình không còn ở phòng nào (rời, bị loại, phòng đóng). */
  'phong:cap-nhat': (phong: PhongCongKhai | null) => void;
  /** Góc nhìn riêng của chính người nhận — không bao giờ có vai người khác (PC04, ST05). */
  'van:goc-nhin': (goi: GoiGocNhin) => void;
  'kenh:tin-nhan': (tin: TinNhanCongKhai) => void;
  /** Lịch sử các kênh mình xem được — gửi khi vào ván hoặc kết nối lại (BR13). */
  'kenh:lich-su': (ds: TinNhanCongKhai[]) => void;
  /** Bị buộc rời (tài khoản bị khóa — UC23). */
  'phien:ket-thuc': (lyDo: string) => void;
}

type Lenh<T> = (duLieu: T, traLoi: (phanHoi: PhanHoiLenh) => void) => void;

export interface LenhNguoiChoi {
  'phong:vao': Lenh<{ maPhong: string }>;
  'phong:roi': Lenh<Record<string, never>>;
  'phong:loai': Lenh<{ taiKhoanId: string }>;
  'phong:cau-hinh-vai': Lenh<{ soLuong: Record<string, number> }>;
  'phong:goi-y-vai': Lenh<Record<string, never>>;
  'phong:cau-hinh-luat': Lenh<{ ma: string; dangBat: boolean }>;
  'phong:cong-khai': Lenh<{ congKhai: boolean }>;
  'phong:them-nguoi-ao': Lenh<Record<string, never>>;
  'phong:bot-nguoi-ao': Lenh<Record<string, never>>;
  'phong:bat-dau': Lenh<Record<string, never>>;
  /** Hành động đêm và mũi tên Thợ săn. */
  'van:hanh-dong': Lenh<{ mucTieuId: string; loai?: 'CUU' | 'DOC' }>;
  /** `mucTieuId: null` là bỏ trắng. */
  'van:bo-phieu': Lenh<{ mucTieuId: string | null }>;
  'kenh:gui': Lenh<{ kenh: LoaiKenhCongKhai; noiDung: string }>;
}
