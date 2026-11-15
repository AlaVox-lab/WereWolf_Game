// Bộ dựng máy chủ thử dùng chung cho kiểm thử tầng interface — kho bộ nhớ, cổng ngẫu nhiên.
// Không phải tệp kiểm thử.
import type { AddressInfo } from 'node:net';
import { SoDangKyPhong } from '../../src/application/phong/SoDangKyPhong.js';
import { DichVuTaiKhoan } from '../../src/application/taikhoan/DichVuTaiKhoan.js';
import { NgauNhienCoHat } from '../../src/domain/chung/NguonNgauNhien.js';
import { boMatKhauBcrypt } from '../../src/infrastructure/auth/matKhau.js';
import { taoBoPhien } from '../../src/infrastructure/auth/phien.js';
import { taoKhoBoNho } from '../../src/infrastructure/repository/boNho/khoBoNho.js';
import { createApp } from '../../src/interface/api/app.js';
import { taoRouterPhong } from '../../src/interface/api/phong.js';

export async function taoMayChuThu() {
  const kho = taoKhoBoNho();
  const taiKhoan = new DichVuTaiKhoan(kho.taiKhoan, boMatKhauBcrypt);
  const phong = new SoDangKyPhong({
    kho,
    nguonNgauNhien: new NgauNhienCoHat(7),
    choPhepNguoiChoiAo: true,
  });
  const app = createApp({
    taiKhoan,
    phien: taoBoPhien('bi-mat-kiem-thu'),
    routerThem: [taoRouterPhong(phong)],
  });
  const server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  const url = `http://localhost:${(server.address() as AddressInfo).port}`;
  return {
    url,
    kho,
    taiKhoan,
    phong,
    dong: () => new Promise<void>((r) => server.close(() => r())),
  };
}

/** Trình duyệt tối giản: nhớ cookie phiên giữa các lần gọi. */
export function taoNguoiDung(url: string) {
  let cookie = '';
  return {
    get cookie() {
      return cookie;
    },
    async goi(duongDan: string, phuongThuc = 'GET', than?: unknown) {
      const res = await fetch(url + duongDan, {
        method: phuongThuc,
        headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
        ...(than === undefined ? {} : { body: JSON.stringify(than) }),
      });
      const datCookie = res.headers.getSetCookie().find((c) => c.startsWith('ltm_phien='));
      if (datCookie) {
        const cap = datCookie.split(';')[0]!;
        cookie = cap === 'ltm_phien=' ? '' : cap;
      }
      const chu = await res.text();
      return { status: res.status, body: chu ? JSON.parse(chu) : null };
    },
  };
}
