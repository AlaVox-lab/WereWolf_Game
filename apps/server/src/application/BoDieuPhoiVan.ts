import { LoaiHanhDong } from '../domain/chung/LoaiHanhDong.js';
import type { LoaiVai } from '../domain/chung/LoaiVai.js';
import { MaQuyTac } from '../domain/chung/MaQuyTac.js';
import { LoiNghiepVu } from '../domain/chung/LoiNghiepVu.js';
import type { NguonNgauNhien } from '../domain/chung/NguonNgauNhien.js';
import type { Phe } from '../domain/chung/Phe.js';
import { TrangThaiVan } from '../domain/chung/TrangThaiVan.js';
import type { CauHinhVai } from '../domain/luat/CauHinhVai.js';
import type { LuaChon, NguCanhHanhDong } from '../domain/vaitro/NguCanhHanhDong.js';
import type { HanhDongDem } from '../domain/van/HanhDongDem.js';
import type { KetQuaDem } from '../domain/van/KetQuaDem.js';
import type { LuotChoi } from '../domain/van/LuotChoi.js';
import type { NguoiChoi } from '../domain/van/NguoiChoi.js';
import type { VanDau } from '../domain/van/VanDau.js';
import { BoChiaVai } from './BoChiaVai.js';
import { BoGiaiQuyetDem } from './BoGiaiQuyetDem.js';
import type { BoHenGio } from './BoHenGio.js';
import { THOI_GIAN_MAC_DINH, type CauHinhThoiGian } from './CauHinhThoiGian.js';
import type { CongLuaChon } from './CongLuaChon.js';

/** Những gì bộ điều phối cần từ bên ngoài — tiêm vào để kiểm thử và mô phỏng thay được. */
export interface PhuThuocDieuPhoi {
  readonly boHenGio: BoHenGio;
  readonly congLuaChon: CongLuaChon;
  readonly nguonNgauNhien: NguonNgauNhien;
  readonly thoiGian?: CauHinhThoiGian;
}

/** Kết quả soi trả riêng cho Tiên tri (UC13 luồng con Tiên tri). */
export interface KetQuaSoi {
  readonly luot: number;
  readonly mucTieuId: string;
  readonly phe: Phe;
}

/** Chuyển lựa chọn thô từ ngoài vào (socket, người chơi ảo) thành `LuaChon` có kiểu. */
export function docLuaChon(tho: unknown): LuaChon {
  if (typeof tho !== 'object' || tho === null) {
    throw new LoiNghiepVu('LUA_CHON_KHONG_HOP_LE', 'cần một đối tượng');
  }
  const { mucTieuId, loai } = tho as Record<string, unknown>;
  if (typeof mucTieuId !== 'string') {
    throw new LoiNghiepVu('LUA_CHON_KHONG_HOP_LE', 'thiếu mucTieuId');
  }
  if (loai === undefined) return { mucTieuId };
  if (!Object.values(LoaiHanhDong).includes(loai as LoaiHanhDong)) {
    throw new LoiNghiepVu('LUA_CHON_KHONG_HOP_LE', `loai ${String(loai)}`);
  }
  return { mucTieuId, loai: loai as LoaiHanhDong };
}

/**
 * Bộ điều phối ván — **cửa duy nhất** đổi trạng thái ván (ARCHITECTURE.md mục 5.5), gọi các bộ xử
 * lý con theo đúng thứ tự. Hạng mục 2.2a: khung pha đêm, hiện thực mã giả mục 16.1 tài liệu gốc.
 *
 * Thứ tự gọi vai **không nằm trong thân hàm** mà sinh từ `doUuTien` của từng vai — thêm vai mới
 * chỉ cần thêm lớp con. Vòng lặp duyệt theo **cấu hình vai** (công khai), không theo người còn
 * sống, để độ dài đêm không làm lộ ai đã chết (Q05).
 */
export class BoDieuPhoiVan {
  private readonly thoiGian: CauHinhThoiGian;
  private readonly boGiaiQuyetDem = new BoGiaiQuyetDem();
  private readonly cacVaiMau: BoChiaVai;
  private buocDemHienTai: LoaiVai | null = null;
  private readonly ketQuaSoi = new Map<string, KetQuaSoi[]>();

  constructor(
    readonly van: VanDau,
    private readonly cauHinhVai: CauHinhVai,
    private readonly phuThuoc: PhuThuocDieuPhoi,
  ) {
    this.thoiGian = phuThuoc.thoiGian ?? THOI_GIAN_MAC_DINH;
    this.cacVaiMau = new BoChiaVai(phuThuoc.nguonNgauNhien);
  }

  /** Vai đang tới lượt trong pha đêm, `null` ngoài pha đêm — cho kênh Sói và góc nhìn. */
  layBuocDemHienTai(): LoaiVai | null {
    return this.buocDemHienTai;
  }

