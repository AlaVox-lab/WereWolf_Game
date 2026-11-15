// Lắp ráp toàn bộ máy chủ từ các phụ thuộc — main.ts dùng với Prisma và đồng hồ thật, kiểm thử
// dùng kho bộ nhớ và thời lượng ngắn. Một chỗ duy nhất nối các tầng với nhau.
import { createServer } from 'node:http';
import type { CauHinhThoiGian } from '../application/CauHinhThoiGian.js';
import type { KhoDuLieu } from '../application/kho/KhoDuLieu.js';
import { SoDangKyPhong } from '../application/phong/SoDangKyPhong.js';
import { DichVuLichSu } from '../application/van/DichVuLichSu.js';
import { DichVuTaiKhoan } from '../application/taikhoan/DichVuTaiKhoan.js';
import { DichVuLuuVan } from '../application/van/DichVuLuuVan.js';
import { SoDangKyVan } from '../application/van/SoDangKyVan.js';
import type { DongHo } from '../domain/chung/DongHo.js';
import type { NguonNgauNhien } from '../domain/chung/NguonNgauNhien.js';
import { boMatKhauBcrypt } from '../infrastructure/auth/matKhau.js';
import { taoBoPhien } from '../infrastructure/auth/phien.js';
import { NguoiChoiAo, type CauHinhNguoiChoiAo } from '../infrastructure/bot/NguoiChoiAo.js';
import { DongHoThat, NgauNhienThat } from '../infrastructure/thoiGian.js';
import { createApp } from './api/app.js';
import { taoRouterLichSu } from './api/lichSu.js';
import { taoRouterPhong } from './api/phong.js';
import { moCongSocket } from './ws/congSocket.js';

export interface CauHinhMayChu {
  kho: KhoDuLieu;
  biMatPhien: string;
  choPhepNguoiChoiAo: boolean;
  dongHo?: DongHo;
  nguonNgauNhien?: NguonNgauNhien;
  thoiGian?: CauHinhThoiGian;
  thoiGianXemVai?: number;
  nguoiChoiAo?: CauHinhNguoiChoiAo;
  nguongMatKetNoiMs?: number;
  chuKyKiemTraMs?: number;
  chuKyLamMoiMs?: number;
}

export function lapRapMayChu(ch: CauHinhMayChu) {
  const dongHo = ch.dongHo ?? new DongHoThat();
  const nguon = ch.nguonNgauNhien ?? new NgauNhienThat();
  const phien = taoBoPhien(ch.biMatPhien);
  const taiKhoan = new DichVuTaiKhoan(ch.kho.taiKhoan, boMatKhauBcrypt);
  const van = new SoDangKyVan({
    dongHo,
    nguonNgauNhien: nguon,
    ...(ch.thoiGian ? { thoiGian: ch.thoiGian } : {}),
    ...(ch.thoiGianXemVai !== undefined ? { thoiGianXemVai: ch.thoiGianXemVai } : {}),
    taoNguoiChoiAo: (id, dieuPhoi, cong, boHenGio) =>
      new NguoiChoiAo(id, dieuPhoi, cong, boHenGio, new NgauNhienThat(), ch.nguoiChoiAo),
  });
  const phong = new SoDangKyPhong({
    kho: ch.kho,
    nguonNgauNhien: nguon,
    choPhepNguoiChoiAo: ch.choPhepNguoiChoiAo,
    soDangKyVan: van,
  });
  // UC20 — ván xong thì lưu (4.10). Lỗi lưu không làm hỏng phòng; ghi nhật ký máy chủ.
  const luuVan = new DichVuLuuVan(ch.kho.van, (ma) => phong.phongIdCua(ma));
  const vanDaLuu: Promise<string>[] = [];
  van.dangKyKetThuc(async (v) => {
    const hua = luuVan.luu(v, dongHo.bayGio());
    vanDaLuu.push(hua);
    await hua;
  });
  const app = createApp({
    taiKhoan,
    phien,
    routerThem: [taoRouterPhong(phong), taoRouterLichSu(new DichVuLichSu(ch.kho.van))],
  });
  const http = createServer(app);
  const socket = moCongSocket(http, {
    taiKhoan,
    phien,
    phong,
    van,
    ...(ch.nguongMatKetNoiMs !== undefined ? { nguongMatKetNoiMs: ch.nguongMatKetNoiMs } : {}),
    ...(ch.chuKyKiemTraMs !== undefined ? { chuKyKiemTraMs: ch.chuKyKiemTraMs } : {}),
    ...(ch.chuKyLamMoiMs !== undefined ? { chuKyLamMoiMs: ch.chuKyLamMoiMs } : {}),
  });
  return {
    http,
    app,
    kho: ch.kho,
    taiKhoan,
    phong,
    van,
    socket,
    /** Lời hứa lưu của các ván đã kết thúc — kiểm thử chờ cho chắc. */
    vanDaLuu,
    async dong() {
      await socket.dong();
      await new Promise<void>((r) => http.close(() => r()));
    },
  };
}
