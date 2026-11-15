// UC04 — xem lịch sử ván đã chơi và mở lại bản ghi diễn tiến của một ván cũ.
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type { ChiTietVan, KhoVan, TomTatVan } from '../kho/KhoDuLieu.js';

export interface NguoiXemVan {
  id: string;
  laQuanTri: boolean;
}

/**
 * Đọc ván đã lưu (UC04). Bản ghi diễn tiến lộ vai của cả làng nên chỉ người **đã ngồi trong ván
 * đó** hoặc quản trị viên (xem xét báo cáo — UC22) mới mở được.
 */
export class DichVuLichSu {
  constructor(private readonly khoVan: KhoVan) {}

  /** Các ván người này đã chơi, ván mới nhất trước. */
  lichSuCua(taiKhoanId: string): Promise<TomTatVan[]> {
    return this.khoVan.lichSuCua(taiKhoanId);
  }

  async xemVan(vanId: string, nguoiXem: NguoiXemVan): Promise<ChiTietVan> {
    const van = await this.khoVan.layVan(vanId);
    if (!van) throw new LoiNghiepVu('KHONG_TIM_THAY', `ván ${vanId}`);
    if (!nguoiXem.laQuanTri && !van.nguoiChoi.some((n) => n.id === nguoiXem.id)) {
      throw new LoiNghiepVu('KHONG_CO_QUYEN', 'chỉ người đã chơi ván này mới xem được');
    }
    return van;
  }
}
