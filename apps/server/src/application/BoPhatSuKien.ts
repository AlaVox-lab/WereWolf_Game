import type { LoaiVai } from '../domain/chung/LoaiVai.js';
import type { Phe } from '../domain/chung/Phe.js';
import type { TrangThaiVan } from '../domain/chung/TrangThaiVan.js';
import type { LoaiKenh } from '../domain/kenh/KenhChat.js';
import type { TinNhan } from '../domain/kenh/TinNhan.js';
import type { KetQuaNgay } from './BoDieuPhoiVan.js';

/** Việc người chơi được mời làm — để giao diện và người chơi ảo biết phải trả lời gì. */
export type LoaiViec = 'HANH_DONG_DEM' | 'BO_PHIEU' | 'THO_SAN_BAN';

/**
 * Sự kiện miền phát ra trong ván. Đây là sự kiện **bên trong** máy chủ — tầng thời gian thực (4.7)
 * chiếu chúng thành gói tin công khai; dữ liệu vai không bao giờ nằm trong sự kiện gửi cho cả làng.
 */
export type SuKienMien =
  | { readonly loai: 'CHUYEN_PHA'; readonly trangThai: TrangThaiVan; readonly luot: number }
  | { readonly loai: 'DOI_BUOC_DEM'; readonly buoc: LoaiVai | null }
  | {
      readonly loai: 'MOI_HANH_DONG';
      readonly nguoiChoiId: string;
      readonly viec: LoaiViec;
      readonly hetHanLuc: number;
    }
  | {
      readonly loai: 'KET_QUA_SOI';
      readonly luot: number;
      readonly mucTieuId: string;
      readonly phe: Phe;
    }
  | { readonly loai: 'CONG_BO_SANG'; readonly nguoiChet: readonly string[] }
  | { readonly loai: 'KET_QUA_NGAY'; readonly ketQua: KetQuaNgay }
  | { readonly loai: 'TIN_NHAN'; readonly tinNhan: TinNhan }
  | { readonly loai: 'KET_THUC'; readonly pheThang: Phe };

/** Ai nhận một sự kiện. `KENH` = mọi người đang xem được kênh đó **ngay lúc phát**. */
export type DoiTuongNhan =
  | { readonly loai: 'TAT_CA' }
  | { readonly loai: 'NGUOI_CHOI'; readonly nguoiChoiId: string }
  | { readonly loai: 'KENH'; readonly kenh: LoaiKenh };

export type NguoiNghe = (suKien: SuKienMien, nguoiNhan: readonly string[]) => void;
export type NguoiNgheRieng = (suKien: SuKienMien) => void;

/**
 * Bộ phát sự kiện — mẫu **Observer** (ARCHITECTURE.md mục 10). Nhiều bên cùng quan tâm một sự
 * kiện chuyển pha: bộ chuyển đổi Socket.IO (4.7), người chơi ảo (2.8), nhật ký (2.7).
 *
 * Đối tượng nhận được dịch thành danh sách mã người chơi **lúc phát**, qua hàm `layNguoiNhan` do
 * bộ điều phối cung cấp. Người nghe ném lỗi không làm hỏng ván và không chặn người nghe khác.
 */
export class BoPhatSuKien {
  private readonly cacNguoiNghe = new Set<NguoiNghe>();

  constructor(
    private readonly layNguoiNhan: (doiTuong: DoiTuongNhan) => readonly string[],
    private readonly khiLoi: (loi: unknown) => void = (loi) => console.error(loi),
  ) {}

  /** Nghe mọi sự kiện kèm danh sách người nhận. Trả hàm hủy đăng ký. */
  dangKy(nguoiNghe: NguoiNghe): () => void {
    this.cacNguoiNghe.add(nguoiNghe);
    return () => this.cacNguoiNghe.delete(nguoiNghe);
  }

  /** Chỉ nghe những sự kiện mà `nguoiChoiId` là người nhận. Trả hàm hủy đăng ký. */
  dangKyNguoiChoi(nguoiChoiId: string, nguoiNghe: NguoiNgheRieng): () => void {
    return this.dangKy((suKien, nguoiNhan) => {
      if (nguoiNhan.includes(nguoiChoiId)) nguoiNghe(suKien);
    });
  }

  phat(suKien: SuKienMien, doiTuong: DoiTuongNhan): void {
    const nguoiNhan = this.layNguoiNhan(doiTuong);
    for (const nguoiNghe of [...this.cacNguoiNghe]) {
      try {
        nguoiNghe(suKien, nguoiNhan);
      } catch (loi) {
        this.khiLoi(loi);
      }
    }
  }
}
