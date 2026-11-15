// UC22 xem xét báo cáo, UC23 khóa / mở khóa tài khoản, UC24 bảng điều khiển — chỉ quản trị viên
// (tác nhân AC03).
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type {
  BaoCaoLuu,
  HoSoLuu,
  KhoBaoCao,
  KhoTaiKhoan,
  KhoVan,
  TaiKhoanLuu,
  TrangThaiBaoCao,
} from '../kho/KhoDuLieu.js';

/** Người đang thao tác — lấy từ phiên. */
export interface NguoiThaoTac {
  id: string;
  laQuanTri: boolean;
}

/**
 * Cổng ngắt người bị khóa khỏi hệ thống thời gian thực (UC23) — tầng Socket.IO cài, tầng ứng dụng
 * không biết gì về socket. Đưa người đó ra khỏi phòng đang chờ cũng là việc của cổng này.
 */
export interface CongNgatKetNoi {
  ngat(taiKhoanId: string, lyDo: string): void;
}

export type QuyetDinhBaoCao = Exclude<TrangThaiBaoCao, 'CHO_XU_LY'>;

export interface TongQuan {
  soVan: number;
  soVanDanThang: number;
  soVanSoiThang: number;
  soNguoiChoi: number;
  soTaiKhoanBiKhoa: number;
  soBaoCaoChoXuLy: number;
}

export class DichVuQuanTri {
  constructor(
    private readonly khoTaiKhoan: KhoTaiKhoan,
    private readonly khoBaoCao: KhoBaoCao,
    private readonly khoVan: KhoVan,
    private readonly congNgat: CongNgatKetNoi,
  ) {}

  /** UC22 — mọi báo cáo, mới nhất trước. */
  danhSachBaoCao(nguoi: NguoiThaoTac): Promise<BaoCaoLuu[]> {
    this.chiQuanTri(nguoi);
    return this.khoBaoCao.danhSach();
  }

  /**
   * UC22 — ra quyết định cho một báo cáo đang chờ: cảnh cáo, bác bỏ, hoặc khóa tài khoản người
   * bị báo cáo (gọi luôn UC23). Báo cáo đã xử lý không xử lý lại.
   */
  async xuLyBaoCao(
    nguoi: NguoiThaoTac,
    baoCaoId: string,
    du: { quyetDinh: QuyetDinhBaoCao; ghiChu: string },
  ): Promise<BaoCaoLuu> {
    this.chiQuanTri(nguoi);
    const bc = await this.khoBaoCao.timTheoId(baoCaoId);
    if (!bc) throw new LoiNghiepVu('KHONG_TIM_THAY', `báo cáo ${baoCaoId}`);
    if (bc.trangThai !== 'CHO_XU_LY') throw new LoiNghiepVu('BAO_CAO_DA_XU_LY');
    if (du.quyetDinh === 'KHOA_TAI_KHOAN') await this.datKhoa(nguoi, bc.nguoiBiBaoCaoId, true);
    return this.khoBaoCao.xuLy(baoCaoId, {
      trangThai: du.quyetDinh,
      ghiChu: du.ghiChu.trim(),
      nguoiXuLyId: nguoi.id,
    });
  }

  /**
   * UC23 — khóa hoặc mở khóa. Không tự khóa mình, không khóa quản trị viên khác. Khóa xong thì
   * người đó bị ngắt kết nối ngay và không đăng nhập lại được (`timPhien` trả null).
   */
  async datKhoa(nguoi: NguoiThaoTac, taiKhoanId: string, biKhoa: boolean): Promise<void> {
    this.chiQuanTri(nguoi);
    const tk = await this.khoTaiKhoan.timTheoId(taiKhoanId);
    if (!tk || tk.laNguoiChoiAo) throw new LoiNghiepVu('KHONG_TIM_THAY', `tài khoản ${taiKhoanId}`);
    if (biKhoa && (tk.id === nguoi.id || tk.laQuanTri)) {
      throw new LoiNghiepVu('KHONG_KHOA_QUAN_TRI');
    }
    await this.khoTaiKhoan.datKhoa(taiKhoanId, biKhoa);
    if (biKhoa) this.congNgat.ngat(taiKhoanId, 'Tài khoản của bạn đã bị quản trị viên khóa.');
  }

  /** UC23 — danh sách tài khoản người thật kèm hồ sơ. */
  async danhSachTaiKhoan(nguoi: NguoiThaoTac): Promise<(TaiKhoanLuu & { hoSo: HoSoLuu | null })[]> {
    this.chiQuanTri(nguoi);
    return this.khoTaiKhoan.danhSach();
  }

  /** UC24 — số ván, số người chơi, báo cáo chờ xử lý, ván thắng theo phe. */
  async tongQuan(nguoi: NguoiThaoTac): Promise<TongQuan> {
    this.chiQuanTri(nguoi);
    const [thongKe, taiKhoan, baoCao] = await Promise.all([
      this.khoVan.thongKe(),
      this.khoTaiKhoan.danhSach(),
      this.khoBaoCao.danhSach(),
    ]);
    return {
      ...thongKe,
      soNguoiChoi: taiKhoan.length,
      soTaiKhoanBiKhoa: taiKhoan.filter((t) => t.biKhoa).length,
      soBaoCaoChoXuLy: baoCao.filter((b) => b.trangThai === 'CHO_XU_LY').length,
    };
  }

  private chiQuanTri(nguoi: NguoiThaoTac): void {
    if (!nguoi.laQuanTri) throw new LoiNghiepVu('KHONG_CO_QUYEN', 'chỉ quản trị viên');
  }
}
