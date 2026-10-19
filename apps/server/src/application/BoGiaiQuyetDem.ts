import { LoaiHanhDong } from '../domain/chung/LoaiHanhDong.js';
import { LoiNghiepVu } from '../domain/chung/LoiNghiepVu.js';
import { MaQuyTac } from '../domain/chung/MaQuyTac.js';
import { BaoVe } from '../domain/vaitro/BaoVe.js';
import { PhuThuy } from '../domain/vaitro/PhuThuy.js';
import type { HanhDongDem } from '../domain/van/HanhDongDem.js';
import { KetQuaDem } from '../domain/van/KetQuaDem.js';
import type { NguoiChoi } from '../domain/van/NguoiChoi.js';
import { NguyenNhanChet } from '../domain/van/NguyenNhanChet.js';
import type { VanDau } from '../domain/van/VanDau.js';

/**
 * Hỏi một Thợ săn vừa bị loại muốn bắn ai (UC17). Trả mã người chơi trong `ungVien`, hoặc `null`
 * nếu bỏ qua hay hết giờ. Ở máy chủ thật đây là `CongLuaChon` (hạng mục 2.1); trong kiểm thử là
 * một kịch bản trả lời sẵn.
 */
export type ChonMucTieuThoSan = (
  thoSan: NguoiChoi,
  ungVien: readonly NguoiChoi[],
) => Promise<string | null>;

/** Một phát bắn đã thực hiện trong dây chuyền — để ghi nhật ký và công bố. */
export interface PhatBan {
  readonly nguoiBanId: string;
  readonly mucTieuId: string;
}

/** Ngữ cảnh truyền dọc chuỗi bước giải quyết — mỗi bước đọc và sửa được kết quả bước trước. */
interface NguCanhGiaiQuyet {
  readonly van: VanDau;
  duocBaoVe: string | null;
  biCan: string | null;
  biDoc: string | null;
  /** Phù thủy cứu, kèm người cứu — để trừ lọ ở bước kết luận chỉ khi thuốc thực sự có tác dụng. */
  cuu: { phuThuyId: string; mucTieuId: string } | null;
}

/** Một mắt xích của chuỗi: xử lý đúng một loại ý định. */
interface BuocGiaiQuyet {
  readonly loai: LoaiHanhDong;
  xuLy(nc: NguCanhGiaiQuyet, hanhDong: HanhDongDem): void;
}

const buocBaoVe: BuocGiaiQuyet = {
  loai: LoaiHanhDong.BAO_VE,
  xuLy(nc, hd) {
    nc.duocBaoVe = hd.mucTieuId;
  },
};

const buocCan: BuocGiaiQuyet = {
  loai: LoaiHanhDong.CAN,
  xuLy(nc, hd) {
    nc.biCan = hd.mucTieuId;
  },
};

const buocCuu: BuocGiaiQuyet = {
  loai: LoaiHanhDong.CUU,
  xuLy(nc, hd) {
    nc.cuu = { phuThuyId: hd.nguoiThucHienId, mucTieuId: hd.mucTieuId };
  },
};

const buocDoc: BuocGiaiQuyet = {
  loai: LoaiHanhDong.DOC,
  xuLy(nc, hd) {
    nc.biDoc = hd.mucTieuId;
    // Thuốc độc luôn có tác dụng — trừ lọ ngay khi áp dụng.
    layPhuThuy(nc.van, hd.nguoiThucHienId).truThuocDoc();
  },
};

function layPhuThuy(van: VanDau, nguoiChoiId: string): PhuThuy {
  const vai = van.layNguoiChoi(nguoiChoiId).vaiTro;
  if (!(vai instanceof PhuThuy)) throw new Error(`${nguoiChoiId} không phải Phù thủy`);
  return vai;
}

