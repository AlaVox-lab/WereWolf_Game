import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import { MaQuyTac } from '../chung/MaQuyTac.js';

/** Sáu thuộc tính của bộ luật — tên giữ đúng như Class Diagram và `game-rules.md` mục 2. */
export interface CauHinhBoLuat {
  batDemDauCoChet: boolean;
  camPhuThuyTuCuu: boolean;
  choBaoVeTuDo: boolean;
  camDoTrungDem: boolean;
  thoSanBanKhiTreoCo: boolean;
  hoaPhieuKhongAiChet: boolean;
}

type ThuocTinhQuyTac = keyof CauHinhBoLuat;

/** Một dòng tóm tắt bộ luật để hiển thị ở phòng chờ và màn cấu hình (UC25 bước 2 và 6). */
export interface MoTaQuyTac {
  ma: MaQuyTac;
  thuocTinh: ThuocTinhQuyTac;
  dangBat: boolean;
  noiDung: string;
}

/** Một vi phạm khi kiểm tra tổ hợp quy tắc (UC25 luồng ngoại lệ 4a). */
export interface ViPhamBoLuat {
  ma: MaQuyTac;
  lyDo: string;
}

/** Sáu quy tắc tùy biến, theo đúng thứ tự mã. Nội dung chép từ `game-rules.md` mục 2. */
const QUY_TAC_TUY_BIEN: ReadonlyArray<{
  ma: MaQuyTac;
  thuocTinh: ThuocTinhQuyTac;
  noiDung: string;
}> = [
  {
    ma: MaQuyTac.BR03,
    thuocTinh: 'batDemDauCoChet',
    noiDung: 'Đêm đầu tiên Sói được cắn bình thường',
  },
  { ma: MaQuyTac.BR04, thuocTinh: 'camPhuThuyTuCuu', noiDung: 'Phù thủy không được tự cứu mình' },
  { ma: MaQuyTac.BR05, thuocTinh: 'choBaoVeTuDo', noiDung: 'Bảo vệ được tự bảo vệ mình' },
  {
    ma: MaQuyTac.BR06,
    thuocTinh: 'camDoTrungDem',
    noiDung: 'Bảo vệ không được đỡ cùng một người hai đêm liên tiếp',
  },
  {
    ma: MaQuyTac.BR09,
    thuocTinh: 'thoSanBanKhiTreoCo',
    noiDung: 'Thợ săn được bắn cả khi bị cắn lẫn khi bị treo cổ',
  },
  {
    ma: MaQuyTac.BR11,
    thuocTinh: 'hoaPhieuKhongAiChet',
    noiDung: 'Bỏ phiếu hòa thì không ai bị treo cổ',
  },
];

/**
 * Bộ luật chơi — mẫu Strategy (ARCHITECTURE.md mục 5.3). Đóng gói sáu quy tắc tùy biến; lớp
 * vai và bộ xử lý không đọc thuộc tính mà luôn hỏi qua `chophep()`.
 *
 * Bộ luật của phòng sửa được bằng `datQuyTac()` khi ván chưa bắt đầu. Lúc bắt đầu ván, `VanDau`
 * giữ bản `saoChep()` — bản đó **bị khóa**, mọi lần sửa đều ném `BO_LUAT_DA_KHOA` (TC20). Sửa bộ
 * luật của phòng sau đó không làm đổi bản của ván đang chạy.
 */
export class BoLuatChoi {
  private batDemDauCoChet: boolean;
  private camPhuThuyTuCuu: boolean;
  private choBaoVeTuDo: boolean;
  private camDoTrungDem: boolean;
  private thoSanBanKhiTreoCo: boolean;
  private hoaPhieuKhongAiChet: boolean;
  private daKhoa = false;

