// Hợp đồng REST của tài khoản (ARCHITECTURE mục 11.1) — kiểu thuần, không luật.

export interface PhienCongKhai {
  id: string;
  tenDangNhap: string;
  bietDanh: string;
  /** Mã tranh thẻ vai làm ảnh đại diện. */
  anhDaiDien: string;
  laQuanTri: boolean;
}

export interface YeuCauDangKy {
  tenDangNhap: string;
  bietDanh: string;
  matKhau: string;
}

export interface YeuCauDangNhap {
  tenDangNhap: string;
  matKhau: string;
}

/** Mọi lỗi REST và acknowledgement socket có cùng dạng: mã ổn định + câu tiếng Việt. */
export interface PhanHoiLoi {
  loi: string;
  thongDiep: string;
}
