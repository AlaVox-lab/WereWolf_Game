import { LoaiVai } from '../domain/chung/LoaiVai.js';
import { LoiNghiepVu } from '../domain/chung/LoiNghiepVu.js';
import type { Phe } from '../domain/chung/Phe.js';
import type { NguonNgauNhien } from '../domain/chung/NguonNgauNhien.js';
import { TrangThaiVan } from '../domain/chung/TrangThaiVan.js';
import type { CauHinhVai } from '../domain/luat/CauHinhVai.js';
import { BaoVe } from '../domain/vaitro/BaoVe.js';
import { DanLang } from '../domain/vaitro/DanLang.js';
import { PhuThuy } from '../domain/vaitro/PhuThuy.js';
import { Soi } from '../domain/vaitro/Soi.js';
import { ThoSan } from '../domain/vaitro/ThoSan.js';
import { TienTri } from '../domain/vaitro/TienTri.js';
import type { VaiTro } from '../domain/vaitro/VaiTro.js';
import type { VanDau } from '../domain/van/VanDau.js';

/**
 * Bảng ánh xạ loại vai → lớp cụ thể. Thêm vai mới chỉ cần thêm một dòng ở đây và một lớp con
 * của `VaiTro` — nơi gọi `BoChiaVai` không đổi.
 */
const NHA_MAY_VAI: Readonly<Record<LoaiVai, () => VaiTro>> = {
  [LoaiVai.DanLang]: () => new DanLang(),
  [LoaiVai.BaoVe]: () => new BaoVe(),
  [LoaiVai.Soi]: () => new Soi(),
  [LoaiVai.TienTri]: () => new TienTri(),
  [LoaiVai.PhuThuy]: () => new PhuThuy(),
  [LoaiVai.ThoSan]: () => new ThoSan(),
};

/**
 * Phe của một loại vai — hỏi chính lớp vai qua bảng factory, không chép luật. Kho dữ liệu dùng để
 * biết người chơi thắng hay thua khi đọc lại ván cũ (bảng nguoi_choi_trong_van chỉ lưu loại vai).
 */
export function pheCuaVai(loai: LoaiVai): Phe {
  return NHA_MAY_VAI[loai]().phe;
}

/**
 * Bộ chia vai (UC12) — mẫu **Factory**: sinh đối tượng `VaiTro` theo `CauHinhVai` mà nơi gọi không
 * cần biết lớp cụ thể; xáo trộn bằng cổng `NguonNgauNhien` để cùng hạt giống cho cùng kết quả.
 *
 * Chỉ gán vai. Chuyển pha (`chiaVaiXong`), ghi nhật ký và gửi thông báo vai riêng cho từng người
 * là việc của bộ điều phối.
 */
export class BoChiaVai {
  constructor(private readonly nguonNgauNhien: NguonNgauNhien) {}

  /** Factory method — tạo một đối tượng vai mới theo loại. */
  taoVai(loai: LoaiVai): VaiTro {
    return NHA_MAY_VAI[loai]();
  }

  /** Sinh danh sách vai theo cấu hình, theo thứ tự khai báo của `LoaiVai`, chưa xáo trộn. */
  sinhDanhSachVai(cauHinh: CauHinhVai): VaiTro[] {
    return Object.values(LoaiVai).flatMap((loai) =>
      Array.from({ length: cauHinh.soLuong(loai) }, () => this.taoVai(loai)),
    );
  }

  /** Xáo trộn Fisher–Yates trên một bản sao — mọi hoán vị có xác suất như nhau. */
  xaoTron<T>(danhSach: readonly T[]): T[] {
    const ketQua = [...danhSach];
    for (let i = ketQua.length - 1; i > 0; i--) {
      const j = this.nguonNgauNhien.soNguyen(i + 1);
      [ketQua[i], ketQua[j]] = [ketQua[j]!, ketQua[i]!];
    }
    return ketQua;
  }

  /**
   * Chia vai cho mọi người chơi của ván (UC12 bước 1–4). Ván phải đang `DANG_CHIA_VAI` và chưa ai
   * nhận vai. Cấu hình sai thì ném `CAU_HINH_VAI_KHONG_HOP_LE` **trước khi** gán bất cứ ai
   * (luồng ngoại lệ 2a). Trả về bảng người chơi → loại vai để ghi nhật ký.
   */
  chiaVai(van: VanDau, cauHinh: CauHinhVai): Record<string, LoaiVai> {
    if (van.trangThai !== TrangThaiVan.DANG_CHIA_VAI) {
      throw new LoiNghiepVu('CHUYEN_TRANG_THAI_KHONG_HOP_LE', `chia vai khi đang ${van.trangThai}`);
    }
    const nguoiChoi = van.layDanhSachNguoiChoi();
    if (nguoiChoi.some((n) => n.daNhanVai())) {
      throw new LoiNghiepVu('DA_NHAN_VAI', 'ván đã được chia vai');
    }
    const viPham = cauHinh.kiemTraHopLe(nguoiChoi.length);
    if (viPham.length > 0) {
      throw new LoiNghiepVu('CAU_HINH_VAI_KHONG_HOP_LE', viPham.map((v) => v.ma).join(', '));
    }

    const vai = this.xaoTron(this.sinhDanhSachVai(cauHinh));
    const bang: Record<string, LoaiVai> = {};
    nguoiChoi.forEach((n, i) => {
      const v = vai[i]!;
      n.nhanVai(v);
      bang[n.id] = v.loaiVai;
    });
    return bang;
  }
}
