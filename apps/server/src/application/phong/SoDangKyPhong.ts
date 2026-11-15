import type {
  LoaiVaiCongKhai,
  PhongCongKhai,
  TomTatPhong,
  TrangThaiPhongCongKhai,
} from '@moonvillage/shared';
import { LoaiVai } from '../../domain/chung/LoaiVai.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import { MaQuyTac } from '../../domain/chung/MaQuyTac.js';
import { CauHinhVai } from '../../domain/luat/CauHinhVai.js';
import type { NguonNgauNhien } from '../../domain/chung/NguonNgauNhien.js';
import { PhongChoi, TrangThaiPhong } from '../../domain/phong/PhongChoi.js';
import type { KhoDuLieu } from '../kho/KhoDuLieu.js';
import type { SoDangKyVan } from '../van/SoDangKyVan.js';
import type { ThongTinPhien } from '../taikhoan/DichVuTaiKhoan.js';

/** Bảng chữ của mã phòng — bỏ 0/O, 1/I/L cho dễ đọc to. */
const CHU_MA_PHONG = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const DO_DAI_MA_PHONG = 6;

interface PhongDangMo {
  phong: PhongChoi;
  /** Khóa chính bảng phong_choi. */
  phongId: string;
  anhDaiDien: Map<string, string>;
  vanId: string | null;
}

export interface PhuThuocSoDangKy {
  kho: Pick<KhoDuLieu, 'taiKhoan' | 'phong'>;
  nguonNgauNhien: NguonNgauNhien;
  /** Biến môi trường CHO_PHEP_NGUOI_CHOI_AO (ROADMAP 4.5). */
  choPhepNguoiChoiAo: boolean;
  /** Sổ ván — có thì phòng bắt đầu được ván (4.6). */
  soDangKyVan?: SoDangKyVan;
}

/**
 * Sổ đăng ký phòng đang mở — sống trong bộ nhớ tiến trình (ARCHITECTURE mục 12: ranh giới bộ nhớ –
 * cơ sở dữ liệu); cơ sở dữ liệu chỉ lưu bản ghi phòng. Mỗi tài khoản ở tối đa một phòng. Mỗi lần
 * phòng đổi, báo cho người nghe (mẫu Observer) — tầng Socket.IO phát `phong:cap-nhat`.
 */
export class SoDangKyPhong {
  private readonly phong = new Map<string, PhongDangMo>();
  private readonly phongCuaNguoi = new Map<string, string>();
  private readonly ketNoi = new Set<string>();
  /** Người chơi ảo đang ngồi trong phòng nào — một tài khoản ảo chỉ ở một phòng. */
  private readonly nguoiAo = new Map<string, string>();
  private readonly nguoiNghe = new Set<(maPhong: string) => void>();

  constructor(private readonly phu: PhuThuocSoDangKy) {
    phu.soDangKyVan?.dangKyKetThuc((v) => this.khiVanKetThuc(v.maPhong));
  }

  /**
   * UC11 — chủ phòng bắt đầu ván. Phòng khóa (không ai vào thêm) tới khi ván kết thúc; bản ghi
   * phòng trong cơ sở dữ liệu nhận trạng thái, bộ vai và bộ luật lúc bắt đầu.
   */
  batDauVan(maPhong: string, chuPhongId: string): string {
    if (!this.phu.soDangKyVan) throw new LoiNghiepVu('KHONG_CO_QUYEN', 'máy chủ chưa bật ván');
    const p = this.lay(maPhong);
    const v = this.phu.soDangKyVan.batDau(p.phong, chuPhongId, (id) => this.nguoiAo.has(id));
    p.vanId = v.vanId;
    void this.phu.kho.phong
      .capNhatPhong(p.phongId, {
        trangThai: p.phong.trangThai,
        cauHinhVai: p.phong.layCauHinhVai().layDanhSach(),
        boLuat: p.phong.layBoLuat().layGiaTri(),
      })
      .catch((loi) => console.error('Không cập nhật được phòng', loi));
    this.bao(maPhong);
    return v.vanId;
  }

  /** Khóa chính bảng phong_choi của phòng — để lưu ván (4.10). */
  phongIdCua(maPhong: string): string {
    return this.lay(maPhong).phongId;
  }

