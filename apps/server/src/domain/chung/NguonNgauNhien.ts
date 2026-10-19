/**
 * Cổng ngẫu nhiên — ARCHITECTURE.md mục 9. Lõi miền không gọi `Math.random()`.
 * Dùng cho xáo trộn khi chia vai (UC12) và chọn ngẫu nhiên mục tiêu của Sói khi hết giờ (BR12).
 */
export interface NguonNgauNhien {
  /** Số thực trong khoảng [0, 1). */
  tiepTheo(): number;
  /** Số nguyên trong khoảng [0, gioiHan). `gioiHan` phải là số nguyên dương. */
  soNguyen(gioiHan: number): number;
}

/**
 * Nguồn ngẫu nhiên theo hạt giống (thuật toán mulberry32). Cùng hạt giống cho cùng dãy số — đủ
 * để tái hiện một ván khi kiểm thử hoặc mô phỏng. Không dùng cho mục đích bảo mật.
 */
export class NgauNhienCoHat implements NguonNgauNhien {
  private trangThai: number;

  constructor(hatGiong: number) {
    this.trangThai = hatGiong >>> 0;
  }

  tiepTheo(): number {
    this.trangThai = (this.trangThai + 0x6d2b79f5) >>> 0;
    let t = this.trangThai;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  soNguyen(gioiHan: number): number {
    if (!Number.isInteger(gioiHan) || gioiHan <= 0) {
      throw new RangeError(`gioiHan phải là số nguyên dương, nhận ${gioiHan}`);
    }
    return Math.floor(this.tiepTheo() * gioiHan);
  }
}
