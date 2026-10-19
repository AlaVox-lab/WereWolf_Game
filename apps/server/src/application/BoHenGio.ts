import type { DongHo, HuyHen } from '../domain/chung/DongHo.js';

interface LanHen {
  readonly hetHanLuc: number;
  readonly huy: HuyHen;
}

/**
 * Bộ hẹn giờ hệ thống — **tác nhân AC04** (ARCHITECTURE.md mục 7). Chỉ lớp này được đặt hạn; mọi
 * hành vi "hết giờ thì…" (BR12, UC14, UC16) đều đi qua đây.
 *
 * Mỗi lần hẹn có một **mã**. Đặt lại cùng mã thì hẹn cũ tự hủy — một bước của ván chỉ có một
 * đồng hồ. Chạy trên cổng `DongHo`, nên kiểm thử và bộ mô phỏng tua nhanh được.
 */
export class BoHenGio {
  private readonly cacHen = new Map<string, LanHen>();

  constructor(private readonly dongHo: DongHo) {}

  /**
   * Hẹn gọi `khiHetGio` sau `thoiHanMs`. Trả thời điểm hết hạn tuyệt đối — máy chủ gửi con số này
   * xuống trình duyệt để đếm ngược; trình duyệt không tự chuyển pha.
   */
  datHen(ma: string, thoiHanMs: number, khiHetGio: () => void): number {
    this.huy(ma);
    const hetHanLuc = this.dongHo.bayGio() + Math.max(0, thoiHanMs);
    const huy = this.dongHo.datHen(thoiHanMs, () => {
      this.cacHen.delete(ma);
      khiHetGio();
    });
    this.cacHen.set(ma, { hetHanLuc, huy });
    return hetHanLuc;
  }

  /** Hủy hẹn `ma` nếu có. Gọi khi bước kết thúc sớm (mọi người đã hành động). */
  huy(ma: string): void {
    this.cacHen.get(ma)?.huy();
    this.cacHen.delete(ma);
  }

  huyTatCa(): void {
    for (const ma of [...this.cacHen.keys()]) this.huy(ma);
  }

  dangCho(ma: string): boolean {
    return this.cacHen.has(ma);
  }

  /** Thời điểm hết hạn của hẹn `ma`, hoặc `null` nếu không có. */
  layHetHanLuc(ma: string): number | null {
    return this.cacHen.get(ma)?.hetHanLuc ?? null;
  }

  bayGio(): number {
    return this.dongHo.bayGio();
  }
}
