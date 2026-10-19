/**
 * Định danh sáu vai — trùng tên lớp con của `VaiTro` và giá trị cột
 * `nguoi_choi_trong_van.loai_vai` ("tên lớp vai được gán", từ điển dữ liệu 12.2.1).
 * Dùng làm khóa của `CauHinhVai` và để `BoChiaVai` (Factory) biết tạo lớp nào.
 */
export enum LoaiVai {
  DanLang = 'DanLang',
  BaoVe = 'BaoVe',
  Soi = 'Soi',
  TienTri = 'TienTri',
  PhuThuy = 'PhuThuy',
  ThoSan = 'ThoSan',
}
