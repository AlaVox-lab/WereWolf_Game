// Cổng kho dữ liệu — tầng ứng dụng chỉ biết các giao diện này. Bản cài: Prisma/PostgreSQL ở
// `infrastructure/repository/prisma`, bộ nhớ ở `infrastructure/repository/boNho` (kiểm thử, CI,
// chạy thử không cần cơ sở dữ liệu). Mã định danh là chuỗi; cơ sở dữ liệu dùng BIGINT.
import type { CauHinhBoLuat } from '../../domain/luat/BoLuatChoi.js';

export interface TaiKhoanLuu {
  id: string;
  tenDangNhap: string;
  matKhauBam: string;
  laQuanTri: boolean;
  biKhoa: boolean;
  laNguoiChoiAo: boolean;
  ngayTao: Date;
}

export interface HoSoLuu {
  taiKhoanId: string;
  bietDanh: string;
  /** Mã tranh thẻ vai dùng làm ảnh đại diện. */
  anhDaiDien: string;
  soVanDaChoi: number;
  soVanThang: number;
}

export interface KhoTaiKhoan {
  timTheoTen(tenDangNhap: string): Promise<TaiKhoanLuu | null>;
  timTheoId(id: string): Promise<TaiKhoanLuu | null>;
  tao(du: {
    tenDangNhap: string;
    matKhauBam: string;
    bietDanh: string;
    laNguoiChoiAo?: boolean;
    laQuanTri?: boolean;
  }): Promise<TaiKhoanLuu>;
  layHoSo(taiKhoanId: string): Promise<HoSoLuu | null>;
  capNhatHoSo(taiKhoanId: string, du: { bietDanh?: string; anhDaiDien?: string }): Promise<HoSoLuu>;
  datKhoa(taiKhoanId: string, biKhoa: boolean): Promise<void>;
  /** Mọi tài khoản người thật, kèm hồ sơ — cho bảng quản trị. */
  danhSach(): Promise<(TaiKhoanLuu & { hoSo: HoSoLuu | null })[]>;
  /** Tài khoản người chơi ảo thứ `thuTu` — tạo nếu chưa có. Không đăng nhập được. */
  layNguoiChoiAo(thuTu: number): Promise<TaiKhoanLuu>;
}

export interface KhoPhong {
  taoPhong(maPhong: string, chuPhongId: string): Promise<string>;
  capNhatPhong(
    phongId: string,
    du: { trangThai: string; cauHinhVai: Record<string, number>; boLuat: CauHinhBoLuat },
  ): Promise<void>;
}

/** Một ván đã kết thúc (hoặc bị hủy), đủ để ghi vào chín bảng của nhóm ván. */
export interface VanDaKetThuc {
  phongId: string;
  trangThai: 'KET_THUC' | 'HUY_VAN';
  pheThang: 'DAN' | 'SOI' | null;
  soLuot: number;
  batDauLuc: Date;
  ketThucLuc: Date;
  boLuat: CauHinhBoLuat;
  nguoiChoi: {
    /** Mã người chơi trong ván — trùng mã tài khoản. */
    id: string;
    loaiVai: string;
    conSong: boolean;
    thuTuGhe: number;
    trangThaiKyNang: Record<string, unknown>;
  }[];
  luot: {
    soThuTu: number;
    hanhDong: {
      nguoiThucHienId: string;
      loaiHanhDong: string;
      mucTieuId: string | null;
      doUuTien: number;
      thoiDiem: Date;
    }[];
    ketQuaDem: { nguoiChoiId: string; nguyenNhan: string }[] | null;
    phien: {
      vong: number;
      ketQua: string;
      nguoiBiTreoId: string | null;
      phieu: { nguoiBauId: string; nguoiBiBauId: string | null }[];
    }[];
  }[];
  tinNhan: { nguoiGuiId: string; kenh: string; noiDung: string; thoiDiem: Date }[];
  nhatKy: { thuTu: number; loai: string; duLieu: Record<string, unknown>; thoiDiem: number }[];
  /** Điểm cộng cho từng tài khoản người thật (UC20) — tính ở DichVuLuuVan. */
  diemCong: { taiKhoanId: string; diem: number; thang: boolean }[];
}

export interface TomTatVan {
  vanId: string;
  ketThucLuc: Date;
  trangThai: string;
  pheThang: string | null;
  soNguoi: number;
  soLuot: number;
  loaiVai: string;
  thang: boolean;
}

export interface ChiTietVan {
  vanId: string;
  ketThucLuc: Date;
  trangThai: string;
  pheThang: string | null;
  nguoiChoi: {
    id: string;
    ten: string;
    loaiVai: string;
    conSong: boolean;
    thuTuGhe: number;
    laNguoiChoiAo: boolean;
  }[];
  nhatKy: { thuTu: number; loai: string; duLieu: Record<string, unknown>; thoiDiem: number }[];
}

export interface KhoVan {
  luuVan(van: VanDaKetThuc): Promise<string>;
  lichSuCua(taiKhoanId: string): Promise<TomTatVan[]>;
  layVan(vanId: string): Promise<ChiTietVan | null>;
  thongKe(): Promise<{ soVan: number; soVanDanThang: number; soVanSoiThang: number }>;
}

export interface DongXepHang {
  taiKhoanId: string;
  bietDanh: string;
  anhDaiDien: string;
  diem: number;
  soVan: number;
  soThang: number;
}

export interface KhoXepHang {
  /** Mùa đang diễn ra — tạo "Mùa 1" nếu chưa có. */
  muaHienTai(): Promise<{ id: string; ten: string; batDau: Date }>;
  bangXepHang(muaId: string): Promise<DongXepHang[]>;
}

export type TrangThaiBaoCao = 'CHO_XU_LY' | 'CANH_CAO' | 'KHOA_TAI_KHOAN' | 'BAC_BO';

export interface BaoCaoLuu {
  id: string;
  vanId: string;
  nguoiBaoCaoId: string;
  nguoiBiBaoCaoId: string;
  lyDo: string;
  trangThai: TrangThaiBaoCao;
  ghiChuXuLy: string | null;
  ngayTao: Date;
}

export interface KhoBaoCao {
  tao(du: {
    vanId: string;
    nguoiBaoCaoId: string;
    nguoiBiBaoCaoId: string;
    lyDo: string;
  }): Promise<BaoCaoLuu>;
  danhSach(): Promise<BaoCaoLuu[]>;
  timTheoId(id: string): Promise<BaoCaoLuu | null>;
  xuLy(
    id: string,
    du: { trangThai: TrangThaiBaoCao; ghiChu: string; nguoiXuLyId: string },
  ): Promise<BaoCaoLuu>;
}

/** Mọi kho, gom một chỗ để lắp ráp ở main.ts. */
export interface KhoDuLieu {
  taiKhoan: KhoTaiKhoan;
  phong: KhoPhong;
  van: KhoVan;
  xepHang: KhoXepHang;
  baoCao: KhoBaoCao;
}
