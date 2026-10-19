import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import type { NguyenNhanChet } from './NguyenNhanChet.js';

export interface NguoiChetTrongDem {
  readonly nguoiChoiId: string;
  readonly nguyenNhan: NguyenNhanChet;
}

/**
 * Kết quả giải quyết một đêm (UC14 bước 4) — khớp bảng `ket_qua_dem`. `BoGiaiQuyetDem` dựng nó
 * qua `themNguoiChet()` / `themNguoiDuocCuu()`, rồi `chot()` để không ai sửa được nữa.
 */
export class KetQuaDem {
  private readonly danhSachChet: NguoiChetTrongDem[] = [];
  private readonly danhSachDuocCuu: string[] = [];
  private daChot = false;

  constructor(readonly soDem: number) {}

  /** Thêm một người chết; người đã có trong danh sách thì bỏ qua (BR08: chỉ tính một lần). */
  themNguoiChet(nguoiChoiId: string, nguyenNhan: NguyenNhanChet): void {
    this.damBaoChuaChot();
    if (this.coTrongDanhSachChet(nguoiChoiId)) return;
    this.danhSachChet.push(Object.freeze({ nguoiChoiId, nguyenNhan }));
  }

  /** Ghi người thoát chết nhờ được bảo vệ hoặc được cứu — chỉ để nhật ký, không công bố. */
  themNguoiDuocCuu(nguoiChoiId: string): void {
    this.damBaoChuaChot();
    if (!this.danhSachDuocCuu.includes(nguoiChoiId)) this.danhSachDuocCuu.push(nguoiChoiId);
  }

  coNguoiChet(): boolean {
    return this.danhSachChet.length > 0;
  }

  coTrongDanhSachChet(nguoiChoiId: string): boolean {
    return this.danhSachChet.some((c) => c.nguoiChoiId === nguoiChoiId);
  }

  layDanhSachChet(): readonly NguoiChetTrongDem[] {
    return [...this.danhSachChet];
  }

  layDanhSachDuocCuu(): readonly string[] {
    return [...this.danhSachDuocCuu];
  }

  /** Đóng kết quả sau khi giải quyết xong. */
  chot(): void {
    this.daChot = true;
  }

  private damBaoChuaChot(): void {
    if (this.daChot) throw new LoiNghiepVu('DEM_DA_GIAI_QUYET', `đêm ${this.soDem}`);
  }
}