  /** Mặc định bật cả sáu quy tắc — đúng như câu chữ của chúng trong tài liệu gốc. */
  constructor(tuyChon: Partial<CauHinhBoLuat> = {}) {
    this.batDemDauCoChet = tuyChon.batDemDauCoChet ?? true;
    this.camPhuThuyTuCuu = tuyChon.camPhuThuyTuCuu ?? true;
    this.choBaoVeTuDo = tuyChon.choBaoVeTuDo ?? true;
    this.camDoTrungDem = tuyChon.camDoTrungDem ?? true;
    this.thoSanBanKhiTreoCo = tuyChon.thoSanBanKhiTreoCo ?? true;
    this.hoaPhieuKhongAiChet = tuyChon.hoaPhieuKhongAiChet ?? true;
  }

  /** Mã của sáu quy tắc chủ phòng bật tắt được. */
  static danhSachQuyTacTuyBien(): MaQuyTac[] {
    return QUY_TAC_TUY_BIEN.map((q) => q.ma);
  }

  /**
   * Quy tắc `maQuyTac` có đang bật không. Tám quy tắc cố định luôn bật — chúng không có công tắc.
   */
  chophep(maQuyTac: MaQuyTac): boolean {
    const quyTac = QUY_TAC_TUY_BIEN.find((q) => q.ma === maQuyTac);
    return quyTac ? this.layGiaTri()[quyTac.thuocTinh] : true;
  }

  /** Bật hoặc tắt một quy tắc tùy biến (UC25 bước 3). */
  datQuyTac(maQuyTac: MaQuyTac, dangBat: boolean): void {
    if (this.daKhoa) {
      throw new LoiNghiepVu('BO_LUAT_DA_KHOA', `không sửa được ${maQuyTac} khi ván đang chạy`);
    }
    const quyTac = QUY_TAC_TUY_BIEN.find((q) => q.ma === maQuyTac);
    if (!quyTac) {
      throw new LoiNghiepVu('QUY_TAC_CO_DINH', `${maQuyTac} là quy tắc cố định`);
    }
    this[quyTac.thuocTinh] = dangBat;
  }

  /**
   * Kiểm tra tổ hợp quy tắc đang chọn (UC25 bước 4). Tài liệu gốc chưa nêu tổ hợp nào bị cấm —
   * xem Q12 trong `game-rules.md` — nên hiện mọi tổ hợp đều hợp lệ. Giữ phương thức làm điểm
   * mở rộng: thêm ràng buộc giữa các quy tắc thì thêm ở đây.
   */
  kiemTraHopLe(): ViPhamBoLuat[] {
    return [];
  }

  /** Tóm tắt sáu quy tắc kèm trạng thái bật/tắt, theo thứ tự mã. */
  layMoTa(): MoTaQuyTac[] {
    const giaTri = this.layGiaTri();
    return QUY_TAC_TUY_BIEN.map((q) => ({
      ma: q.ma,
      thuocTinh: q.thuocTinh,
      dangBat: giaTri[q.thuocTinh],
      noiDung: q.noiDung,
    }));
  }

  /** Bản sao đã khóa và đóng băng — `VanDau` giữ bản này suốt ván. */
  saoChep(): BoLuatChoi {
    const banSao = new BoLuatChoi(this.layGiaTri());
    banSao.daKhoa = true;
    Object.freeze(banSao);
    return banSao;
  }

  /** Bộ luật này có đang bị khóa (thuộc một ván đang chạy) không. */
  dangKhoa(): boolean {
    return this.daKhoa;
  }

  /** Giá trị sáu thuộc tính dưới dạng đối tượng thuần — để lưu và để sao chép. */
  layGiaTri(): CauHinhBoLuat {
    return {
      batDemDauCoChet: this.batDemDauCoChet,
      camPhuThuyTuCuu: this.camPhuThuyTuCuu,
      choBaoVeTuDo: this.choBaoVeTuDo,
      camDoTrungDem: this.camDoTrungDem,
      thoSanBanKhiTreoCo: this.thoSanBanKhiTreoCo,
      hoaPhieuKhongAiChet: this.hoaPhieuKhongAiChet,
    };
  }
}
