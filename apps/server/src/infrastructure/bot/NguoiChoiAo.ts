import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import type { BoDieuPhoiVan } from '../../application/BoDieuPhoiVan.js';
import type { BoHenGio } from '../../application/BoHenGio.js';
import type { SuKienMien } from '../../application/BoPhatSuKien.js';
import type { CongLuaChon } from '../../application/CongLuaChon.js';
import { taoGocNhin } from '../../application/taoGocNhin.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type { NguonNgauNhien } from '../../domain/chung/NguonNgauNhien.js';

/** Một lựa chọn gửi qua cổng — đúng hình dạng trình duyệt sẽ gửi. */
type LuaChonGui = { mucTieuId: string | null; loai?: 'CUU' | 'DOC' };

export interface CauHinhNguoiChoiAo {
  /** Trễ trước khi trả lời, mili giây — giống người thật suy nghĩ. */
  readonly treToiThieu: number;
  readonly treToiDa: number;
}

export const NGUOI_CHOI_AO_MAC_DINH: CauHinhNguoiChoiAo = { treToiThieu: 1_000, treToiDa: 4_000 };

/**
 * Người chơi ảo (mục 17.4 tài liệu gốc) — chỉ dùng trong môi trường phát triển.
 *
 * **Đi chung luồng với người thật** (nguyên tắc 2.5): nghe đúng những sự kiện gửi cho mình, đọc
 * đúng **góc nhìn của chính mình** (`taoGocNhin`) để biết việc cần làm và các lựa chọn hợp lệ, rồi
 * gửi qua đúng cửa `CongLuaChon.ghiNhan()` mà cổng Socket.IO dùng. Không có đường nào nhìn vai
 * người khác — nếu người chơi ảo "chơi gian" được thì góc nhìn đang rò rỉ.
 *
 * Chiến lược: chọn ngẫu nhiên trong lựa chọn hợp lệ; bỏ phiếu ngẫu nhiên một người khác mình;
 * không nhắn tin. Được mời lại trong cùng lượt (Sói đổi ý) thì giữ nguyên lựa chọn cũ.
 */
export class NguoiChoiAo {
  private huyDangKy: (() => void) | null = null;
  private luaChonTruoc: { luot: number; viec: string; luaChon: LuaChonGui } | null = null;

  constructor(
    readonly nguoiChoiId: string,
    private readonly dieuPhoi: BoDieuPhoiVan,
    private readonly cong: CongLuaChon,
    private readonly boHenGio: BoHenGio,
    private readonly nguonNgauNhien: NguonNgauNhien,
    private readonly cauHinh: CauHinhNguoiChoiAo = NGUOI_CHOI_AO_MAC_DINH,
  ) {}

  batDau(): void {
    if (this.huyDangKy) return;
    this.huyDangKy = this.dieuPhoi.suKien.dangKyNguoiChoi(this.nguoiChoiId, (sk) =>
      this.khiCoSuKien(sk),
    );
  }

  dung(): void {
    this.huyDangKy?.();
    this.huyDangKy = null;
    this.boHenGio.huy(this.maHen());
  }

  private khiCoSuKien(suKien: SuKienMien): void {
    if (suKien.loai !== 'MOI_HANH_DONG') return;
    const { treToiThieu: min, treToiDa: max } = this.cauHinh;
    const tre = min + this.nguonNgauNhien.soNguyen(max - min + 1);
    this.boHenGio.datHen(this.maHen(), tre, () => this.traLoi());
  }

  /** Đọc góc nhìn của chính mình và trả lời lời mời đang mở, nếu còn. */
  private traLoi(): void {
    const gocNhin = taoGocNhin(this.dieuPhoi, this.nguoiChoiId);
    const viec = gocNhin.viecCanLam;
    if (!viec) return; // lời mời đã đóng (hết giờ, hoặc bước kết thúc sớm)
    const luaChon = this.chon(gocNhin);
    if (!luaChon) return; // không có gì để chọn — để hết giờ
    this.luaChonTruoc = { luot: gocNhin.luot, viec: viec.viec, luaChon };
    try {
      this.cong.ghiNhan(this.nguoiChoiId, luaChon);
    } catch (loi) {
      // Lời mời vừa đóng giữa chừng — bỏ qua như người thật bấm muộn.
      if (!(loi instanceof LoiNghiepVu)) throw loi;
    }
  }

  private chon(gocNhin: GocNhinNguoiChoi): LuaChonGui | null {
    const viec = gocNhin.viecCanLam!;
    const cacLuaChon: LuaChonGui[] = viec.luaChon.flatMap((nhom) =>
      nhom.mucTieu
        // Bỏ phiếu thì không bầu chính mình.
        .filter((id) => viec.viec !== 'BO_PHIEU' || id !== this.nguoiChoiId)
        .map((mucTieuId) => (nhom.loai ? { mucTieuId, loai: nhom.loai } : { mucTieuId })),
    );

    // Được mời lại cùng việc trong cùng lượt (Sói đổi ý): giữ lựa chọn cũ nếu còn hợp lệ.
    const truoc = this.luaChonTruoc;
    if (truoc && truoc.luot === gocNhin.luot && truoc.viec === viec.viec) {
      const conHopLe = cacLuaChon.some(
        (c) => c.mucTieuId === truoc.luaChon.mucTieuId && c.loai === truoc.luaChon.loai,
      );
      if (conHopLe) return truoc.luaChon;
    }

    if (cacLuaChon.length === 0) return viec.choPhepBoTrang ? { mucTieuId: null } : null;
    return cacLuaChon[this.nguonNgauNhien.soNguyen(cacLuaChon.length)]!;
  }

  private maHen(): string {
    return `nguoi-choi-ao:${this.nguoiChoiId}`;
  }
}
