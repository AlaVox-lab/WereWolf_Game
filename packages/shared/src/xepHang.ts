// Hợp đồng REST bảng xếp hạng mùa (UC05, MH10) — kiểu thuần.

export interface DongXepHangCongKhai {
  hang: number;
  taiKhoanId: string;
  bietDanh: string;
  /** Mã tranh thẻ vai làm ảnh đại diện. */
  anhDaiDien: string;
  diem: number;
  soVan: number;
  soThang: number;
}

/** `GET /api/xep-hang` — mùa đang diễn ra và bảng đã sắp (Q14: thắng +3, thua +1). */
export interface BangXepHangCongKhai {
  mua: { id: string; ten: string; batDau: number };
  dong: DongXepHangCongKhai[];
}
