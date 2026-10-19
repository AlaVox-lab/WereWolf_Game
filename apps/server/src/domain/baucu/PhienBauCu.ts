import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import { MaQuyTac } from '../chung/MaQuyTac.js';
import type { BoLuatChoi } from '../luat/BoLuatChoi.js';
import { PhieuBau } from './PhieuBau.js';

/** Kết quả một phiên bỏ phiếu sau khi kiểm phiếu (UC16 bước 5–6, UC16b). */
export type KetQuaPhien =
  /** Một người nhiều phiếu nhất duy nhất — thi hành treo cổ. */
  | { readonly loai: 'TREO_CO'; readonly nguoiBiTreoId: string }
  /** Không ai bị loại: không có phiếu hợp lệ nào, hoặc hòa khi BR11 bật, hoặc vòng bầu lại vẫn hòa. */
  | { readonly loai: 'KHONG_AI' }
  /** Hòa khi BR11 tắt: bầu lại một lần chỉ giữa những người hòa (Q03). */
  | { readonly loai: 'BAU_LAI'; readonly ungVien: readonly string[] };

/**
 * Phiên bỏ phiếu treo cổ của một lượt (UC16) — khớp bảng `phien_bau_cu`.
 *
 * Phiên chỉ ghi phiếu và kiểm phiếu; **không tự hẹn giờ**. Hết giờ thì bộ điều phối gọi
 * `kiemPhieu()` — ai chưa bầu coi như bỏ trắng (UC16 luồng 2a).
 */
export class PhienBauCu {
  private readonly danhSachPhieu: PhieuBau[] = [];
  private ketQua: KetQuaPhien | null = null;
  private readonly cuTri: ReadonlySet<string>;
  private readonly ungVien: ReadonlySet<string>;

  /**
   * @param cuTri    người được bỏ phiếu — mọi người còn sống
   * @param ungVien  người được bầu; mặc định là toàn bộ cử tri, vòng bầu lại chỉ gồm người hòa
   * @param thoiHan  thời điểm hết hạn (mili giây kể từ mốc Unix), để gửi xuống giao diện
   */
  constructor(
    readonly soLuot: number,
    cuTri: readonly string[],
    readonly thoiHan: number,
    ungVien: readonly string[] = cuTri,
    readonly laVongBauLai = false,
  ) {
    this.cuTri = new Set(cuTri);
    this.ungVien = new Set(ungVien);
  }

  /** Ghi phiếu của một cử tri (UC16 bước 3). `nguoiBiBauId = null` là bỏ trắng. */
  ghiPhieu(nguoiBauId: string, nguoiBiBauId: string | null, thoiDiem: number): PhieuBau {
    if (this.ketQua) throw new LoiNghiepVu('PHIEN_DA_CHOT', `lượt ${this.soLuot}`);
    if (!this.cuTri.has(nguoiBauId)) throw new LoiNghiepVu('KHONG_CO_QUYEN_BAU', nguoiBauId);
    // Ràng buộc toàn vẹn 12.3: mỗi người tối đa một phiếu trong một phiên.
    if (this.daBoPhieu(nguoiBauId)) throw new LoiNghiepVu('DA_BO_PHIEU', nguoiBauId);
    if (nguoiBiBauId !== null && !this.ungVien.has(nguoiBiBauId)) {
      throw new LoiNghiepVu('MUC_TIEU_KHONG_HOP_LE', `không bầu được ${nguoiBiBauId}`);
    }
    const phieu = new PhieuBau(nguoiBauId, nguoiBiBauId, thoiDiem);
    this.danhSachPhieu.push(phieu);
    return phieu;
  }

  /** Số người được bỏ phiếu — cho chỉ báo tiến độ dạng số (nguyên tắc giao diện 14.2). */
  laySoCuTri(): number {
    return this.cuTri.size;
  }

  daBoPhieu(nguoiBauId: string): boolean {
    return this.danhSachPhieu.some((p) => p.nguoiBauId === nguoiBauId);
  }

  /** Mọi cử tri đã bầu chưa — để bộ điều phối kết thúc phiên sớm (UC16 bước 4). */
  daDuPhieu(): boolean {
    return this.danhSachPhieu.length === this.cuTri.size;
  }

  layDanhSachPhieu(): readonly PhieuBau[] {
    return [...this.danhSachPhieu];
  }

  layDanhSachUngVien(): readonly string[] {
    return [...this.ungVien];
  }

  /** Số phiếu từng ứng viên đang có, bỏ qua phiếu trắng — cho màn bỏ phiếu MH07. */
  demPhieu(): ReadonlyMap<string, number> {
    const dem = new Map<string, number>();
    for (const p of this.danhSachPhieu) {
      if (p.nguoiBiBauId !== null) dem.set(p.nguoiBiBauId, (dem.get(p.nguoiBiBauId) ?? 0) + 1);
    }
    return dem;
  }

  /**
   * Kiểm phiếu và chốt phiên (UC16 bước 4–5). Một người nhiều phiếu nhất duy nhất thì bị treo;
   * hòa thì chuyển cho `xuLyHoa()`. Gọi lại trả đúng kết quả đã chốt.
   */
  kiemPhieu(luat: BoLuatChoi): KetQuaPhien {
    if (this.ketQua) return this.ketQua;
    const dem = this.demPhieu();
    const cao = Math.max(0, ...dem.values());
    const nguoiCaoNhat = [...dem].filter(([, so]) => so === cao).map(([id]) => id);

    let ketQua: KetQuaPhien;
    if (cao === 0) ketQua = { loai: 'KHONG_AI' };
    else if (nguoiCaoNhat.length === 1)
      ketQua = { loai: 'TREO_CO', nguoiBiTreoId: nguoiCaoNhat[0]! };
    else ketQua = this.xuLyHoa(nguoiCaoNhat, luat);

    this.ketQua = Object.freeze(ketQua);
    return this.ketQua;
  }

  /**
   * UC16b — hòa phiếu. BR11 bật: không ai bị treo. BR11 tắt: bầu lại một lần giữa những người
   * hòa; nếu chính phiên này đã là vòng bầu lại thì không ai bị treo (Q03).
   */
  xuLyHoa(nguoiHoa: readonly string[], luat: BoLuatChoi): KetQuaPhien {
    if (luat.chophep(MaQuyTac.BR11) || this.laVongBauLai) return { loai: 'KHONG_AI' };
    return { loai: 'BAU_LAI', ungVien: [...nguoiHoa].sort() };
  }

  get ketQuaPhien(): KetQuaPhien | null {
    return this.ketQua;
  }

  /** Mở vòng bầu lại: cùng cử tri, ứng viên chỉ là người hòa. Chỉ khi kết quả là `BAU_LAI`. */
  taoVongBauLai(thoiHan: number): PhienBauCu {
    if (this.ketQua?.loai !== 'BAU_LAI') {
      throw new LoiNghiepVu('KHONG_THE_BAU_LAI', `lượt ${this.soLuot}`);
    }
    return new PhienBauCu(this.soLuot, [...this.cuTri], thoiHan, this.ketQua.ungVien, true);
  }
}
