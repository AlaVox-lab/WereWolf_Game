// UC05 — bảng xếp hạng mùa hiện tại (MH10). Điểm cộng đã tính lúc lưu ván (Q14, DichVuLuuVan).
import type { DongXepHang, KhoXepHang } from '../kho/KhoDuLieu.js';

export interface BangXepHang {
  mua: { id: string; ten: string; batDau: Date };
  /** Đã sắp: điểm cao trước; bằng điểm xét tỉ lệ thắng rồi số ván (Q14). */
  dong: (DongXepHang & { hang: number })[];
}

export class DichVuXepHang {
  constructor(private readonly khoXepHang: KhoXepHang) {}

  /** Hạng tính theo thứ tự kho trả; cùng điểm, cùng tỉ lệ thắng, cùng số ván thì cùng hạng. */
  async bangMuaHienTai(): Promise<BangXepHang> {
    const mua = await this.khoXepHang.muaHienTai();
    const ds = await this.khoXepHang.bangXepHang(mua.id);
    const khoa = (d: DongXepHang) => `${d.diem}|${d.soVan ? d.soThang / d.soVan : 0}|${d.soVan}`;
    let hang = 0;
    const dong = ds.map((d, i) => {
      if (i === 0 || khoa(d) !== khoa(ds[i - 1]!)) hang = i + 1;
      return { ...d, hang };
    });
    return { mua, dong };
  }
}