  /**
   * Thông tin báo trước cho Phù thủy trong đêm đang chạy (BR07): nạn nhân Sói đã chốt và mục tiêu
   * đó đã được Bảo vệ đỡ chưa. Tính từ ý định — góc nhìn (2.6) chỉ đưa cho Phù thủy, trong lượt
   * của Phù thủy.
   */
  layThongTinNanNhan(): { nanNhanId: string | null; anToan: boolean } {
    const luot = this.van.luotHienTai > 0 ? this.van.layLuotHienTai() : null;
    return BoGiaiQuyetDem.xemNanNhan(luot?.layYDinh() ?? []);
  }

  /** Mọi kết quả soi của một Tiên tri, theo thứ tự đêm. */
  layKetQuaSoi(tienTriId: string): readonly KetQuaSoi[] {
    return this.ketQuaSoi.get(tienTriId) ?? [];
  }

  /**
   * Thứ tự các bước đêm: mọi loại vai **có trong cấu hình** và hành động ban đêm, sắp theo
   * `doUuTien`. Không phụ thuộc ai còn sống (Q05).
   */
  layThuTuBuocDem(): LoaiVai[] {
    return Object.entries(this.cauHinhVai.layDanhSach())
      .filter(([, soLuong]) => soLuong > 0)
      .map(([loai]) => this.cacVaiMau.taoVai(loai as LoaiVai))
      .filter((vai) => vai.laHanhDongDem())
      .sort((a, b) => a.doUuTien - b.doUuTien)
      .map((vai) => vai.loaiVai);
  }

  /**
   * Chạy trọn pha đêm (UC13, UC14): mở lượt mới, gọi lần lượt từng bước, chuyển sang
   * `GIAI_QUYET_DEM`, giải quyết, chạy dây chuyền Thợ săn, chốt kết quả. Kiểm tra thắng thua và
   * chuyển pha tiếp theo là việc của hạng mục 2.3.
   */
  async xuLyPhaDem(): Promise<KetQuaDem> {
    if (this.van.trangThai !== TrangThaiVan.PHA_DEM) {
      throw new LoiNghiepVu(
        'CHUYEN_TRANG_THAI_KHONG_HOP_LE',
        `xử lý đêm khi ${this.van.trangThai}`,
      );
    }
    const luot = this.van.taoLuotMoi();
    for (const loai of this.layThuTuBuocDem()) {
      this.buocDemHienTai = loai;
      await this.chayBuoc(loai, luot);
    }
    this.buocDemHienTai = null;

    this.van.chuyenPha('ketThucDem');
    const ketQua = this.boGiaiQuyetDem.giaiQuyet(this.van);
    await this.boGiaiQuyetDem.xuLyDayChuyen(
      this.van,
      ketQua.layDanhSachChet().map((c) => c.nguoiChoiId),
      (thoSan, ungVien) => this.moiThoSanBan(thoSan, ungVien),
      ketQua,
    );
    ketQua.chot();
    return ketQua;
  }

  /**
   * Một bước đêm. Vai không còn ai sống: chờ giả (Q05). Vai hành động tập thể: cả nhóm đồng
   * thuận một ý định. Còn lại: mỗi người giữ vai hành động riêng, cùng lúc.
   */
  private async chayBuoc(loai: LoaiVai, luot: LuotChoi): Promise<void> {
    const nguoiGiu = this.van.layNguoiConSong().filter((n) => n.vaiTro.loaiVai === loai);
    const tapThe = this.cacVaiMau.taoVai(loai).laHanhDongTapThe();
    // Q01 — BR03 tắt: đêm 1 không ai chết, nên bỏ hẳn lượt cắn tập thể.
    if (tapThe && this.laDemDauKhongChet(luot)) return;
    if (nguoiGiu.length === 0) return this.choBuocGia();
    const thoiHan = this.thoiGian.luotVai[loai] ?? THOI_GIAN_MAC_DINH.luotVai[loai] ?? 25_000;
    if (tapThe) return this.chayBuocTapThe(nguoiGiu, luot, thoiHan);
    await Promise.all(
      nguoiGiu.map(async (nguoiChoi) => {
        const hanhDong = await this.moiHanhDong(nguoiChoi, luot, thoiHan);
        if (!hanhDong) return; // BR12 — hết giờ thì bỏ lượt
        luot.ghiYDinh(hanhDong);
        if (hanhDong.loaiHanhDong === LoaiHanhDong.SOI_THONG_TIN) {
          this.ghiKetQuaSoi(nguoiChoi.id, luot.soThuTu, hanhDong.mucTieuId);
        }
      }),
    );
  }

