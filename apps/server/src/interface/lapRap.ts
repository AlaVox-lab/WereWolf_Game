// Lắp ráp toàn bộ máy chủ từ các phụ thuộc — main.ts dùng với Prisma và đồng hồ thật, kiểm thử
// dùng kho bộ nhớ và thời lượng ngắn. Một chỗ duy nhất nối các tầng với nhau.
import { createServer } from 'node:http';
import type { CauHinhThoiGian } from '../application/CauHinhThoiGian.js';
import type { KhoDuLieu } from '../application/kho/KhoDuLieu.js';
import { SoDangKyPhong } from '../application/phong/SoDangKyPhong.js';
import { DichVuLichSu } from '../application/van/DichVuLichSu.js';
import { DichVuBaoCao } from '../application/kiemduyet/DichVuBaoCao.js';
import { DichVuQuanTri, type CongNgatKetNoi } from '../application/kiemduyet/DichVuQuanTri.js';
import { DichVuXepHang } from '../application/xephang/DichVuXepHang.js';
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
import { taoRouterKiemDuyet } from './api/kiemDuyet.js';
import { taoRouterLichSu } from './api/lichSu.js';
import { taoRouterXepHang } from './api/xepHang.js';
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
  /** Thư mục bản build của web — máy chủ phục vụ luôn giao diện (Docker). */
  thuMucWeb?: string;
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
  // UC23 — người bị khóa: ra khỏi phòng đang chờ (ván đang chơi thì thành mất kết nối) rồi bị
  // ngắt mọi kết nối. `socket` lắp ngay dưới; cổng chỉ được gọi khi máy chủ đã chạy.
  const congNgat: CongNgatKetNoi = {
    ngat(taiKhoanId, lyDo) {
      const ma = phong.phongCua(taiKhoanId);
      if (ma) {
        try {
          phong.roiPhong(ma, taiKhoanId);
        } catch {
          // Phòng đang chơi — người đó ngồi lại như mất kết nối, Q04 lo phần còn lại.
        }
      }
      socket.ngatTaiKhoan(taiKhoanId, lyDo);
    },
  };
  const quanTri = new DichVuQuanTri(ch.kho.taiKhoan, ch.kho.baoCao, ch.kho.van, congNgat);
  const app = createApp({
    taiKhoan,
    phien,
    ...(ch.thuMucWeb ? { thuMucWeb: ch.thuMucWeb } : {}),
    routerThem: [
      taoRouterPhong(phong),
      taoRouterLichSu(new DichVuLichSu(ch.kho.van)),
      taoRouterXepHang(new DichVuXepHang(ch.kho.xepHang)),
      taoRouterKiemDuyet(new DichVuBaoCao(ch.kho.baoCao, ch.kho.van, ch.kho.taiKhoan), quanTri),
    ],
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
    quanTri,
    socket,
    /** Lời hứa lưu của các ván đã kết thúc — kiểm thử chờ cho chắc. */
    vanDaLuu,
    async dong() {
      await socket.dong();
      await new Promise<void>((r) => http.close(() => r()));
    },
  };
}
