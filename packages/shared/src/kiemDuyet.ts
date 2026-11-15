// Hợp đồng REST báo cáo vi phạm và quản trị (UC21–UC24, MH11) — kiểu thuần.

export type TrangThaiBaoCaoCongKhai = 'CHO_XU_LY' | 'CANH_CAO' | 'KHOA_TAI_KHOAN' | 'BAC_BO';

/** `POST /api/bao-cao` (UC21). */
export interface YeuCauBaoCao {
  vanId: string;
  nguoiBiBaoCaoId: string;
  lyDo: string;
}

/** Một báo cáo trong danh sách của quản trị viên (UC22). */
export interface BaoCaoCongKhai {
  id: string;
  vanId: string;
  nguoiBaoCao: { id: string; ten: string };
  nguoiBiBaoCao: { id: string; ten: string; biKhoa: boolean };
  lyDo: string;
  trangThai: TrangThaiBaoCaoCongKhai;
  ghiChuXuLy: string | null;
  ngayTao: number;
}

/** `POST /api/quan-tri/bao-cao/:id` (UC22). */
export interface YeuCauXuLyBaoCao {
  quyetDinh: Exclude<TrangThaiBaoCaoCongKhai, 'CHO_XU_LY'>;
  ghiChu: string;
}

/** Một tài khoản trong bảng quản trị (UC23) — không bao giờ có mật khẩu băm. */
export interface TaiKhoanQuanTri {
  id: string;
  tenDangNhap: string;
  bietDanh: string;
  anhDaiDien: string;
  laQuanTri: boolean;
  biKhoa: boolean;
  soVanDaChoi: number;
  ngayTao: number;
}

/** `GET /api/quan-tri/tong-quan` (UC24, MH11). */
export interface TongQuanCongKhai {
  soVan: number;
  soVanDanThang: number;
  soVanSoiThang: number;
  soNguoiChoi: number;
  soTaiKhoanBiKhoa: number;
  soBaoCaoChoXuLy: number;
}
