// Kho trạng thái phía trình duyệt (ROADMAP 5.1) — chỉ giữ dữ liệu máy chủ gửi: phiên, ảnh chụp
// phòng, GocNhinNguoiChoi MỚI NHẤT, tin nhắn. Không tính luật gì ở đây (nguyên tắc 2.1).
import type {
  GocNhinNguoiChoi,
  PhienCongKhai,
  PhongCongKhai,
  TinNhanCongKhai,
} from '@moonvillage/shared';
import { create } from 'zustand';

export type TrangThaiKetNoi = 'chua-noi' | 'dang-noi' | 'da-noi' | 'mat-ket-noi';

interface KhoUngDung {
  /** `undefined` = đang hỏi máy chủ; `null` = chưa đăng nhập. */
  phien: PhienCongKhai | null | undefined;
  ketNoi: TrangThaiKetNoi;
  phong: PhongCongKhai | null;
  gocNhin: GocNhinNguoiChoi | null;
  /** Giờ máy chủ − giờ máy này, mili giây — đếm ngược theo hạn tuyệt đối máy chủ gửi. */
  lechGio: number;
  tinNhan: TinNhanCongKhai[];
  datPhien: (p: PhienCongKhai | null) => void;
  datKetNoi: (k: TrangThaiKetNoi) => void;
  datPhong: (p: PhongCongKhai | null) => void;
  datGocNhin: (g: GocNhinNguoiChoi, bayGioMayChu: number) => void;
  themTin: (t: TinNhanCongKhai) => void;
  datLichSu: (ds: TinNhanCongKhai[]) => void;
  xoaVan: () => void;
}

export const useKho = create<KhoUngDung>((set) => ({
  phien: undefined,
  ketNoi: 'chua-noi',
  phong: null,
  gocNhin: null,
  lechGio: 0,
  tinNhan: [],
  datPhien: (phien) => set({ phien }),
  datKetNoi: (ketNoi) => set({ ketNoi }),
  datPhong: (phong) => set({ phong }),
  datGocNhin: (gocNhin, bayGioMayChu) =>
    set((s) => ({
      gocNhin,
      lechGio: bayGioMayChu - Date.now(),
      tinNhan: s.gocNhin && s.gocNhin.vanId !== gocNhin.vanId ? [] : s.tinNhan,
    })),
  themTin: (t) =>
    set((s) => (s.tinNhan.some((x) => x.thuTu === t.thuTu) ? s : { tinNhan: [...s.tinNhan, t] })),
  datLichSu: (ds) => set({ tinNhan: ds }),
  xoaVan: () => set({ gocNhin: null, tinNhan: [] }),
}));

/** Giờ máy chủ ước tính lúc này. */
export const bayGioMayChu = () => Date.now() + useKho.getState().lechGio;
