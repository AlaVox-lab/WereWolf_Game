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
  | 'DA_BO_PHIEU'
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
