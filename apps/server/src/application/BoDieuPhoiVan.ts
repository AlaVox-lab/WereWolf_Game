import { LoaiHanhDong } from '../domain/chung/LoaiHanhDong.js';
import type { LoaiVai } from '../domain/chung/LoaiVai.js';
import { MaQuyTac } from '../domain/chung/MaQuyTac.js';
import { LoiNghiepVu } from '../domain/chung/LoiNghiepVu.js';
import type { NguonNgauNhien } from '../domain/chung/NguonNgauNhien.js';
import { Phe } from '../domain/chung/Phe.js';
import { TrangThaiVan } from '../domain/chung/TrangThaiVan.js';
import { PhienBauCu, type KetQuaPhien } from '../domain/baucu/PhienBauCu.js';
import type { CauHinhVai } from '../domain/luat/CauHinhVai.js';
import type { LuaChon, NguCanhHanhDong } from '../domain/vaitro/NguCanhHanhDong.js';
import type { HanhDongDem } from '../domain/van/HanhDongDem.js';
import type { KetQuaDem } from '../domain/van/KetQuaDem.js';
import type { LuotChoi } from '../domain/van/LuotChoi.js';
import type { NguoiChoi } from '../domain/van/NguoiChoi.js';
import { NguyenNhanChet } from '../domain/van/NguyenNhanChet.js';
import type { VanDau } from '../domain/van/VanDau.js';
import { BoChiaVai } from './BoChiaVai.js';
import { BoGiaiQuyetDem, type PhatBan } from './BoGiaiQuyetDem.js';
import type { BoHenGio } from './BoHenGio.js';
import { BoKiemTraThangThua, KetQuaThangThua } from './BoKiemTraThangThua.js';
import { BoQuanLyKenh } from './BoQuanLyKenh.js';
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

/** Kết quả một ngày: kết quả kiểm phiếu và các phát bắn của Thợ săn bị treo cổ. */
export interface KetQuaNgay {
  readonly ketQuaPhien: KetQuaPhien;
  readonly phatBan: readonly PhatBan[];
}

