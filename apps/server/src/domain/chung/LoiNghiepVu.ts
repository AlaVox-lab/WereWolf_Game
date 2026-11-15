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
  | 'DANG_CHO_LUA_CHON'
  | 'KHONG_CO_YEU_CAU'
  | 'LUA_CHON_KHONG_HOP_LE'
  | 'TIN_NHAN_KHONG_HOP_LE'
  | 'KHONG_DUOC_GUI'
  | 'KHONG_DUOC_XEM'
  | 'CHUYEN_TRANG_THAI_KHONG_HOP_LE'
  // Tài khoản (UC01–UC03, UC23)
  | 'TEN_DANG_NHAP_KHONG_HOP_LE'
  | 'MAT_KHAU_QUA_NGAN'
  | 'BIET_DANH_KHONG_HOP_LE'
  | 'TRUNG_TEN_DANG_NHAP'
  | 'SAI_DANG_NHAP'
  | 'TAI_KHOAN_BI_KHOA'
  | 'CHUA_DANG_NHAP'
  | 'KHONG_CO_QUYEN'
  | 'KHONG_TIM_THAY'
  // Phòng chơi (UC06–UC11, UC25)
  | 'KHONG_TIM_THAY_PHONG'
  | 'PHONG_DA_DAY'
  | 'PHONG_DA_BAT_DAU'
  | 'KHONG_PHAI_CHU_PHONG'
  | 'KHONG_O_TRONG_PHONG'
  | 'NGUOI_CHOI_AO_BI_TAT';

export class LoiNghiepVu extends Error {
  override readonly name = 'LoiNghiepVu';

  constructor(
    readonly ma: MaLoi,
    chiTiet?: string,
  ) {
    super(chiTiet ? `${ma}: ${chiTiet}` : ma);
  }
}
