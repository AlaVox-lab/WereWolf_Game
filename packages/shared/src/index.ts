// Hợp đồng dữ liệu giữa máy chủ và giao diện.
// CHỈ chứa kiểu dữ liệu công khai và hằng số tên — tuyệt đối không đặt luật chơi hay lớp vai
// vào đây, vì gói này được đóng gói xuống trình duyệt (ARCHITECTURE.md mục 4.2).

export const TEN_UNG_DUNG = 'Làng Trăng Mờ';

/** Phản hồi của điểm cuối kiểm tra sức khỏe `GET /api/health`. */
export interface PhanHoiSucKhoe {
  trangThai: 'ok';
  ungDung: string;
  thoiDiem: string;
}

export type * from './gocNhin.js';
export type * from './taiKhoan.js';
export type * from './phong.js';
