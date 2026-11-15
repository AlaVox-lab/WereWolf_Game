import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import type { MaQuyTac } from '../chung/MaQuyTac.js';
import { BoLuatChoi } from '../luat/BoLuatChoi.js';
import { CauHinhVai, type ViPhamCauHinh } from '../luat/CauHinhVai.js';
import { NguoiChoi } from '../van/NguoiChoi.js';
import { VanDau } from '../van/VanDau.js';

export enum TrangThaiPhong {
  CHO = 'CHO',
  DANG_CHOI = 'DANG_CHOI',
  DA_DONG = 'DA_DONG',
}

export interface ThanhVienPhong {
  taiKhoanId: string;
  ten: string;
  laNguoiChoiAo: boolean;
}

/**
 * Phòng chơi (UC06–UC11, UC25). Giữ thành viên theo **thứ tự vào phòng** — cũng là thứ tự ghế khi
 * bắt đầu ván và thứ tự chọn chủ phòng mới (Q11). Bộ luật của phòng sửa được khi chưa chơi; ván
 * nhận bản `saoChep()` đã khóa (nguyên tắc 2.3, TC20).
 */
export class PhongChoi {
  static readonly SO_NGUOI_TOI_DA = CauHinhVai.SO_NGUOI_TOI_DA;

  private readonly thanhVien: ThanhVienPhong[] = [];
  private chuPhongId: string;
  private trangThaiPhong = TrangThaiPhong.CHO;
  private cauHinhVai: CauHinhVai;
  private readonly boLuatChoi = new BoLuatChoi();
  /** Phòng hiện trong danh sách công khai ở trang chủ (MH02). */
  congKhai = false;

  constructor(
    readonly maPhong: string,
    chuPhong: ThanhVienPhong,
  ) {
    if (chuPhong.laNguoiChoiAo)
      throw new LoiNghiepVu('KHONG_CO_QUYEN', 'người chơi ảo làm chủ phòng');
    this.thanhVien.push({ ...chuPhong });
    this.chuPhongId = chuPhong.taiKhoanId;
    this.cauHinhVai = CauHinhVai.macDinh(CauHinhVai.SO_NGUOI_TOI_THIEU);
  }

  get trangThai(): TrangThaiPhong {
    return this.trangThaiPhong;
  }

  get maChuPhong(): string {
    return this.chuPhongId;
  }

  layThanhVien(): readonly ThanhVienPhong[] {
    return this.thanhVien;
  }

  coThanhVien(taiKhoanId: string): boolean {
    return this.thanhVien.some((t) => t.taiKhoanId === taiKhoanId);
  }

  layCauHinhVai(): CauHinhVai {
    return this.cauHinhVai;
  }

  layBoLuat(): BoLuatChoi {
    return this.boLuatChoi;
  }

  /** UC07 — vào phòng đang chờ và chưa đầy. Vào lại khi đã ở trong phòng thì không đổi gì. */
  themThanhVien(tv: ThanhVienPhong): void {
    if (this.coThanhVien(tv.taiKhoanId)) return;
    this.chiKhiCho();
    if (this.thanhVien.length >= PhongChoi.SO_NGUOI_TOI_DA) throw new LoiNghiepVu('PHONG_DA_DAY');
    this.thanhVien.push({ ...tv });
  }

  /**
   * Rời phòng. Chủ phòng rời khi chưa chơi thì quyền chuyển cho **người thật** vào sớm nhất còn lại;
   * không còn người thật thì phòng đóng (Q11). Trả `true` nếu phòng vừa đóng.
   */
  roiPhong(taiKhoanId: string): boolean {
    const viTri = this.thanhVien.findIndex((t) => t.taiKhoanId === taiKhoanId);
    if (viTri < 0) throw new LoiNghiepVu('KHONG_O_TRONG_PHONG');
    this.thanhVien.splice(viTri, 1);
    const nguoiThat = this.thanhVien.filter((t) => !t.laNguoiChoiAo);
    if (nguoiThat.length === 0) {
      this.thanhVien.length = 0;
      this.trangThaiPhong = TrangThaiPhong.DA_DONG;
      return true;
    }
    if (taiKhoanId === this.chuPhongId) this.chuPhongId = nguoiThat[0]!.taiKhoanId;
    return false;
  }

