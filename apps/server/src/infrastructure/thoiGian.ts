// Bản cài thật của hai cổng miền: đồng hồ hệ thống và nguồn ngẫu nhiên mật mã. Lõi miền chỉ thấy
// giao diện DongHo, NguonNgauNhien (nguyên tắc 2.4); kiểm thử dùng DongHoGia, NgauNhienCoHat.
import { randomInt } from 'node:crypto';
import type { DongHo } from '../domain/chung/DongHo.js';
import type { NguonNgauNhien } from '../domain/chung/NguonNgauNhien.js';

export class DongHoThat implements DongHo {
  bayGio(): number {
    return Date.now();
  }

  datHen(sauMs: number, goiLai: () => void) {
    const h = setTimeout(goiLai, Math.max(0, sauMs));
    return () => clearTimeout(h);
  }
}

export class NgauNhienThat implements NguonNgauNhien {
  tiepTheo(): number {
    return randomInt(0, 2 ** 32) / 2 ** 32;
  }

  soNguyen(gioiHan: number): number {
    return randomInt(0, gioiHan);
  }
}