/**
 * Bộ giải quyết đêm (UC14) — nơi **duy nhất** biến ý định thành hậu quả (ARCHITECTURE.md mục 6).
 *
 * **Chain of Responsibility**: ý định được sắp theo `doUuTien` rồi lần lượt đưa vào mắt xích
 * ứng với loại của nó. Thứ tự sinh từ `doUuTien` của vai, không viết cứng. Ý định `SOI_THONG_TIN`
 * là chỉ đọc nên không có mắt xích nào nhận.
 *
 * Bảng xung đột: `game-rules.md` mục 3. Dây chuyền Thợ săn (BR09, BR10) bổ sung ở hạng mục 1.6.
 */
export class BoGiaiQuyetDem {
  private readonly chuoiBuoc: readonly BuocGiaiQuyet[] = [buocBaoVe, buocCan, buocCuu, buocDoc];

  /**
   * Thông tin báo trước cho Phù thủy (BR07): nạn nhân Sói vừa chọn và mục tiêu đó đã được Bảo vệ
   * đỡ chưa — tính từ **ý định** đã ghi, chưa áp dụng gì. `BoDieuPhoiVan` gọi trước lượt Phù thủy.
   */
  static xemNanNhan(yDinh: readonly HanhDongDem[]): { nanNhanId: string | null; anToan: boolean } {
    const can = yDinh.find((h) => h.loaiHanhDong === LoaiHanhDong.CAN);
    const baoVe = yDinh.find((h) => h.loaiHanhDong === LoaiHanhDong.BAO_VE);
    const nanNhanId = can?.mucTieuId ?? null;
    return { nanNhanId, anToan: nanNhanId !== null && nanNhanId === baoVe?.mucTieuId };
  }

  /**
   * Giải quyết đêm của lượt hiện tại: áp hiệu ứng, cập nhật trạng thái riêng của vai, đánh dấu
   * người chết, gắn `KetQuaDem` vào lượt. Kết quả **chưa chốt** — dây chuyền Thợ săn (1.6) còn
   * thêm người vào.
   */
  giaiQuyet(van: VanDau): KetQuaDem {
    const luot = van.layLuotHienTai();
    // Chặn ngay từ đầu, trước khi trừ lọ hay đổi Bảo vệ.
    if (luot.ketQuaDem) throw new LoiNghiepVu('DEM_DA_GIAI_QUYET', `lượt ${luot.soThuTu}`);
    const nc: NguCanhGiaiQuyet = { van, duocBaoVe: null, biCan: null, biDoc: null, cuu: null };

    const yDinh = [...luot.layYDinh()].sort((a, b) => a.doUuTien - b.doUuTien);
    for (const hd of yDinh) {
      this.chuoiBuoc.find((b) => b.loai === hd.loaiHanhDong)?.xuLy(nc, hd);
    }

    const ketQua = new KetQuaDem(luot.soThuTu);

    // Cú cắn vô hiệu khi mục tiêu được Bảo vệ đỡ (BR07) hoặc được cứu.
    if (nc.biCan !== null) {
      const duocDo = nc.biCan === nc.duocBaoVe;
      const duocCuu = nc.cuu?.mucTieuId === nc.biCan;
      if (duocDo || duocCuu) {
        ketQua.themNguoiDuocCuu(nc.biCan);
      } else {
        ketQua.themNguoiChet(nc.biCan, NguyenNhanChet.BI_CAN);
      }
      // Lọ cứu chỉ mất khi thuốc thực sự cứu — đã được đỡ thì không mất (BR07, TC04).
      if (duocCuu && !duocDo) layPhuThuy(van, nc.cuu!.phuThuyId).truThuocCuu();
    }

    // Độc trúng người đã chết vì cắn thì không tính thêm (BR08) — KetQuaDem tự bỏ qua trùng.
    if (nc.biDoc !== null) ketQua.themNguoiChet(nc.biDoc, NguyenNhanChet.BI_DOC);

    this.capNhatBaoVe(van, yDinh);
    van.danhDauChet(ketQua.layDanhSachChet());
    luot.ganKetQuaDem(ketQua);
    return ketQua;
  }