/** Phiếu thô từ ngoài vào: `{ mucTieuId: string }`, hoặc `{ mucTieuId: null }` là bỏ trắng. */
export function docPhieu(tho: unknown): string | null {
  if (typeof tho !== 'object' || tho === null || !('mucTieuId' in tho)) {
    throw new LoiNghiepVu('LUA_CHON_KHONG_HOP_LE', 'cần { mucTieuId }');
  }
  const { mucTieuId } = tho as { mucTieuId: unknown };
  if (mucTieuId !== null && typeof mucTieuId !== 'string') {
    throw new LoiNghiepVu('LUA_CHON_KHONG_HOP_LE', 'mucTieuId phải là chuỗi hoặc null');
  }
  return mucTieuId;
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
  private readonly boKiemTraThangThua = new BoKiemTraThangThua();
  /** Kênh trò chuyện của ván — mở đóng theo pha và theo lượt tập thể. */
  readonly quanLyKenh: BoQuanLyKenh;
  private congBoSang: readonly string[] = [];
  private ketQuaNgay: KetQuaNgay | null = null;
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
    this.quanLyKenh = new BoQuanLyKenh(van, () => this.dangLuotTapThe());
  }

  /** Vai đang tới lượt trong pha đêm, `null` ngoài pha đêm — cho kênh Sói và góc nhìn. */
  layBuocDemHienTai(): LoaiVai | null {
    return this.buocDemHienTai;
  }

  /** Pha đêm đang ở lượt hành động tập thể (lượt Sói) không — kênh Sói chỉ mở lúc này. */
  dangLuotTapThe(): boolean {
    const buoc = this.buocDemHienTai;
    return buoc !== null && this.cacVaiMau.taoVai(buoc).laHanhDongTapThe();
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

  /** Người chết đêm qua để công bố buổi sáng — **chỉ mã người chơi, không kèm nguyên nhân**. */
  layCongBoSang(): readonly string[] {
    return this.congBoSang;
  }

  /** Kết quả ngày gần nhất, `null` khi chưa có ngày nào. */
  layKetQuaNgay(): KetQuaNgay | null {
    return this.ketQuaNgay;
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
   * Chạy trọn một ván từ `PHA_DEM` tới khi có phe thắng — đêm, kiểm tra, ngày, kiểm tra, lặp lại
   * (sơ đồ hoạt động 8.1). Trả phe thắng.
   */
  async chayVan(): Promise<Phe> {
    for (;;) {
      await this.xuLyPhaDem();
      if (this.sauDem()) break;
      await this.xuLyPhaNgay();
      if (this.van.trangThai === TrangThaiVan.KET_THUC) break;
    }
    return this.van.pheThang!;
  }

  /**
   * Kiểm tra thắng thua **lần thứ nhất** của lượt, ngay sau giải quyết đêm (UC14 bước 6). Có phe
   * thắng thì kết thúc ván ngay — bỏ qua cả pha ngày (luồng 6a, TC15). Chưa thì ghi danh sách công
   * bố và sang `PHA_CONG_BO`. Trả `true` nếu ván đã kết thúc.
   */
  sauDem(): boolean {
    if (this.van.trangThai !== TrangThaiVan.GIAI_QUYET_DEM) {
      throw new LoiNghiepVu('CHUYEN_TRANG_THAI_KHONG_HOP_LE', `sau đêm khi ${this.van.trangThai}`);
    }
    const daKetThuc = this.kiemTraVaChuyen();
    if (!daKetThuc) {
      const ketQua = this.van.layLuotHienTai().ketQuaDem;
      this.congBoSang = ketQua ? ketQua.layDanhSachChet().map((c) => c.nguoiChoiId) : [];
    }
    return daKetThuc;
  }

  /**
   * Pha ngày (UC15, UC16): công bố → thảo luận có đếm giờ → bỏ phiếu (kèm vòng bầu lại nếu cần) →
   * thi hành treo cổ → dây chuyền Thợ săn → kiểm tra thắng thua **lần thứ hai**. Kết thúc ở
   * `PHA_DEM` của lượt kế tiếp hoặc `KET_THUC`.
   */
  async xuLyPhaNgay(): Promise<KetQuaNgay> {
    if (this.van.trangThai !== TrangThaiVan.PHA_CONG_BO) {
      throw new LoiNghiepVu(
        'CHUYEN_TRANG_THAI_KHONG_HOP_LE',
        `xử lý ngày khi ${this.van.trangThai}`,
      );
    }
    await this.choHen('cong-bo', this.thoiGian.congBo);
    this.van.chuyenPha('congBoXong');
    await this.choHen('thao-luan', this.thoiGian.thaoLuan);
    this.van.chuyenPha('hetGioThaoLuan');

    const ketQuaPhien = await this.boPhieu(this.van.layLuotHienTai());
    this.van.chuyenPha('ketThucBoPhieu');

    let phatBan: PhatBan[] = [];
    if (ketQuaPhien.loai === 'TREO_CO') {
      const id = ketQuaPhien.nguoiBiTreoId;
      this.van.danhDauChet([{ nguoiChoiId: id, nguyenNhan: NguyenNhanChet.BI_TREO_CO }]);
      phatBan = await this.boGiaiQuyetDem.xuLyDayChuyen(this.van, [id], (thoSan, ungVien) =>
        this.moiThoSanBan(thoSan, ungVien),
      );
    }
    this.ketQuaNgay = { ketQuaPhien, phatBan };
    this.kiemTraVaChuyen();
    return this.ketQuaNgay;
  }

  /**
   * Gọi `BoKiemTraThangThua` và chuyển pha theo kết quả — **một chỗ duy nhất** cho cả hai lần kiểm
   * tra mỗi lượt. Trả `true` nếu ván đã kết thúc.
   */
  private kiemTraVaChuyen(): boolean {
    const ketQua = this.boKiemTraThangThua.kiemTra(this.van);
    if (ketQua === KetQuaThangThua.CHUA_KET_THUC) {
      this.van.chuyenPha('chuaKetThuc');
      return false;
    }
    this.van.ketThuc(ketQua === KetQuaThangThua.PHE_SOI_THANG ? Phe.SOI : Phe.DAN);
    return true;
  }

  /** Phiên bỏ phiếu của lượt, kèm một vòng bầu lại khi hòa và BR11 tắt (UC16, UC16b, Q03). */
  private async boPhieu(luot: LuotChoi): Promise<KetQuaPhien> {
    const henGio = this.phuThuoc.boHenGio;
    const cuTri = this.van.layNguoiConSong().map((n) => n.id);
    const phien = new PhienBauCu(luot.soThuTu, cuTri, henGio.bayGio() + this.thoiGian.boPhieu);
    luot.ganPhienBauCu(phien);
    await this.thuPhieu(phien, this.thoiGian.boPhieu);
    const ketQua = phien.kiemPhieu(this.van.boLuatChoi);
    if (ketQua.loai !== 'BAU_LAI') return ketQua;

    const vongLai = phien.taoVongBauLai(henGio.bayGio() + this.thoiGian.bauLai);
    luot.ganPhienBauCu(vongLai);
    await this.thuPhieu(vongLai, this.thoiGian.bauLai);
    return vongLai.kiemPhieu(this.van.boLuatChoi);
  }

  /**
   * Mời mọi cử tri bỏ phiếu cùng lúc. Bộ kiểm của lời mời ghi luôn phiếu vào phiên — phiếu sai bị
   * từ chối và được bầu lại; ai không bầu tới hết giờ coi như bỏ trắng (UC16 luồng 2a).
   */
  private async thuPhieu(phien: PhienBauCu, thoiHan: number): Promise<void> {
    const henGio = this.phuThuoc.boHenGio;
    const cuTri = this.van.layNguoiConSong().filter((n) => !phien.daBoPhieu(n.id));
    await Promise.all(
      cuTri.map((n) =>
        this.phuThuoc.congLuaChon.cho(n.id, thoiHan, (tho) =>
          phien.ghiPhieu(n.id, docPhieu(tho), henGio.bayGio()),
        ),
      ),
    );
  }

  private choHen(ma: string, thoiHan: number): Promise<void> {
    return new Promise((xong) => this.phuThuoc.boHenGio.datHen(ma, thoiHan, xong));
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