  private khiVanKetThuc(maPhong: string): void {
    const p = this.phong.get(maPhong);
    if (!p) return;
    p.phong.ketThucVan();
    p.vanId = null;
    this.bao(maPhong);
  }

  /** Đăng ký nghe phòng đổi; trả hàm hủy. */
  dangKy(nghe: (maPhong: string) => void): () => void {
    this.nguoiNghe.add(nghe);
    return () => this.nguoiNghe.delete(nghe);
  }

  /** UC06 — tạo phòng, người tạo làm chủ phòng. Đang ở phòng khác thì rời phòng đó trước. */
  async taoPhong(phien: ThongTinPhien): Promise<string> {
    this.roiPhongHienTai(phien.id);
    let ma: string;
    do {
      ma = Array.from(
        { length: DO_DAI_MA_PHONG },
        () => CHU_MA_PHONG[this.phu.nguonNgauNhien.soNguyen(CHU_MA_PHONG.length)],
      ).join('');
    } while (this.phong.has(ma));
    const phong = new PhongChoi(ma, {
      taiKhoanId: phien.id,
      ten: phien.bietDanh,
      laNguoiChoiAo: false,
    });
    const phongId = await this.phu.kho.phong.taoPhong(ma, phien.id);
    this.phong.set(ma, {
      phong,
      phongId,
      anhDaiDien: new Map([[phien.id, phien.anhDaiDien]]),
      vanId: null,
    });
    this.phongCuaNguoi.set(phien.id, ma);
    this.bao(ma);
    return ma;
  }

  /** UC07 — vào phòng bằng mã. Đang ở phòng khác thì rời phòng đó trước. */
  vaoPhong(maPhong: string, phien: ThongTinPhien): void {
    const p = this.lay(maPhong);
    const ma = p.phong.maPhong;
    if (this.phongCuaNguoi.get(phien.id) !== ma) this.roiPhongHienTai(phien.id);
    p.phong.themThanhVien({ taiKhoanId: phien.id, ten: phien.bietDanh, laNguoiChoiAo: false });
    p.anhDaiDien.set(phien.id, phien.anhDaiDien);
    this.phongCuaNguoi.set(phien.id, ma);
    this.bao(ma);
  }

  /** Rời phòng (Q11 trong `PhongChoi.roiPhong`). Đang chơi thì không rời phòng được — BR13. */
  roiPhong(maPhong: string, taiKhoanId: string): void {
    const p = this.lay(maPhong);
    if (p.phong.trangThai === TrangThaiPhong.DANG_CHOI) throw new LoiNghiepVu('PHONG_DA_BAT_DAU');
    this.boKhoiPhong(maPhong, taiKhoanId);
  }

  /** UC10 — chủ phòng loại người. */
  loai(maPhong: string, chuPhongId: string, taiKhoanId: string): void {
    const p = this.lay(maPhong);
    p.phong.loaiThanhVien(chuPhongId, taiKhoanId);
    this.phongCuaNguoi.delete(taiKhoanId);
    this.nguoiAo.delete(taiKhoanId);
    this.bao(maPhong);
  }

  /**
   * UC08 — chủ phòng đặt số lượng từng vai. Nhận dữ liệu thô từ ngoài: chỉ các loại vai đã biết,
   * số nguyên không âm. Hợp lệ với số người hay không thì báo trong `chieu().viPham`.
   */
  datCauHinhVai(maPhong: string, chuPhongId: string, soLuong: Record<string, unknown>): void {
    const sach: Partial<Record<LoaiVai, number>> = {};
    for (const [loai, so] of Object.entries(soLuong)) {
      if (!Object.values(LoaiVai).includes(loai as LoaiVai)) {
        throw new LoiNghiepVu('CAU_HINH_VAI_KHONG_HOP_LE', `không có vai ${loai}`);
      }
      if (
        typeof so !== 'number' ||
        !Number.isInteger(so) ||
        so < 0 ||
        so > PhongChoi.SO_NGUOI_TOI_DA
      ) {
        throw new LoiNghiepVu('CAU_HINH_VAI_KHONG_HOP_LE', `${loai}=${String(so)}`);
      }
      sach[loai as LoaiVai] = so;
    }
    this.lay(maPhong).phong.datCauHinhVai(chuPhongId, new CauHinhVai(sach));
    this.bao(maPhong);
  }

