// Chiếu góc nhìn thành danh sách ghế để vẽ — chỉ đọc những gì góc nhìn đã cho phép thấy.
import type { GocNhinNguoiChoi, LoaiVaiCongKhai, PheCongKhai } from '@moonvillage/shared';

export interface ThongTinGhe {
  id: string;
  ten: string;
  conSong: boolean;
  laToi: boolean;
  /** Đồng đội Sói — chỉ người xem là Sói mới thấy. */
  laDongDoi: boolean;
  /** Kết quả soi — chỉ Tiên tri thấy trên người mình đã soi. */
  pheDaSoi: PheCongKhai | null;
  /** Vai lộ ra: của chính mình, hoặc của mọi người khi hết ván. */
  vaiLo: LoaiVaiCongKhai | null;
}

export function dungGhe(
  g: GocNhinNguoiChoi,
  ten: (id: string, ghe: number) => string,
): ThongTinGhe[] {
  const vaiLo = new Map(g.ketThuc?.vai.map((v) => [v.id, v.loaiVai]) ?? []);
  return [...g.nguoiChoi]
    .sort((a, b) => a.thuTuGhe - b.thuTuGhe)
    .map((n) => ({
      id: n.id,
      ten: ten(n.id, n.thuTuGhe),
      conSong: n.conSong,
      laToi: n.id === g.toi.id,
      laDongDoi: g.toi.dongDoi?.includes(n.id) ?? false,
      pheDaSoi: g.ketQuaSoi.findLast((k) => k.mucTieuId === n.id)?.phe ?? null,
      vaiLo: vaiLo.get(n.id) ?? (n.id === g.toi.id ? g.toi.loaiVai : null),
    }));
}
