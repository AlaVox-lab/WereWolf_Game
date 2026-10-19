/**
 * Một phiếu bầu — khớp bảng `phieu_bau`. `nguoiBiBauId = null` là **bỏ trắng**. Bất biến.
 */
export class PhieuBau {
  constructor(
    readonly nguoiBauId: string,
    readonly nguoiBiBauId: string | null,
    /** Mili giây kể từ mốc Unix — người gọi lấy từ cổng `DongHo`. */
    readonly thoiDiem: number,
  ) {
    Object.freeze(this);
  }

  laBoTrang(): boolean {
    return this.nguoiBiBauId === null;
  }
}
