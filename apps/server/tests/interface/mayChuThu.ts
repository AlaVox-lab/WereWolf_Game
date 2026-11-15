// Bộ dựng máy chủ thử dùng chung cho kiểm thử tầng interface — kho bộ nhớ, cổng ngẫu nhiên, thời
// lượng pha rút ngắn để một ván chạy trong vài giây. Không phải tệp kiểm thử.
import type { LenhNguoiChoi, SuKienMayChu } from '@moonvillage/shared';
import type { AddressInfo } from 'node:net';
import { io as ketNoi, type Socket } from 'socket.io-client';
import type { CauHinhThoiGian } from '../../src/application/CauHinhThoiGian.js';
import { LoaiVai } from '../../src/domain/chung/LoaiVai.js';
import { taoKhoBoNho } from '../../src/infrastructure/repository/boNho/khoBoNho.js';
import { lapRapMayChu, type CauHinhMayChu } from '../../src/interface/lapRap.js';

export const THOI_GIAN_NHANH: CauHinhThoiGian = {
  luotVai: {
    [LoaiVai.BaoVe]: 400,
    [LoaiVai.Soi]: 500,
    [LoaiVai.TienTri]: 400,
    [LoaiVai.PhuThuy]: 400,
  },
  thoSanBan: 400,
  buocGiaToiThieu: 40,
  buocGiaToiDa: 80,
  congBo: 40,
  thaoLuan: 80,
  boPhieu: 500,
  bauLai: 300,
};

export async function taoMayChuThu(them: Partial<CauHinhMayChu> = {}) {
  const may = lapRapMayChu({
    kho: taoKhoBoNho(),
    biMatPhien: 'bi-mat-kiem-thu',
    choPhepNguoiChoiAo: true,
    thoiGian: THOI_GIAN_NHANH,
    thoiGianXemVai: 60,
    nguoiChoiAo: { treToiThieu: 5, treToiDa: 25 },
    chuKyLamMoiMs: 100,
    ...them,
  });
  may.http.listen(0);
  await new Promise<void>((r) => may.http.once('listening', () => r()));
  const url = `http://localhost:${(may.http.address() as AddressInfo).port}`;
  return { ...may, url };
}

export type SocketThu = Socket<SuKienMayChu, LenhNguoiChoi>;

/** Mở kết nối Socket.IO mang cookie phiên — như trình duyệt đã đăng nhập. */
export function moSocket(
  url: string,
  cookie: string,
  ganTruoc?: (s: SocketThu) => void,
): Promise<SocketThu> {
  const s: SocketThu = ketNoi(url, {
    path: '/socket.io',
    transports: ['websocket'],
    extraHeaders: { cookie },
    reconnection: false,
    forceNew: true,
    autoConnect: false,
  });
  // Gắn trình nghe trước khi nối: máy chủ gửi ảnh chụp ngay lúc kết nối (BR13).
  ganTruoc?.(s);
  s.connect();
  return new Promise((ok, loi) => {
    s.once('connect', () => ok(s));
    s.once('connect_error', (e) => loi(e));
  });
}

/** Gửi lệnh và chờ acknowledgement. */
export function lenh<K extends keyof LenhNguoiChoi>(
  s: SocketThu,
  ten: K,
  duLieu: Parameters<LenhNguoiChoi[K]>[0],
) {
  return new Promise<{ ok: boolean; loi?: string }>((ok) =>
    (s.emit as (...a: unknown[]) => void)(ten, duLieu, ok),
  );
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

/** Đăng ký một tài khoản mới, trả người dùng đã đăng nhập. */
export async function nguoiMoi(url: string, ten: string) {
  const u = taoNguoiDung(url);
  await u.goi('/api/tai-khoan/dang-ky', 'POST', {
    tenDangNhap: ten,
    bietDanh: ten,
    matKhau: 'matkhau123',
  });
  return u;
}
