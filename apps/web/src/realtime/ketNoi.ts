// Một kết nối Socket.IO cho cả ứng dụng (ROADMAP 5.1). Cookie phiên đi kèm lúc bắt tay; mọi sự
// kiện máy chủ đổ vào kho Zustand; lệnh trả lời qua acknowledgement.
import type { LenhNguoiChoi, PhanHoiLenh, SuKienMayChu } from '@moonvillage/shared';
import { io, type Socket } from 'socket.io-client';
import { useKho } from './kho';

type SocketUngDung = Socket<SuKienMayChu, LenhNguoiChoi>;

// Giữ kết nối trên globalThis: khi phát triển Vite nạp lại tệp này lúc sửa mã, bản mới vẫn thấy
// đúng kết nối đang mở thay vì mất dấu nó (một trang — một kết nối).
const chung = globalThis as { __ketNoiLangTrang?: SocketUngDung | null };
const lay = () => chung.__ketNoiLangTrang ?? null;
/** Vừa nối (lại): ảnh chụp phòng đầu tiên cho biết góc nhìn đang giữ còn thuộc ván nào không. */
let vuaNoi = false;

const daXong = (trangThai: string) => trangThai === 'KET_THUC' || trangThai === 'HUY_VAN';

export function moKetNoi(): void {
  if (lay()) return;
  const kho = useKho.getState();
  kho.datKetNoi('dang-noi');
  const socket: SocketUngDung = io({ path: '/socket.io', withCredentials: true });
  chung.__ketNoiLangTrang = socket;
  socket.on('connect', () => {
    vuaNoi = true;
    useKho.getState().datKetNoi('da-noi');
  });
  socket.on('disconnect', () => useKho.getState().datKetNoi('mat-ket-noi'));
  socket.on('connect_error', () => useKho.getState().datKetNoi('mat-ket-noi'));
  socket.on('phong:cap-nhat', (p) => {
    const s = useKho.getState();
    s.datPhong(p);
    const g = s.gocNhin;
    if (!p) {
      s.xoaVan();
    } else if (vuaNoi && g && !daXong(g.trangThai) && p.vanId !== g.vanId) {
      // Ván kết thúc trong lúc mất kết nối — bỏ góc nhìn cũ đang dở.
      s.xoaVan();
    }
    // Ván vừa xong thì phòng mở lại trước, ảnh chụp cuối (MH08) tới ngay sau — giữ góc nhìn.
    vuaNoi = false;
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
  lay()?.disconnect();
  chung.__ketNoiLangTrang = null;
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
    const socket = lay();
    if (!socket?.connected) {
      loi(new Error('Mất kết nối với máy chủ — đang thử nối lại.'));
      return;
    }
    (socket.emit as (...a: unknown[]) => void)(ten, duLieu, (p: PhanHoiLenh) =>
      p.ok ? ok() : loi(new Error(p.thongDiep)),
    );
  });
}