  /**
   * Lượt tập thể (UC13 luồng con Sói). Mỗi thành viên đề xuất qua `CongLuaChon`; đề xuất xong được
   * mời lại để **đổi ý** trong thời gian còn lại của bước. Chốt sớm khi mọi thành viên còn sống
   * cùng chọn một người. Hết giờ: chọn ngẫu nhiên trong các mục tiêu đã đề xuất (BR12); không ai
   * đề xuất thì không có ý định nào (Q07). Chỉ ghi **một** ý định cho cả nhóm.
   */
  private async chayBuocTapThe(
    nhom: readonly NguoiChoi[],
    luot: LuotChoi,
    thoiHan: number,
  ): Promise<void> {
    const henGio = this.phuThuoc.boHenGio;
    const hetHan = henGio.bayGio() + thoiHan;
    const deXuat = new Map<string, HanhDongDem>();
    const dongThuan = () =>
      deXuat.size === nhom.length &&
      new Set([...deXuat.values()].map((h) => h.mucTieuId)).size === 1;

    await Promise.all(
      nhom.map(async (thanhVien) => {
        for (;;) {
          const conLai = hetHan - henGio.bayGio();
          if (conLai <= 0 || dongThuan()) return;
          const hanhDong = await this.moiHanhDong(thanhVien, luot, conLai);
          if (!hanhDong) return;
          deXuat.set(thanhVien.id, hanhDong);
          if (dongThuan()) {
            for (const khac of nhom) this.phuThuoc.congLuaChon.huy(khac.id);
            return;
          }
        }
      }),
    );

    // Theo thứ tự ghế để kết quả chỉ phụ thuộc hạt giống, không phụ thuộc thứ tự bấm nút.
    const cacDeXuat = nhom.map((n) => deXuat.get(n.id)).filter((h) => h !== undefined);
    const mucTieu = [...new Set(cacDeXuat.map((h) => h.mucTieuId))];
    if (mucTieu.length === 0) return; // Q07
    const chon = mucTieu[this.phuThuoc.nguonNgauNhien.soNguyen(mucTieu.length)]!;
    luot.ghiYDinh(cacDeXuat.find((h) => h.mucTieuId === chon)!);
  }

  /** Mời một người hành động; lựa chọn được kiểm bằng chính luật của vai. */
  private moiHanhDong(
    nguoiChoi: NguoiChoi,
    luot: LuotChoi,
    thoiHan: number,
  ): Promise<HanhDongDem | null> {
    const nc = this.taoNguCanh(nguoiChoi, luot);
    return this.phuThuoc.congLuaChon.cho<HanhDongDem>(nguoiChoi.id, thoiHan, (tho) => {
      const hanhDong = nguoiChoi.vaiTro.thucHienLuot(nc, docLuaChon(tho));
      // Q01 — BR03 tắt: đêm 1 Phù thủy không được dùng độc.
      if (hanhDong.loaiHanhDong === LoaiHanhDong.DOC && this.laDemDauKhongChet(luot)) {
        throw new LoiNghiepVu('VI_PHAM_RANG_BUOC', 'BR03 tắt: đêm 1 không ai chết');
      }
      return hanhDong;
    });
  }

  /** BR03 tắt và đang ở đêm 1 (Q01). */
  private laDemDauKhongChet(luot: LuotChoi): boolean {
    return luot.soThuTu === 1 && !this.van.boLuatChoi.chophep(MaQuyTac.BR03);
  }

  /** Q05 — vai không còn ai sống vẫn "diễn" một bước dài ngẫu nhiên. */
  private choBuocGia(): Promise<void> {
    const { buocGiaToiThieu: min, buocGiaToiDa: max } = this.thoiGian;
    const thoiLuong = min + this.phuThuoc.nguonNgauNhien.soNguyen(max - min + 1);
    return new Promise((xong) => this.phuThuoc.boHenGio.datHen('buoc-gia', thoiLuong, xong));
  }

  private taoNguCanh(nguoiChoi: NguoiChoi, luot: LuotChoi): NguCanhHanhDong {
    return {
      van: this.van,
      luat: this.van.boLuatChoi,
      nguoiThucHien: nguoiChoi,
      // Phù thủy hành động sau Sói nên ý định cắn đã có trong lượt — BR07 tính từ ý định.
      nanNhanBiCanId: BoGiaiQuyetDem.xemNanNhan(luot.layYDinh()).nanNhanId,
    };
  }

  private ghiKetQuaSoi(tienTriId: string, luot: number, mucTieuId: string): void {
    const ketQua = { luot, mucTieuId, phe: this.van.layPheCua(mucTieuId) };
    this.ketQuaSoi.set(tienTriId, [...this.layKetQuaSoi(tienTriId), ketQua]);
  }

  private moiThoSanBan(thoSan: NguoiChoi, ungVien: readonly NguoiChoi[]): Promise<string | null> {
    const hopLe = ungVien.map((n) => n.id);
    return this.phuThuoc.congLuaChon.cho(thoSan.id, this.thoiGian.thoSanBan, (tho) => {
      const { mucTieuId } = docLuaChon(tho);
      if (!hopLe.includes(mucTieuId)) throw new LoiNghiepVu('MUC_TIEU_KHONG_HOP_LE', mucTieuId);
      return mucTieuId;
    });
  }
}
