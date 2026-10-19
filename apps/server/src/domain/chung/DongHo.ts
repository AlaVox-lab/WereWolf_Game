/** Hàm hủy một lần hẹn đã đặt. Gọi nhiều lần cũng an toàn. */
export type HuyHen = () => void;

/**
 * Cổng thời gian — ARCHITECTURE.md mục 9. Lõi miền không bao giờ tự đọc giờ hệ thống.
 * Máy chủ thật dùng bản cài đặt trên giờ hệ thống (ở `infrastructure/`); kiểm thử và bộ mô
 * phỏng dùng `DongHoGia` tua được.
 */
export interface DongHo {
  /** Thời điểm hiện tại, mili giây kể từ mốc Unix. */
  bayGio(): number;
  /** Gọi `goiLai` sau `sauMs` mili giây. */
  datHen(sauMs: number, goiLai: () => void): HuyHen;
}

interface LanHen {
  luc: number;
  thuTu: number;
  goiLai: () => void;
}

/**
 * Đồng hồ giả: thời gian chỉ trôi khi gọi `tua()`. Các hẹn tới hạn được gọi theo thứ tự thời
 * điểm, hẹn cùng thời điểm thì theo thứ tự đặt — nhờ vậy một ván mô phỏng luôn lặp lại được.
 */
export class DongHoGia implements DongHo {
  private hienTai: number;
  private demThuTu = 0;
  private hangHen: LanHen[] = [];

  constructor(batDau = 0) {
    this.hienTai = batDau;
  }

  bayGio(): number {
    return this.hienTai;
  }

  datHen(sauMs: number, goiLai: () => void): HuyHen {
    const lanHen: LanHen = {
      luc: this.hienTai + Math.max(0, sauMs),
      thuTu: this.demThuTu++,
      goiLai,
    };
    this.hangHen.push(lanHen);
    return () => {
      this.hangHen = this.hangHen.filter((h) => h !== lanHen);
    };
  }

  /** Cho thời gian trôi `ms` mili giây, gọi mọi hẹn tới hạn — kể cả hẹn được đặt trong lúc tua. */
  tua(ms: number): void {
    const dich = this.hienTai + Math.max(0, ms);
    for (;;) {
      const tiepTheo = this.layHenSomNhat();
      if (!tiepTheo || tiepTheo.luc > dich) break;
      this.hangHen = this.hangHen.filter((h) => h !== tiepTheo);
      this.hienTai = tiepTheo.luc;
      tiepTheo.goiLai();
    }
    this.hienTai = dich;
  }

  /** Số hẹn đang chờ — tiện cho kiểm thử. */
  soHenDangCho(): number {
    return this.hangHen.length;
  }

  private layHenSomNhat(): LanHen | undefined {
    let somNhat: LanHen | undefined;
    for (const h of this.hangHen) {
      if (!somNhat || h.luc < somNhat.luc || (h.luc === somNhat.luc && h.thuTu < somNhat.thuTu)) {
        somNhat = h;
      }
    }
    return somNhat;
  }
}
