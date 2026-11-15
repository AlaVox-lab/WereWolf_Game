// UC21 — người chơi báo cáo vi phạm của một người cùng ván. Báo cáo gắn mã ván nên nhật ký diễn
// tiến của ván đó tự đi kèm: quản trị viên mở lại bằng DichVuLichSu.xemVan().
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type { BaoCaoLuu, KhoBaoCao, KhoTaiKhoan, KhoVan } from '../kho/KhoDuLieu.js';

export const RANG_BUOC_BAO_CAO = { lyDoToiThieu: 5, lyDoToiDa: 500 } as const;

export class DichVuBaoCao {
  constructor(
    private readonly khoBaoCao: KhoBaoCao,
    private readonly khoVan: KhoVan,
    private readonly khoTaiKhoan: KhoTaiKhoan,
  ) {}

  /**
   * Chỉ người đã ngồi trong ván mới báo cáo được, và chỉ báo cáo một người thật khác cùng ván;
   * mỗi người chỉ báo cáo một người trong một ván một lần.
   */
  async baoCao(
    nguoiBaoCaoId: string,
    du: { vanId: string; nguoiBiBaoCaoId: string; lyDo: string },
  ): Promise<BaoCaoLuu> {
    const lyDo = du.lyDo.trim();
    if (lyDo.length < RANG_BUOC_BAO_CAO.lyDoToiThieu || lyDo.length > RANG_BUOC_BAO_CAO.lyDoToiDa) {
      throw new LoiNghiepVu('LY_DO_KHONG_HOP_LE');
    }
    if (du.nguoiBiBaoCaoId === nguoiBaoCaoId) throw new LoiNghiepVu('KHONG_TU_BAO_CAO');
    const van = await this.khoVan.layVan(du.vanId);
    if (!van) throw new LoiNghiepVu('KHONG_TIM_THAY', `ván ${du.vanId}`);
    const coMat = (id: string) => van.nguoiChoi.some((n) => n.id === id);
    if (!coMat(nguoiBaoCaoId)) throw new LoiNghiepVu('KHONG_CO_QUYEN', 'không chơi ván này');
    if (!coMat(du.nguoiBiBaoCaoId)) {
      throw new LoiNghiepVu('KHONG_TIM_THAY_NGUOI_CHOI', 'không có trong ván');
    }
    const biBaoCao = await this.khoTaiKhoan.timTheoId(du.nguoiBiBaoCaoId);
    if (!biBaoCao || biBaoCao.laNguoiChoiAo) throw new LoiNghiepVu('KHONG_BAO_CAO_NGUOI_AO');
    const trung = (await this.khoBaoCao.danhSach()).some(
      (b) =>
        b.vanId === du.vanId &&
        b.nguoiBaoCaoId === nguoiBaoCaoId &&
        b.nguoiBiBaoCaoId === du.nguoiBiBaoCaoId,
    );
    if (trung) throw new LoiNghiepVu('DA_BAO_CAO');
    return this.khoBaoCao.tao({
      vanId: du.vanId,
      nguoiBaoCaoId,
      nguoiBiBaoCaoId: du.nguoiBiBaoCaoId,
      lyDo,
    });
  }
}