  /** Gợi ý bộ vai mặc định cho số người hiện có (`CauHinhVai.macDinh`). */
  goiYCauHinhVai(maPhong: string, chuPhongId: string): void {
    const { phong } = this.lay(maPhong);
    const n = Math.max(
      CauHinhVai.SO_NGUOI_TOI_THIEU,
      Math.min(PhongChoi.SO_NGUOI_TOI_DA, phong.layThanhVien().length),
    );
    phong.datCauHinhVai(chuPhongId, CauHinhVai.macDinh(n));
    this.bao(maPhong);
  }

  /** UC25 — bật tắt một quy tắc tùy biến; quy tắc cố định bị từ chối (`QUY_TAC_CO_DINH`). */
  datQuyTac(maPhong: string, chuPhongId: string, maQuyTac: string, dangBat: boolean): void {
    if (!Object.values(MaQuyTac).includes(maQuyTac as MaQuyTac)) {
      throw new LoiNghiepVu('QUY_TAC_CO_DINH', maQuyTac);
    }
    this.lay(maPhong).phong.datQuyTac(chuPhongId, maQuyTac as MaQuyTac, dangBat);
    this.bao(maPhong);
  }

  /**
   * ROADMAP 4.5 — chủ phòng thêm một người chơi ảo (chỉ khi máy chủ bật CHO_PHEP_NGUOI_CHOI_AO).
   * Người ảo dùng tài khoản riêng `ao_NN`, đi chung luồng với người thật khi chơi (nguyên tắc 2.5).
   */
  async themNguoiChoiAo(maPhong: string, chuPhongId: string): Promise<void> {
    if (!this.phu.choPhepNguoiChoiAo) throw new LoiNghiepVu('NGUOI_CHOI_AO_BI_TAT');
    const p = this.lay(maPhong);
    if (p.phong.maChuPhong !== chuPhongId) throw new LoiNghiepVu('KHONG_PHAI_CHU_PHONG');
    if (p.phong.layThanhVien().length >= PhongChoi.SO_NGUOI_TOI_DA)
      throw new LoiNghiepVu('PHONG_DA_DAY');
    let thuTu = 1;
    for (;;) {
      const tk = await this.phu.kho.taiKhoan.layNguoiChoiAo(thuTu);
      if (!this.nguoiAo.has(tk.id)) {
        const hs = await this.phu.kho.taiKhoan.layHoSo(tk.id);
        p.phong.themThanhVien({
          taiKhoanId: tk.id,
          ten: hs?.bietDanh ?? tk.tenDangNhap,
          laNguoiChoiAo: true,
        });
        p.anhDaiDien.set(tk.id, hs?.anhDaiDien ?? 'DanLang');
        this.nguoiAo.set(tk.id, maPhong);
        break;
      }
      thuTu += 1;
    }
    this.bao(maPhong);
  }

  /** Chủ phòng bớt người chơi ảo vào sau cùng. */
  botNguoiChoiAo(maPhong: string, chuPhongId: string): void {
    const p = this.lay(maPhong);
    if (p.phong.maChuPhong !== chuPhongId) throw new LoiNghiepVu('KHONG_PHAI_CHU_PHONG');
    const ao = [...p.phong.layThanhVien()].reverse().find((t) => t.laNguoiChoiAo);
    if (!ao) return;
    p.phong.loaiThanhVien(chuPhongId, ao.taiKhoanId);
    this.nguoiAo.delete(ao.taiKhoanId);
    this.bao(maPhong);
  }

  laNguoiChoiAo(taiKhoanId: string): boolean {
    return this.nguoiAo.has(taiKhoanId);
  }

  datCongKhai(maPhong: string, chuPhongId: string, congKhai: boolean): void {
    this.lay(maPhong).phong.datCongKhai(chuPhongId, congKhai);
    this.bao(maPhong);
  }

  /** BR13 — tầng thời gian thực báo người chơi có/mất kết nối. */
  datKetNoi(taiKhoanId: string, coKetNoi: boolean): void {
    if (coKetNoi) this.ketNoi.add(taiKhoanId);
    else this.ketNoi.delete(taiKhoanId);
    const ma = this.phongCuaNguoi.get(taiKhoanId);
    if (ma) this.bao(ma);
  }

  coKetNoi(taiKhoanId: string): boolean {
    return this.ketNoi.has(taiKhoanId);
  }

