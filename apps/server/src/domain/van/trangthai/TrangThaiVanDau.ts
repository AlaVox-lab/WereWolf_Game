import { LoiNghiepVu } from '../../chung/LoiNghiepVu.js';
import { TrangThaiVan } from '../../chung/TrangThaiVan.js';

/**
 * Sự kiện chuyển pha — tên đặt đúng theo nhãn trên sơ đồ `06-state-van-dau.puml`.
 * `thoaDieuKien` (kết thúc) và `quaNguongMatKetNoi` (hủy) đi qua `VanDau.ketThuc()` và
 * `VanDau.huyVan()` vì chúng ghi thêm dữ liệu; các sự kiện còn lại đi qua `VanDau.chuyenPha()`.
 */
export type SuKienChuyenPha =
  | 'batDauVan'
  | 'chiaVaiXong'
  | 'ketThucDem'
  | 'chuaKetThuc'
  | 'congBoXong'
  | 'hetGioThaoLuan'
  | 'ketThucBoPhieu';

/**
 * Mẫu **State** cho vòng đời `VanDau` (ARCHITECTURE.md mục 7). Mỗi trạng thái là một lớp, chỉ
 * ghi đè đúng những sự kiện có mũi tên đi ra trên sơ đồ; mọi sự kiện khác rơi về bản mặc định
 * và ném `CHUYEN_TRANG_THAI_KHONG_HOP_LE`. Không có khối `switch` theo tên trạng thái.
 *
 * Mười lớp để chung một tệp có chủ ý: mọi trạng thái đều có thể sang `HuyVan`, tách tệp thì
 * lớp cơ sở và lớp con nhập vòng nhau và ES module không nạp được lớp con lúc kế thừa.
 */
export abstract class TrangThaiVanDau {
  abstract readonly ma: TrangThaiVan;

  batDauVan(): TrangThaiVanDau {
    return this.khongHopLe('batDauVan');
  }
  chiaVaiXong(): TrangThaiVanDau {
    return this.khongHopLe('chiaVaiXong');
  }
  /** Hết giờ hoặc mọi vai đã hành động. */
  ketThucDem(): TrangThaiVanDau {
    return this.khongHopLe('ketThucDem');
  }
  /** Kiểm tra thắng thua cho kết quả chưa kết thúc. */
  chuaKetThuc(): TrangThaiVanDau {
    return this.khongHopLe('chuaKetThuc');
  }
  /** Kiểm tra thắng thua cho kết quả đã có phe thắng. */
  thoaDieuKien(): TrangThaiVanDau {
    return this.khongHopLe('thoaDieuKien');
  }
  congBoXong(): TrangThaiVanDau {
    return this.khongHopLe('congBoXong');
  }
  hetGioThaoLuan(): TrangThaiVanDau {
    return this.khongHopLe('hetGioThaoLuan');
  }
  /** Đủ phiếu hoặc hết giờ bỏ phiếu. */
  ketThucBoPhieu(): TrangThaiVanDau {
    return this.khongHopLe('ketThucBoPhieu');
  }

  /** Q04: quá ngưỡng mất kết nối thì hủy ván — từ mọi trạng thái chưa kết thúc. */
  quaNguongMatKetNoi(): TrangThaiVanDau {
    return new HuyVan();
  }

  /** Chủ phòng chỉ đổi được bộ luật khi ván chưa bắt đầu (UC25 luồng 1a, TC20). */
  choPhepDoiBoLuat(): boolean {
    return false;
  }

  /** Trạng thái cuối — không còn chuyển đi đâu được. */
  laTrangThaiCuoi(): boolean {
    return false;
  }

  protected khongHopLe(suKien: string): never {
    throw new LoiNghiepVu('CHUYEN_TRANG_THAI_KHONG_HOP_LE', `${suKien} khi đang ${this.ma}`);
  }
}

export class ChoDuNguoi extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.CHO_DU_NGUOI;
  override batDauVan(): TrangThaiVanDau {
    return new DangChiaVai();
  }
  override choPhepDoiBoLuat(): boolean {
    return true;
  }
}

export class DangChiaVai extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.DANG_CHIA_VAI;
  override chiaVaiXong(): TrangThaiVanDau {
    return new PhaDem();
  }
}

export class PhaDem extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.PHA_DEM;
  override ketThucDem(): TrangThaiVanDau {
    return new GiaiQuyetDem();
  }
}

export class GiaiQuyetDem extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.GIAI_QUYET_DEM;
  override chuaKetThuc(): TrangThaiVanDau {
    return new PhaCongBo();
  }
  /** Kiểm tra thắng thua ngay sau giải quyết đêm — bỏ qua pha ngày (UC14 luồng 6a, TC15). */
  override thoaDieuKien(): TrangThaiVanDau {
    return new KetThuc();
  }
}

export class PhaCongBo extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.PHA_CONG_BO;
  override congBoXong(): TrangThaiVanDau {
    return new PhaThaoLuan();
  }
}

export class PhaThaoLuan extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.PHA_THAO_LUAN;
  override hetGioThaoLuan(): TrangThaiVanDau {
    return new PhaBoPhieu();
  }
}

export class PhaBoPhieu extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.PHA_BO_PHIEU;
  override ketThucBoPhieu(): TrangThaiVanDau {
    return new GiaiQuyetPhieu();
  }
}

export class GiaiQuyetPhieu extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.GIAI_QUYET_PHIEU;
  /** Chưa ai thắng — sang đêm của lượt kế tiếp. */
  override chuaKetThuc(): TrangThaiVanDau {
    return new PhaDem();
  }
  override thoaDieuKien(): TrangThaiVanDau {
    return new KetThuc();
  }
}

export class KetThuc extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.KET_THUC;
  override quaNguongMatKetNoi(): TrangThaiVanDau {
    return this.khongHopLe('quaNguongMatKetNoi');
  }
  override laTrangThaiCuoi(): boolean {
    return true;
  }
}

export class HuyVan extends TrangThaiVanDau {
  readonly ma = TrangThaiVan.HUY_VAN;
  override quaNguongMatKetNoi(): TrangThaiVanDau {
    return this.khongHopLe('quaNguongMatKetNoi');
  }
  override laTrangThaiCuoi(): boolean {
    return true;
  }
}
