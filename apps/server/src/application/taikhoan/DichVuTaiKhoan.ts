import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type { HoSoLuu, KhoTaiKhoan } from '../kho/KhoDuLieu.js';
import { TaiKhoan, type BoMatKhau } from './TaiKhoan.js';

/** Ràng buộc tài khoản — người dùng chốt ngày 15/11/2026. */
export const RANG_BUOC_TAI_KHOAN = {
  tenDangNhap: /^[a-z0-9_]{3,20}$/,
  matKhauToiThieu: 8,
  bietDanh: { toiThieu: 2, toiDa: 24 },
} as const;

const ANH_DAI_DIEN = ['Soi', 'BaoVe', 'TienTri', 'PhuThuy', 'ThoSan', 'DanLang'];

export interface ThongTinPhien {
  id: string;
  tenDangNhap: string;
  bietDanh: string;
  anhDaiDien: string;
  laQuanTri: boolean;
}

function kiemBietDanh(bietDanh: string): string {
  const ten = bietDanh.trim().replace(/\s+/g, ' ');
  const { toiThieu, toiDa } = RANG_BUOC_TAI_KHOAN.bietDanh;
  if (ten.length < toiThieu || ten.length > toiDa) {
    throw new LoiNghiepVu('BIET_DANH_KHONG_HOP_LE', `${toiThieu}–${toiDa} ký tự`);
  }
  return ten;
}

/**
 * Dịch vụ tài khoản — UC01 đăng ký, UC02 đăng nhập, UC03 cập nhật hồ sơ. Không biết HTTP hay
 * cookie; tầng `interface` lo phiên.
 */
export class DichVuTaiKhoan {
  constructor(
    private readonly kho: KhoTaiKhoan,
    private readonly boMatKhau: BoMatKhau,
  ) {}

  /** UC01 — khách tạo tài khoản; mật khẩu chỉ lưu bản băm. */
  async dangKy(tenDangNhap: string, bietDanh: string, matKhau: string): Promise<ThongTinPhien> {
    if (!RANG_BUOC_TAI_KHOAN.tenDangNhap.test(tenDangNhap)) {
      throw new LoiNghiepVu('TEN_DANG_NHAP_KHONG_HOP_LE', tenDangNhap);
    }
    if (matKhau.length < RANG_BUOC_TAI_KHOAN.matKhauToiThieu) {
      throw new LoiNghiepVu('MAT_KHAU_QUA_NGAN');
    }
    const ten = kiemBietDanh(bietDanh);
    if (await this.kho.timTheoTen(tenDangNhap)) throw new LoiNghiepVu('TRUNG_TEN_DANG_NHAP');
    const banGhi = await this.kho.tao({
      tenDangNhap,
      bietDanh: ten,
      matKhauBam: await this.boMatKhau.bam(matKhau),
    });
    return this.layPhien(banGhi.id);
  }

  /** UC02 — tài khoản bị khóa (UC23) không đăng nhập được. Sai tên hay sai mật khẩu báo chung. */
  async dangNhap(tenDangNhap: string, matKhau: string): Promise<ThongTinPhien> {
    const banGhi = await this.kho.timTheoTen(tenDangNhap);
    const taiKhoan = banGhi && !banGhi.laNguoiChoiAo ? new TaiKhoan(banGhi) : null;
    if (!taiKhoan || !(await taiKhoan.xacThuc(matKhau, this.boMatKhau))) {
      throw new LoiNghiepVu('SAI_DANG_NHAP');
    }
    if (taiKhoan.biKhoa) throw new LoiNghiepVu('TAI_KHOAN_BI_KHOA');
    return this.layPhien(taiKhoan.id);
  }

  /** Thông tin phiên của một tài khoản còn hiệu lực — `null` nếu không có hoặc đã bị khóa. */
  async timPhien(taiKhoanId: string): Promise<ThongTinPhien | null> {
    const banGhi = await this.kho.timTheoId(taiKhoanId);
    if (!banGhi || banGhi.biKhoa || banGhi.laNguoiChoiAo) return null;
    return this.layPhien(taiKhoanId);
  }

  /** UC03 — đổi biệt danh và ảnh đại diện (một trong sáu tranh thẻ vai). */
  async capNhatHoSo(
    taiKhoanId: string,
    du: { bietDanh?: string | undefined; anhDaiDien?: string | undefined },
  ): Promise<HoSoLuu> {
    if (du.anhDaiDien !== undefined && !ANH_DAI_DIEN.includes(du.anhDaiDien)) {
      throw new LoiNghiepVu('LUA_CHON_KHONG_HOP_LE', 'ảnh đại diện');
    }
    return this.kho.capNhatHoSo(taiKhoanId, {
      ...(du.bietDanh !== undefined ? { bietDanh: kiemBietDanh(du.bietDanh) } : {}),
      ...(du.anhDaiDien !== undefined ? { anhDaiDien: du.anhDaiDien } : {}),
    });
  }

  async layHoSo(taiKhoanId: string): Promise<HoSoLuu> {
    const hs = await this.kho.layHoSo(taiKhoanId);
    if (!hs) throw new LoiNghiepVu('KHONG_TIM_THAY', 'hồ sơ');
    return hs;
  }

  private async layPhien(id: string): Promise<ThongTinPhien> {
    const banGhi = (await this.kho.timTheoId(id))!;
    const hs = await this.layHoSo(id);
    return {
      id,
      tenDangNhap: banGhi.tenDangNhap,
      bietDanh: hs.bietDanh,
      anhDaiDien: hs.anhDaiDien,
      laQuanTri: banGhi.laQuanTri,
    };
  }
}
