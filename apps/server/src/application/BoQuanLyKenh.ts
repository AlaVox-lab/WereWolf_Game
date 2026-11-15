import { LoiNghiepVu } from '../domain/chung/LoiNghiepVu.js';
import { LoaiKenh, type KenhChat, type TinhHinhKenh } from '../domain/kenh/KenhChat.js';
import { KenhChung } from '../domain/kenh/KenhChung.js';
import { KenhNguoiChet } from '../domain/kenh/KenhNguoiChet.js';
import { KenhSoi } from '../domain/kenh/KenhSoi.js';
import { TinNhan } from '../domain/kenh/TinNhan.js';
import type { VanDau } from '../domain/van/VanDau.js';

/** Độ dài tối đa một tin nhắn, ký tự. */
export const DO_DAI_TIN_NHAN_TOI_DA = 500;

/**
 * Bộ quản lý kênh (ARCHITECTURE.md mục 5.5) — trả lời ba câu: kênh nào đang mở, ai xem được kênh
 * nào, ai được gửi. Quyết định dựa hoàn toàn vào phân cấp `KenhChat`; lớp này chỉ ghép với tình
 * hình ván và giữ lịch sử tin nhắn trong bộ nhớ (lưu bền ở hạng mục 4.8).
 *
 * Tầng thời gian thực (4.7, 4.8) dùng `layNguoiXem()` để biết phát tin tới ai, và
 * `guiTinNhan()` là cửa duy nhất nhận tin từ người chơi.
 */
export class BoQuanLyKenh {
  private readonly cacKenh: ReadonlyMap<LoaiKenh, KenhChat> = new Map<LoaiKenh, KenhChat>([
    [LoaiKenh.CHUNG, new KenhChung()],
    [LoaiKenh.SOI, new KenhSoi()],
    [LoaiKenh.NGUOI_CHET, new KenhNguoiChet()],
  ]);
  private readonly lichSu: TinNhan[] = [];

  /**
   * @param dangLuotTapThe cho biết pha đêm có đang ở lượt hành động tập thể (lượt Sói) không —
   *   `BoDieuPhoiVan` cung cấp.
   * @param khiCoTinNhan gọi sau mỗi tin nhắn được nhận — `BoDieuPhoiVan` phát nó thành sự kiện.
   */
  constructor(
    private readonly van: VanDau,
    private readonly dangLuotTapThe: () => boolean,
    private readonly khiCoTinNhan: (tinNhan: TinNhan) => void = () => {},
  ) {}

  layTinhHinh(): TinhHinhKenh {
    return { trangThai: this.van.trangThai, dangLuotSoi: this.dangLuotTapThe() };
  }

  layKenh(loai: LoaiKenh): KenhChat {
    return this.cacKenh.get(loai)!;
  }

  /** Các kênh đang nhận tin nhắn lúc này. */
  kenhDangMo(): LoaiKenh[] {
    const tinhHinh = this.layTinhHinh();
    return [...this.cacKenh].filter(([, kenh]) => kenh.dangMo(tinhHinh)).map(([loai]) => loai);
  }

  /** Mã những người xem được kênh `loai` — để tầng thời gian thực phát tin tới đúng người. */
  layNguoiXem(loai: LoaiKenh): string[] {
    const kenh = this.layKenh(loai);
    return this.van
      .layDanhSachNguoiChoi()
      .filter((n) => kenh.coTheXem(n))
      .map((n) => n.id);
  }

  /** Các kênh một người xem được. */
  cacKenhXemDuoc(nguoiChoiId: string): LoaiKenh[] {
    const nguoiChoi = this.van.layNguoiChoi(nguoiChoiId);
    return [...this.cacKenh].filter(([, kenh]) => kenh.coTheXem(nguoiChoi)).map(([loai]) => loai);
  }

  /** Người này gửi được vào kênh `loai` ngay lúc này không. */
  coTheGui(nguoiChoiId: string, loai: LoaiKenh): boolean {
    return this.layKenh(loai).coTheGui(this.van.layNguoiChoi(nguoiChoiId), this.layTinhHinh());
  }

  /**
   * Nhận một tin nhắn (UC18). Kiểm nội dung rồi kiểm quyền gửi theo kênh và tình hình ván — sai
   * thì ném lỗi, không ghi gì.
   */
  guiTinNhan(nguoiGuiId: string, loai: LoaiKenh, noiDung: string, thoiDiem: number): TinNhan {
    const daCat = noiDung.trim();
    if (daCat.length === 0 || daCat.length > DO_DAI_TIN_NHAN_TOI_DA) {
      throw new LoiNghiepVu(
        'TIN_NHAN_KHONG_HOP_LE',
        `cần 1–${DO_DAI_TIN_NHAN_TOI_DA} ký tự, có ${daCat.length}`,
      );
    }
    if (!this.coTheGui(nguoiGuiId, loai)) {
      throw new LoiNghiepVu('KHONG_DUOC_GUI', `${nguoiGuiId} không gửi được vào ${loai} lúc này`);
    }
    const tinNhan = new TinNhan(this.lichSu.length + 1, loai, nguoiGuiId, daCat, thoiDiem);
    this.lichSu.push(tinNhan);
    this.khiCoTinNhan(tinNhan);
    return tinNhan;
  }

  /** Mọi tin nhắn của ván, mọi kênh — chỉ để lưu khi kết thúc (4.10), không gửi cho ai. */
  layTatCaTinNhan(): readonly TinNhan[] {
    return this.lichSu;
  }

  /** Lịch sử kênh `loai` cho người xem `nguoiXemId` — không có quyền xem thì ném lỗi. */
  layTinNhan(loai: LoaiKenh, nguoiXemId: string): readonly TinNhan[] {
    if (!this.layKenh(loai).coTheXem(this.van.layNguoiChoi(nguoiXemId))) {
      throw new LoiNghiepVu('KHONG_DUOC_XEM', `${nguoiXemId} không xem được ${loai}`);
    }
    return this.lichSu.filter((t) => t.kenh === loai);
  }
}
