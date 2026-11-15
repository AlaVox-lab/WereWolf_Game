import type { TaiKhoanLuu } from '../kho/KhoDuLieu.js';

/**
 * Cổng băm mật khẩu — bản cài bcryptjs ở `infrastructure/auth/matKhau.ts`. Tầng ứng dụng không
 * biết thuật toán băm.
 */
export interface BoMatKhau {
  bam(matKhau: string): Promise<string>;
  so(matKhau: string, banBam: string): Promise<boolean>;
}

/**
 * Tài khoản người dùng (lớp `TaiKhoan` trên Class Diagram). Khái niệm quản lý người dùng, không
 * thuộc luật chơi nên không nằm trong `domain/` (ARCHITECTURE mục 5.4). `NguoiChoi` trong ván chỉ
 * mang mã tài khoản.
 */
export class TaiKhoan {
  readonly id: string;
  readonly tenDangNhap: string;
  readonly laQuanTri: boolean;
  readonly biKhoa: boolean;
  private readonly matKhauBam: string;

  constructor(banGhi: TaiKhoanLuu) {
    this.id = banGhi.id;
    this.tenDangNhap = banGhi.tenDangNhap;
    this.laQuanTri = banGhi.laQuanTri;
    this.biKhoa = banGhi.biKhoa;
    this.matKhauBam = banGhi.matKhauBam;
  }

  /** So mật khẩu nhập vào với bản băm đã lưu (UC02). */
  xacThuc(mk: string, boMatKhau: BoMatKhau): Promise<boolean> {
    return boMatKhau.so(mk, this.matKhauBam);
  }
}
