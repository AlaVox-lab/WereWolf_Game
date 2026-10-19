/**
 * Loại của một ý định hành động — khớp cột `hanh_dong_dem.loai_hanh_dong` trong từ điển dữ liệu.
 * `SOI_THONG_TIN` là hành động chỉ đọc của Tiên tri: không vào bộ giải quyết đêm.
 */
export enum LoaiHanhDong {
  BAO_VE = 'BAO_VE',
  CAN = 'CAN',
  SOI_THONG_TIN = 'SOI_THONG_TIN',
  CUU = 'CUU',
  DOC = 'DOC',
  BAN = 'BAN',
}