  /** Phòng còn mở không — người nghe kiểm trước khi `chieu()`, vì phòng trống tự đóng (Q11). */
  coPhong(maPhong: string): boolean {
    return this.phong.has(maPhong.toUpperCase());
  }

  phongCua(taiKhoanId: string): string | null {
    return this.phongCuaNguoi.get(taiKhoanId) ?? null;
  }

  layPhong(maPhong: string): PhongChoi {
    return this.lay(maPhong).phong;
  }

  /** Mọi thành viên phòng — người nhận `phong:cap-nhat`. */
  thanhVienCua(maPhong: string): string[] {
    return this.lay(maPhong)
      .phong.layThanhVien()
      .map((t) => t.taiKhoanId);
  }

  /** Phòng công khai đang chờ và chưa đầy — trang chủ (MH02). */
  danhSachCongKhai(): TomTatPhong[] {
    return [...this.phong.values()]
      .filter(
        ({ phong }) =>
          phong.congKhai &&
          phong.trangThai === TrangThaiPhong.CHO &&
          phong.layThanhVien().length < PhongChoi.SO_NGUOI_TOI_DA,
      )
      .map(({ phong }) => ({
        maPhong: phong.maPhong,
        tenChuPhong: phong.layThanhVien().find((t) => t.taiKhoanId === phong.maChuPhong)!.ten,
        soNguoi: phong.layThanhVien().length,
        soNguoiToiDa: PhongChoi.SO_NGUOI_TOI_DA,
      }));
  }

  /** Ảnh chụp công khai của phòng — không có vai của ai (vai chỉ có trong góc nhìn ván). */
  chieu(maPhong: string): PhongCongKhai {
    const p = this.lay(maPhong);
    const { phong } = p;
    return {
      maPhong,
      chuPhongId: phong.maChuPhong,
      trangThai: phong.trangThai as TrangThaiPhongCongKhai,
      congKhai: phong.congKhai,
      thanhVien: phong.layThanhVien().map((t) => ({
        id: t.taiKhoanId,
        ten: t.ten,
        anhDaiDien: p.anhDaiDien.get(t.taiKhoanId) ?? 'DanLang',
        laNguoiChoiAo: t.laNguoiChoiAo,
        laChuPhong: t.taiKhoanId === phong.maChuPhong,
        ketNoi: t.laNguoiChoiAo || this.ketNoi.has(t.taiKhoanId),
      })),
      soNguoiToiDa: PhongChoi.SO_NGUOI_TOI_DA,
      cauHinhVai: phong.layCauHinhVai().layDanhSach() as Record<LoaiVaiCongKhai, number>,
      viPham: phong.kiemTraBatDau().map((v) => ({
        ma: v.ma,
        chiTiet: v.chiTiet,
        ...(v.loaiVai ? { loaiVai: v.loaiVai as LoaiVaiCongKhai } : {}),
      })),
      boLuat: phong
        .layBoLuat()
        .layMoTa()
        .map((q) => ({ ma: q.ma, dangBat: q.dangBat, noiDung: q.noiDung })),
      choPhepNguoiChoiAo: this.phu.choPhepNguoiChoiAo,
      vanId: p.vanId,
    };
  }

  protected lay(maPhong: string): PhongDangMo {
    const p = this.phong.get(maPhong.toUpperCase());
    if (!p) throw new LoiNghiepVu('KHONG_TIM_THAY_PHONG');
    return p;
  }

  protected bao(maPhong: string): void {
    for (const nghe of this.nguoiNghe) nghe(maPhong);
  }

  private roiPhongHienTai(taiKhoanId: string): void {
    const ma = this.phongCuaNguoi.get(taiKhoanId);
    if (!ma) return;
    const p = this.phong.get(ma);
    if (p && p.phong.trangThai === TrangThaiPhong.DANG_CHOI)
      throw new LoiNghiepVu('PHONG_DA_BAT_DAU');
    this.boKhoiPhong(ma, taiKhoanId);
  }

  private boKhoiPhong(maPhong: string, taiKhoanId: string): void {
    const p = this.lay(maPhong);
    const dong = p.phong.roiPhong(taiKhoanId);
    this.phongCuaNguoi.delete(taiKhoanId);
    if (dong) {
      for (const [id, ma] of this.nguoiAo) if (ma === maPhong) this.nguoiAo.delete(id);
      this.phong.delete(maPhong);
    }
    this.bao(maPhong);
  }
}
