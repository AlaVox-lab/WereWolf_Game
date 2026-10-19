import type { LoaiKenh } from './KenhChat.js';

/** Một tin nhắn trong một kênh — khớp bảng `tin_nhan`. Bất biến. */
export class TinNhan {
  constructor(
    readonly thuTu: number,
    readonly kenh: LoaiKenh,
    readonly nguoiGuiId: string,
    readonly noiDung: string,
    /** Mili giây kể từ mốc Unix — người gọi lấy từ cổng `DongHo`. */
    readonly thoiDiem: number,
  ) {
    Object.freeze(this);
  }
}