  /** UC10 — chủ phòng loại một người khi ván chưa bắt đầu. */
  loaiThanhVien(nguoiYeuCauId: string, taiKhoanId: string): void {
    this.chiChuPhong(nguoiYeuCauId);
    this.chiKhiCho();
    if (taiKhoanId === this.chuPhongId) throw new LoiNghiepVu('KHONG_CO_QUYEN', 'tự loại mình');
    this.roiPhong(taiKhoanId);
  }

  /** UC08 — chủ phòng đặt bộ vai. Kiểm hợp lệ để ở `kiemTraBatDau()`, giao diện báo tức thời. */
  datCauHinhVai(nguoiYeuCauId: string, cauHinh: CauHinhVai): void {
    this.chiChuPhong(nguoiYeuCauId);
    this.chiKhiCho();
    this.cauHinhVai = cauHinh;
  }

  /** UC25 — chủ phòng bật tắt quy tắc tùy biến; bị chặn khi ván đã bắt đầu. */
  datQuyTac(nguoiYeuCauId: string, maQuyTac: MaQuyTac, dangBat: boolean): void {
    this.chiChuPhong(nguoiYeuCauId);
    this.chiKhiCho();
    this.boLuatChoi.datQuyTac(maQuyTac, dangBat);
  }

  datCongKhai(nguoiYeuCauId: string, congKhai: boolean): void {
    this.chiChuPhong(nguoiYeuCauId);
    this.congKhai = congKhai;
  }

  /** Vi phạm cản việc bắt đầu ván với số người hiện có (UC11 luồng 3a). */
  kiemTraBatDau(): ViPhamCauHinh[] {
    return this.cauHinhVai.kiemTraHopLe(this.thanhVien.length);
  }

  /**
   * UC11 — chủ phòng bắt đầu ván: dựng `VanDau` với người chơi theo thứ tự vào phòng. Mã người
   * chơi trong ván trùng mã tài khoản. Phòng khóa (`DANG_CHOI`) tới khi `ketThucVan()`.
   */
  batDauVan(nguoiYeuCauId: string, vanId: string): VanDau {
    this.chiChuPhong(nguoiYeuCauId);
    this.chiKhiCho();
    const viPham = this.kiemTraBatDau();
    if (viPham.length) {
      throw new LoiNghiepVu('CAU_HINH_VAI_KHONG_HOP_LE', viPham.map((v) => v.ma).join(','));
    }
    const nguoiChoi = this.thanhVien.map(
      (t, i) => new NguoiChoi(t.taiKhoanId, t.taiKhoanId, i + 1),
    );
    const van = new VanDau(vanId, this.maPhong, nguoiChoi, this.boLuatChoi);
    this.trangThaiPhong = TrangThaiPhong.DANG_CHOI;
    return van;
  }

  /** Ván xong hoặc bị hủy — phòng mở lại để chơi ván mới với cùng nhóm. */
  ketThucVan(): void {
    if (this.trangThaiPhong === TrangThaiPhong.DANG_CHOI) this.trangThaiPhong = TrangThaiPhong.CHO;
  }

  private chiChuPhong(taiKhoanId: string): void {
    if (taiKhoanId !== this.chuPhongId) throw new LoiNghiepVu('KHONG_PHAI_CHU_PHONG');
  }

  private chiKhiCho(): void {
    if (this.trangThaiPhong === TrangThaiPhong.DANG_CHOI) throw new LoiNghiepVu('PHONG_DA_BAT_DAU');
    if (this.trangThaiPhong === TrangThaiPhong.DA_DONG)
      throw new LoiNghiepVu('KHONG_TIM_THAY_PHONG');
  }
}
