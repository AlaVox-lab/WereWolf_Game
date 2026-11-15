// Một kết nối Socket.IO cho cả ứng dụng (ROADMAP 5.1). Cookie phiên đi kèm lúc bắt tay; mọi sự
// kiện máy chủ đổ vào kho Zustand; lệnh trả lời qua acknowledgement.
import type { LenhNguoiChoi, PhanHoiLenh, SuKienMayChu } from '@moonvillage/shared';
import { io, type Socket } from 'socket.io-client';
import { useKho } from './kho';

let socket: Socket<SuKienMayChu, LenhNguoiChoi> | null = null;

export function moKetNoi(): void {
  if (socket) return;
  const kho = useKho.getState();
  kho.datKetNoi('dang-noi');
  socket = io({ path: '/socket.io', withCredentials: true });
  socket.on('connect', () => useKho.getState().datKetNoi('da-noi'));
  socket.on('disconnect', () => useKho.getState().datKetNoi('mat-ket-noi'));
  socket.on('connect_error', () => useKho.getState().datKetNoi('mat-ket-noi'));
  socket.on('phong:cap-nhat', (p) => {
    const s = useKho.getState();
    s.datPhong(p);
    if (!p?.vanId && s.gocNhin && s.gocNhin.trangThai !== 'KET_THUC') s.xoaVan();
  });
  socket.on('van:goc-nhin', ({ gocNhin, bayGioMayChu }) =>
    useKho.getState().datGocNhin(gocNhin, bayGioMayChu),
  );
  socket.on('kenh:tin-nhan', (t) => useKho.getState().themTin(t));
  socket.on('kenh:lich-su', (ds) => useKho.getState().datLichSu(ds));
  socket.on('phien:ket-thuc', () => {
    dongKetNoi();
    useKho.getState().datPhien(null);
  });
}

export function dongKetNoi(): void {
  socket?.disconnect();
  socket = null;
  const s = useKho.getState();
  s.datKetNoi('chua-noi');
  s.datPhong(null);
  s.xoaVan();
}

/** Gửi một lệnh, trả lời của máy chủ thành Promise; lỗi mang câu tiếng Việt. */
export function guiLenh<K extends keyof LenhNguoiChoi>(
  ten: K,
  duLieu: Parameters<LenhNguoiChoi[K]>[0],
): Promise<void> {
  return new Promise((ok, loi) => {
    if (!socket?.connected) {
      loi(new Error('Mất kết nối với máy chủ — đang thử nối lại.'));
      return;
    }
    (socket.emit as (...a: unknown[]) => void)(ten, duLieu, (p: PhanHoiLenh) =>
      p.ok ? ok() : loi(new Error(p.thongDiep)),
    );
  });
}
