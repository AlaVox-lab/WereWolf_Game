import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import type { Phe } from '../chung/Phe.js';
import type { TrangThaiVan } from '../chung/TrangThaiVan.js';
import type { BoLuatChoi } from '../luat/BoLuatChoi.js';
import { CauHinhVai } from '../luat/CauHinhVai.js';
import type { VanChiDoc } from '../vaitro/NguCanhHanhDong.js';
import { LuotChoi } from './LuotChoi.js';
import type { NguoiChoi } from './NguoiChoi.js';
import type { NguyenNhanChet } from './NguyenNhanChet.js';
import { NhatKyVan } from './NhatKyVan.js';
import {
  ChoDuNguoi,
  type SuKienChuyenPha,
  type TrangThaiVanDau,
} from './trangthai/TrangThaiVanDau.js';

/**
 * Một ván đấu cụ thể — khớp bảng `van_dau`. Khớp giao diện `VanChiDoc` mà phân cấp `VaiTro` đọc.
 *
 * **Bộ luật bất biến** (nguyên tắc 2.3): constructor nhận bộ luật của phòng và tự giữ bản
 * `saoChep()` đã khóa — ván không bao giờ cầm tham chiếu tới bộ luật của phòng.
 *
 * **Mẫu State**: ván giữ một đối tượng `TrangThaiVanDau`; mọi lần đổi pha đi qua `chuyenPha()`,
 * `ketThuc()` hoặc `huyVan()` — chuyển tiếp không có trên sơ đồ 11.1 ném lỗi.
 */
export class VanDau implements VanChiDoc {
  readonly boLuatChoi: BoLuatChoi;
  readonly nhatKy = new NhatKyVan();
  private readonly danhSachNguoiChoi: readonly NguoiChoi[];
  private readonly danhSachLuot: LuotChoi[] = [];
  private trangThaiHienTai: TrangThaiVanDau = new ChoDuNguoi();
  private phe: Phe | null = null;

  constructor(
    readonly id: string,
    readonly phongId: string,
    nguoiChoi: readonly NguoiChoi[],
    boLuatPhong: BoLuatChoi,
  ) {
    const { SO_NGUOI_TOI_THIEU: toiThieu, SO_NGUOI_TOI_DA: toiDa } = CauHinhVai;
    if (nguoiChoi.length < toiThieu || nguoiChoi.length > toiDa) {
      throw new LoiNghiepVu(
        'SO_NGUOI_KHONG_HOP_LE',
        `cần ${toiThieu}–${toiDa}, có ${nguoiChoi.length}`,
      );
    }
    // Ràng buộc toàn vẹn 12.3: một tài khoản tối đa một bản ghi người chơi mỗi ván.
    const trung = (khoa: (n: NguoiChoi) => unknown) =>
      new Set(nguoiChoi.map(khoa)).size !== nguoiChoi.length;
    if (trung((n) => n.id) || trung((n) => n.taiKhoanId) || trung((n) => n.thuTuGhe)) {
      throw new LoiNghiepVu('TRUNG_NGUOI_CHOI', 'trùng mã người chơi, tài khoản hoặc ghế');
    }
    this.danhSachNguoiChoi = [...nguoiChoi].sort((a, b) => a.thuTuGhe - b.thuTuGhe);
    this.boLuatChoi = boLuatPhong.saoChep();
  }

  get trangThai(): TrangThaiVan {
    return this.trangThaiHienTai.ma;
  }

  /** Phe thắng — `null` khi ván chưa kết thúc hoặc bị hủy. */
  get pheThang(): Phe | null {
    return this.phe;
  }

  /** Chủ phòng còn đổi được bộ luật không — chỉ khi ván chưa bắt đầu (UC25 luồng 1a). */
  choPhepDoiBoLuat(): boolean {
    return this.trangThaiHienTai.choPhepDoiBoLuat();
  }

  /** Cửa chuyển pha duy nhất cho các sự kiện thường. Sai thứ tự ném `CHUYEN_TRANG_THAI_KHONG_HOP_LE`. */
  chuyenPha(suKien: SuKienChuyenPha): TrangThaiVan {
    this.trangThaiHienTai = this.trangThaiHienTai[suKien]();
    return this.trangThaiHienTai.ma;
  }

  /**
   * Kết thúc ván với phe thắng (UC20) — chỉ từ `GIAI_QUYET_DEM` hoặc `GIAI_QUYET_PHIEU`, tức ngay
   * sau một lần kiểm tra thắng thua. Đóng nhật ký để bản ghi diễn tiến được mở công khai.
   */
  ketThuc(pheThang: Phe): void {
    this.trangThaiHienTai = this.trangThaiHienTai.thoaDieuKien();
    this.phe = pheThang;
    this.nhatKy.dong();
  }

  /** Hủy ván khi quá ngưỡng mất kết nối (Q04). Không có phe thắng. */
  huyVan(): void {
    this.trangThaiHienTai = this.trangThaiHienTai.quaNguongMatKetNoi();
    this.nhatKy.dong();
  }

  /** Số thứ tự lượt đang chạy; 0 khi chưa bắt đầu lượt nào. */
  get luotHienTai(): number {
    return this.danhSachLuot.length;
  }

  /** Mọi người chơi theo thứ tự ghế. */
  layDanhSachNguoiChoi(): readonly NguoiChoi[] {
    return this.danhSachNguoiChoi;
  }

  layNguoiConSong(): NguoiChoi[] {
    return this.danhSachNguoiChoi.filter((n) => n.conSong);
  }

  layNguoiChoi(nguoiChoiId: string): NguoiChoi {
    const nguoiChoi = this.danhSachNguoiChoi.find((n) => n.id === nguoiChoiId);
    if (!nguoiChoi) throw new LoiNghiepVu('KHONG_TIM_THAY_NGUOI_CHOI', nguoiChoiId);
    return nguoiChoi;
  }

  /** Phe của một người — kết quả soi của Tiên tri (UC13 luồng con). */
  layPheCua(nguoiChoiId: string): Phe {
    return this.layNguoiChoi(nguoiChoiId).vaiTro.phe;
  }

  /** Mở lượt kế tiếp. */
  taoLuotMoi(): LuotChoi {
    const luot = new LuotChoi(this.danhSachLuot.length + 1);
    this.danhSachLuot.push(luot);
    return luot;
  }

  /** Lượt đang chạy. */
  layLuotHienTai(): LuotChoi {
    const luot = this.danhSachLuot.at(-1);
    if (!luot) throw new LoiNghiepVu('CHUA_CO_LUOT');
    return luot;
  }

  layDanhSachLuot(): readonly LuotChoi[] {
    return [...this.danhSachLuot];
  }

  /**
   * Đánh dấu chết cho cả danh sách ở lượt hiện tại. Kiểm tra hết trước khi đổi, để một mục sai
   * không làm danh sách bị áp dụng nửa chừng.
   */
  danhDauChet(danhSach: readonly { nguoiChoiId: string; nguyenNhan: NguyenNhanChet }[]): void {
    const luot = this.luotHienTai;
    const nguoiChoi = danhSach.map((c) => this.layNguoiChoi(c.nguoiChoiId));
    const daChet = nguoiChoi.find((n) => !n.conSong);
    if (daChet) throw new LoiNghiepVu('DA_CHET', daChet.id);
    if (new Set(nguoiChoi).size !== nguoiChoi.length) {
      throw new LoiNghiepVu('TRUNG_NGUOI_CHOI', 'một người bị đánh dấu chết hai lần');
    }
    danhSach.forEach((c, i) => nguoiChoi[i]!.danhDauChet(c.nguyenNhan, luot));
  }
}
