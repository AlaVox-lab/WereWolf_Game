import type {
  LoaiVaiCongKhai,
  PhongCongKhai,
  TomTatPhong,
  TrangThaiPhongCongKhai,
} from '@moonvillage/shared';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type { NguonNgauNhien } from '../../domain/chung/NguonNgauNhien.js';
import { PhongChoi, TrangThaiPhong } from '../../domain/phong/PhongChoi.js';
import type { KhoDuLieu } from '../kho/KhoDuLieu.js';
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
  private readonly nguoiNghe = new Set<(maPhong: string) => void>();

  constructor(private readonly phu: PhuThuocSoDangKy) {}

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
    this.bao(maPhong);
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
    if (dong) this.phong.delete(maPhong);
    this.bao(maPhong);
  }
}
