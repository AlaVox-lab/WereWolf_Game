/**
 * Mã lỗi vi phạm luật. Tầng `interface` dịch mã thành thông điệp tiếng Việt cho người chơi,
 * nên lõi miền chỉ ném mã kèm chi tiết kỹ thuật — không viết câu chữ hiển thị ở đây.
 * Hạng mục sau thêm mã mới vào danh sách này khi cần.
 */
export type MaLoi =
  | 'CAU_HINH_VAI_KHONG_HOP_LE'
  | 'BO_LUAT_DA_KHOA'
  | 'QUY_TAC_CO_DINH'
  | 'MUC_TIEU_KHONG_HOP_LE'
  | 'VI_PHAM_RANG_BUOC'
  | 'VAI_KHONG_CO_NANG_LUC'
  | 'CHUA_NHAN_VAI'
  | 'DA_NHAN_VAI'
  | 'DA_CHET'
  | 'KHONG_TIM_THAY_NGUOI_CHOI'
  | 'SO_NGUOI_KHONG_HOP_LE'
  | 'TRUNG_NGUOI_CHOI'
  | 'CHUA_CO_LUOT'
  | 'DA_CO_HANH_DONG'
  | 'DEM_DA_GIAI_QUYET'
  | 'NHAT_KY_DA_DONG'
  | 'NHAT_KY_CHUA_CONG_KHAI'
  | 'DA_BO_PHIEU'
  | 'KHONG_CO_QUYEN_BAU'
  | 'PHIEN_DA_CHOT'
  | 'KHONG_THE_BAU_LAI'
  | 'CHUYEN_TRANG_THAI_KHONG_HOP_LE';

export class LoiNghiepVu extends Error {
  override readonly name = 'LoiNghiepVu';

  constructor(
    readonly ma: MaLoi,
    chiTiet?: string,
  ) {
    super(chiTiet ? `${ma}: ${chiTiet}` : ma);
  }
}