  /**
   * Dây chuyền kỹ năng lúc chết (UC17, mục 16.3 tài liệu gốc). `nguoiVuaChet` là những người
   * **vừa được đánh dấu chết** — sau `giaiQuyet()` ban đêm, hoặc sau khi thi hành treo cổ ban ngày.
   *
   * Dùng **hàng đợi, không đệ quy**. Mỗi phát bắn đánh dấu chết ngay, nên người đã chết tự rơi
   * khỏi danh sách ứng viên của lần hỏi sau — mỗi vòng có thêm ít nhất một người chết, số người
   * hữu hạn, nên thuật toán luôn dừng. Người bị bắn là Thợ săn thì vào hàng đợi (BR10).
   *
   * BR09 tắt: Thợ săn chết vì **treo cổ** không được bắn; chết vì cách khác vẫn bắn được (Q02).
   *
   * Truyền `ketQuaDem` khi xử lý ban đêm để người bị bắn vào danh sách chết của đêm. Người gọi tự
   * `chot()` kết quả sau khi dây chuyền xong.
   */
  async xuLyDayChuyen(
    van: VanDau,
    nguoiVuaChet: readonly string[],
    chonMucTieu: ChonMucTieuThoSan,
    ketQuaDem?: KetQuaDem,
  ): Promise<PhatBan[]> {
    const hangDoi = [...nguoiVuaChet];
    const phatBan: PhatBan[] = [];

    while (hangDoi.length > 0) {
      const nguoiChoi = van.layNguoiChoi(hangDoi.shift()!);
      const vai = nguoiChoi.vaiTro;
      if (!vai.coKyNangKhiChet()) continue;
      if (
        nguoiChoi.nguyenNhanChet === NguyenNhanChet.BI_TREO_CO &&
        !van.boLuatChoi.chophep(MaQuyTac.BR09)
      ) {
        continue;
      }

      const nc = { van, luat: van.boLuatChoi, nguoiThucHien: nguoiChoi };
      const ungVien = vai.layDanhSachMucTieu(nc).map((m) => van.layNguoiChoi(m.id));
      if (ungVien.length === 0) continue;
      const mucTieuId = await chonMucTieu(nguoiChoi, ungVien);
      // Bỏ qua, hết giờ (UC17 luồng 2a), hoặc chọn ngoài danh sách thì không ai bị bắn.
      if (mucTieuId === null || !ungVien.some((m) => m.id === mucTieuId)) continue;

      vai.kichHoatKhiChet(nc, { mucTieuId }); // kiểm lại qua khung Template Method của vai
      van.danhDauChet([{ nguoiChoiId: mucTieuId, nguyenNhan: NguyenNhanChet.BI_BAN }]);
      ketQuaDem?.themNguoiChet(mucTieuId, NguyenNhanChet.BI_BAN);
      phatBan.push({ nguoiBanId: nguoiChoi.id, mucTieuId });
      hangDoi.push(mucTieuId);
    }
    return phatBan;
  }

  /** BR06: Bảo vệ nhớ người đã đỡ đêm nay; Bảo vệ còn sống mà bỏ lượt thì xóa mục tiêu cũ. */
  private capNhatBaoVe(van: VanDau, yDinh: readonly HanhDongDem[]): void {
    for (const nguoiChoi of van.layNguoiConSong()) {
      const vai = nguoiChoi.vaiTro;
      if (!(vai instanceof BaoVe)) continue;
      const cuaMinh = yDinh.find(
        (h) => h.loaiHanhDong === LoaiHanhDong.BAO_VE && h.nguoiThucHienId === nguoiChoi.id,
      );
      vai.capNhatMucTieuDemTruoc(cuaMinh?.mucTieuId ?? null);
    }
  }
}
