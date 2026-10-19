import { LoaiHanhDong } from '../domain/chung/LoaiHanhDong.js';
import { LoiNghiepVu } from '../domain/chung/LoiNghiepVu.js';
import { BaoVe } from '../domain/vaitro/BaoVe.js';
import { PhuThuy } from '../domain/vaitro/PhuThuy.js';
import type { HanhDongDem } from '../domain/van/HanhDongDem.js';
import { KetQuaDem } from '../domain/van/KetQuaDem.js';
import { NguyenNhanChet } from '../domain/van/NguyenNhanChet.js';
import type { VanDau } from '../domain/van/VanDau.js';

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
