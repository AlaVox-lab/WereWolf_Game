import { LoiNghiepVu } from '../domain/chung/LoiNghiepVu.js';
import type { BoHenGio } from './BoHenGio.js';

interface YeuCauDangCho {
  readonly hetHanLuc: number;
  /** Kiểm và chuyển lựa chọn thô thành giá trị hợp lệ; ném `LoiNghiepVu` nếu sai. */
  readonly nhan: (luaChon: unknown) => void;
  readonly ketThuc: (giaTri: null) => void;
}

/**
 * Cổng chờ lựa chọn của người chơi (ARCHITECTURE.md mục 7). Mã giả tài liệu gốc viết
 * `choNguoiChoiChon(vai, mucTieuHopLe, THOI_HAN)`; ở đây đó là `await congLuaChon.cho(...)` — một
 * lời hứa được giải quyết bởi **cái đến trước**:
 *
 * - lệnh của người chơi qua `ghiNhan()` — từ cổng Socket.IO hoặc người chơi ảo, **cùng một cửa**
 *   (nguyên tắc 2.5);
 * - `BoHenGio` báo hết giờ — lời hứa trả `null`, tức bỏ lượt (BR12, UC17 luồng 2a).
 *
 * Mỗi người chơi có tối đa một yêu cầu đang chờ. Nhiều người chờ cùng lúc được (cả bầy Sói).
 */
export class CongLuaChon {
  private readonly dangCho = new Map<string, YeuCauDangCho>();

  constructor(private readonly boHenGio: BoHenGio) {}

  /**
   * Mời `nguoiChoiId` chọn trong `thoiHanMs`. `kiemTra` nhận lựa chọn thô, ném `LoiNghiepVu` nếu
   * không hợp lệ, hoặc trả giá trị đã chuẩn hóa. Lựa chọn sai không kết thúc lượt — người chơi
   * chọn lại được trong thời gian còn lại.
   */
  cho<T>(
    nguoiChoiId: string,
    thoiHanMs: number,
    kiemTra: (luaChon: unknown) => T,
  ): Promise<T | null> {
    if (this.dangCho.has(nguoiChoiId)) {
      throw new LoiNghiepVu('DANG_CHO_LUA_CHON', nguoiChoiId);
    }
    return new Promise<T | null>((resolve) => {
      const ma = this.maHen(nguoiChoiId);
      const xong = (giaTri: T | null) => {
        this.dangCho.delete(nguoiChoiId);
        this.boHenGio.huy(ma);
        resolve(giaTri);
      };
      const hetHanLuc = this.boHenGio.datHen(ma, thoiHanMs, () => xong(null));
      this.dangCho.set(nguoiChoiId, {
        hetHanLuc,
        nhan: (luaChon) => xong(kiemTra(luaChon)),
        ketThuc: xong,
      });
    });
  }

  /**
   * Ghi lựa chọn của người chơi. Không có lời mời đang chờ thì ném `KHONG_CO_YEU_CAU` (lệnh tới
   * muộn hoặc không tới lượt). Lựa chọn sai thì ném lỗi của `kiemTra` và **vẫn chờ tiếp**.
   */
  ghiNhan(nguoiChoiId: string, luaChon: unknown): void {
    const yeuCau = this.dangCho.get(nguoiChoiId);
    if (!yeuCau) throw new LoiNghiepVu('KHONG_CO_YEU_CAU', nguoiChoiId);
    yeuCau.nhan(luaChon);
  }

  /** Người chơi có đang được mời chọn không — để chiếu "việc cần làm" vào góc nhìn. */
  dangChoNguoi(nguoiChoiId: string): boolean {
    return this.dangCho.has(nguoiChoiId);
  }

  layHetHanLuc(nguoiChoiId: string): number | null {
    return this.dangCho.get(nguoiChoiId)?.hetHanLuc ?? null;
  }

  /** Đóng lời mời sớm như bỏ lượt (`null`) — khi bước kết thúc trước hạn, hoặc ván bị hủy. */
  huy(nguoiChoiId: string): void {
    this.dangCho.get(nguoiChoiId)?.ketThuc(null);
  }

  huyTatCa(): void {
    for (const id of [...this.dangCho.keys()]) this.huy(id);
  }

  private maHen(nguoiChoiId: string): string {
    return `lua-chon:${nguoiChoiId}`;
  }
}
