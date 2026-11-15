// Dịch mã lỗi nghiệp vụ thành câu tiếng Việt cho người chơi — lõi miền chỉ ném mã (LoiNghiepVu).
import type { PhanHoiLoi } from '@moonvillage/shared';
import { LoiNghiepVu, type MaLoi } from '../domain/chung/LoiNghiepVu.js';

const THONG_DIEP: Record<MaLoi, string> = {
  CAU_HINH_VAI_KHONG_HOP_LE: 'Bộ vai chưa hợp lệ với số người trong phòng.',
  BO_LUAT_DA_KHOA: 'Ván đã bắt đầu — không đổi được bộ luật nữa.',
  QUY_TAC_CO_DINH: 'Quy tắc này cố định, không bật tắt được.',
  MUC_TIEU_KHONG_HOP_LE: 'Không chọn được người này.',
  VI_PHAM_RANG_BUOC: 'Lựa chọn trái luật đang bật.',
  VAI_KHONG_CO_NANG_LUC: 'Vai của bạn không có năng lực này.',
  CHUA_NHAN_VAI: 'Bạn chưa nhận vai.',
  DA_NHAN_VAI: 'Bạn đã nhận vai rồi.',
  DA_CHET: 'Người này đã chết.',
  KHONG_TIM_THAY_NGUOI_CHOI: 'Không tìm thấy người chơi.',
  SO_NGUOI_KHONG_HOP_LE: 'Phòng cần từ 6 đến 12 người.',
  TRUNG_NGUOI_CHOI: 'Người chơi bị trùng.',
  CHUA_CO_LUOT: 'Ván chưa có lượt nào.',
  DA_CO_HANH_DONG: 'Bạn đã hành động trong đêm nay.',
  DEM_DA_GIAI_QUYET: 'Đêm đã khép lại.',
  NHAT_KY_DA_DONG: 'Nhật ký đã đóng.',
  NHAT_KY_CHUA_CONG_KHAI: 'Nhật ký chỉ mở sau khi hết ván.',
  DA_BO_PHIEU: 'Bạn đã bỏ phiếu rồi.',
  KHONG_CO_QUYEN_BAU: 'Bạn không được bỏ phiếu lúc này.',
  PHIEN_DA_CHOT: 'Phiên bỏ phiếu đã chốt.',
  KHONG_THE_BAU_LAI: 'Không mở được vòng bầu lại.',
  DANG_CHO_LUA_CHON: 'Bạn đang có một việc chờ trả lời.',
  KHONG_CO_YEU_CAU: 'Lúc này bạn không được mời làm gì.',
  LUA_CHON_KHONG_HOP_LE: 'Lựa chọn không hợp lệ.',
  TIN_NHAN_KHONG_HOP_LE: 'Tin nhắn trống hoặc quá dài (tối đa 500 ký tự).',
  KHONG_DUOC_GUI: 'Bạn không gửi được vào kênh này lúc này.',
  KHONG_DUOC_XEM: 'Bạn không xem được kênh này.',
  CHUYEN_TRANG_THAI_KHONG_HOP_LE: 'Việc này không làm được ở pha hiện tại.',
  TEN_DANG_NHAP_KHONG_HOP_LE: 'Tên đăng nhập 3–20 ký tự: chữ thường không dấu, số, gạch dưới.',
  MAT_KHAU_QUA_NGAN: 'Mật khẩu cần ít nhất 8 ký tự.',
  BIET_DANH_KHONG_HOP_LE: 'Tên trong làng dài 2–24 ký tự.',
  TRUNG_TEN_DANG_NHAP: 'Tên đăng nhập này đã có người dùng.',
  SAI_DANG_NHAP: 'Sai tên đăng nhập hoặc mật khẩu.',
  TAI_KHOAN_BI_KHOA: 'Tài khoản đang bị khóa. Liên hệ quản trị viên.',
  CHUA_DANG_NHAP: 'Bạn cần đăng nhập.',
  KHONG_CO_QUYEN: 'Bạn không có quyền làm việc này.',
  KHONG_TIM_THAY: 'Không tìm thấy.',
  KHONG_TIM_THAY_PHONG: 'Không có phòng nào mang mã này.',
  PHONG_DA_DAY: 'Phòng đã đủ 12 người.',
  PHONG_DA_BAT_DAU: 'Ván trong phòng đã bắt đầu.',
  KHONG_PHAI_CHU_PHONG: 'Chỉ chủ phòng làm được việc này.',
  KHONG_O_TRONG_PHONG: 'Bạn không ở trong phòng này.',
  NGUOI_CHOI_AO_BI_TAT: 'Máy chủ này không cho thêm người chơi ảo.',
};

/** Mã HTTP cho từng nhóm lỗi; mặc định 400. */
const MA_HTTP: Partial<Record<MaLoi, number>> = {
  CHUA_DANG_NHAP: 401,
  SAI_DANG_NHAP: 401,
  TAI_KHOAN_BI_KHOA: 403,
  KHONG_CO_QUYEN: 403,
  KHONG_PHAI_CHU_PHONG: 403,
  KHONG_TIM_THAY: 404,
  KHONG_TIM_THAY_PHONG: 404,
  TRUNG_TEN_DANG_NHAP: 409,
};

export function dichLoi(loi: unknown): { maHttp: number; than: PhanHoiLoi } {
  if (loi instanceof LoiNghiepVu) {
    return { maHttp: MA_HTTP[loi.ma] ?? 400, than: { loi: loi.ma, thongDiep: THONG_DIEP[loi.ma] } };
  }
  return { maHttp: 500, than: { loi: 'LOI_MAY_CHU', thongDiep: 'Máy chủ gặp lỗi. Thử lại sau.' } };
}
