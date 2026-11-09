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
import type { LoaiSuKien } from '../domain/van/NhatKyVan.js';
import type { SuKienChuyenPha } from '../domain/van/trangthai/TrangThaiVanDau.js';
import type { VanDau } from '../domain/van/VanDau.js';
import { BoChiaVai } from './BoChiaVai.js';
import { BoGiaiQuyetDem, type PhatBan } from './BoGiaiQuyetDem.js';
import type { BoHenGio } from './BoHenGio.js';
import { BoKiemTraThangThua, KetQuaThangThua } from './BoKiemTraThangThua.js';
import { BoPhatSuKien, type DoiTuongNhan, type LoaiViec } from './BoPhatSuKien.js';
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

/** Một lời mời đang mở — để góc nhìn biết người đó đang phải làm gì, chọn trong những ai. */
export interface LoiMoiDangMo {
  readonly viec: LoaiViec;
  readonly hetHanLuc: number;
  readonly luaChon: readonly {
    readonly loai?: LoaiHanhDong;
    readonly mucTieu: readonly string[];
  }[];
  readonly choPhepBoTrang: boolean;
  /** Chỉ có trong lượt của vai được báo nạn nhân (Phù thủy — BR07). */
  readonly nanNhan?: { readonly nanNhanId: string | null; readonly anToan: boolean };
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
  /** Có vòng bầu lại không (Q03). */
  readonly coBauLai: boolean;
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
  /** Sự kiện của ván (Observer) — tầng thời gian thực, người chơi ảo, nhật ký đăng ký nghe ở đây. */
  readonly suKien: BoPhatSuKien;
  private congBoSang: readonly string[] = [];
  private ketQuaNgay: KetQuaNgay | null = null;
  private readonly cacVaiMau: BoChiaVai;
  private buocDemHienTai: LoaiVai | null = null;
  private readonly ketQuaSoi = new Map<string, KetQuaSoi[]>();
  private readonly loiMoi = new Map<string, LoiMoiDangMo>();
  private hetHanPha: number | null = null;

  constructor(
    readonly van: VanDau,
    private readonly cauHinhVai: CauHinhVai,
    private readonly phuThuoc: PhuThuocDieuPhoi,
  ) {
    this.thoiGian = phuThuoc.thoiGian ?? THOI_GIAN_MAC_DINH;
    this.cacVaiMau = new BoChiaVai(phuThuoc.nguonNgauNhien);
    this.suKien = new BoPhatSuKien((doiTuong) => this.layNguoiNhan(doiTuong));
    this.quanLyKenh = new BoQuanLyKenh(
      van,
      () => this.dangLuotTapThe(),
      (tinNhan) =>
        this.suKien.phat({ loai: 'TIN_NHAN', tinNhan }, { loai: 'KENH', kenh: tinNhan.kenh }),
    );
  }

  /** Dịch đối tượng nhận thành mã người chơi — kênh tính theo quyền xem **lúc phát**. */
  private layNguoiNhan(doiTuong: DoiTuongNhan): readonly string[] {
    switch (doiTuong.loai) {
      case 'TAT_CA':
        return this.van.layDanhSachNguoiChoi().map((n) => n.id);
      case 'NGUOI_CHOI':
        return [doiTuong.nguoiChoiId];
      case 'KENH':
        return this.quanLyKenh.layNguoiXem(doiTuong.kenh);
    }
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

  /** Lời mời đang mở của một người, `null` nếu không được mời gì lúc này. */
  layLoiMoi(nguoiChoiId: string): LoiMoiDangMo | null {
    return this.loiMoi.get(nguoiChoiId) ?? null;
  }

  /** Hạn của pha ngày đang chạy (công bố, thảo luận, bỏ phiếu); ban đêm luôn `null` (Q05). */
  layHetHanPha(): number | null {
    return this.hetHanPha;
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
    this.hetHanPha = null;
    if (luot.soThuTu === 1) {
      this.ghi('CHIA_VAI', {
        vai: Object.fromEntries(
          this.van.layDanhSachNguoiChoi().map((n) => [n.id, n.vaiTro.loaiVai]),
        ),
      });
    }
    for (const loai of this.layThuTuBuocDem()) {
      this.datBuocDem(loai);
      await this.chayBuoc(loai, luot);
    }
    this.datBuocDem(null);

    this.chuyen('ketThucDem');
    const ketQua = this.boGiaiQuyetDem.giaiQuyet(this.van);
    const phatBan = await this.boGiaiQuyetDem.xuLyDayChuyen(
      this.van,
      ketQua.layDanhSachChet().map((c) => c.nguoiChoiId),
      (thoSan, ungVien) => this.moiThoSanBan(thoSan, ungVien),
      ketQua,
    );
    ketQua.chot();
    this.ghi('KET_QUA_DEM', {
      luot: luot.soThuTu,
      nguoiChet: ketQua.layDanhSachChet().map((c) => ({ ...c })),
      nguoiDuocCuu: [...ketQua.layDanhSachDuocCuu()],
    });
    this.ghiNguoiChet(ketQua.layDanhSachChet(), phatBan);
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
    // Ghi danh sách công bố TRƯỚC khi chuyển pha: góc nhìn chụp lúc phát CHUYEN_PHA sang
    // PHA_CONG_BO phải thấy người chết của đêm nay, không phải của đêm trước.
    const ketQua = this.van.layLuotHienTai().ketQuaDem;
    this.congBoSang = ketQua ? ketQua.layDanhSachChet().map((c) => c.nguoiChoiId) : [];
    const daKetThuc = this.kiemTraVaChuyen();
    if (daKetThuc) {
      this.congBoSang = []; // ván xong lúc trời sáng — không có buổi công bố (TC15)
    } else {
      this.suKien.phat({ loai: 'CONG_BO_SANG', nguoiChet: this.congBoSang }, { loai: 'TAT_CA' });
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
    this.chuyen('congBoXong');
    await this.choHen('thao-luan', this.thoiGian.thaoLuan);
    this.chuyen('hetGioThaoLuan');

    const ketQuaPhien = await this.boPhieu(this.van.layLuotHienTai());
    const coBauLai = this.van.layLuotHienTai().layDanhSachPhienBauCu().length > 1;
    // Ghi kết quả kiểm phiếu ngay — trước khi Thợ săn bị treo kịp chọn mục tiêu.
    this.ghi('KET_QUA_BO_PHIEU', { luot: this.van.luotHienTai, ketQuaPhien, coBauLai });
    this.chuyen('ketThucBoPhieu');

    let phatBan: PhatBan[] = [];
    if (ketQuaPhien.loai === 'TREO_CO') {
      const treoCo = {
        nguoiChoiId: ketQuaPhien.nguoiBiTreoId,
        nguyenNhan: NguyenNhanChet.BI_TREO_CO,
      };
      this.van.danhDauChet([treoCo]);
      this.ghiNguoiChet([treoCo], []); // ghi ngay lúc thi hành, trước khi Thợ săn chọn
      phatBan = await this.boGiaiQuyetDem.xuLyDayChuyen(
        this.van,
        [treoCo.nguoiChoiId],
        (thoSan, ungVien) => this.moiThoSanBan(thoSan, ungVien),
      );
      this.ghiNguoiChet(
        phatBan.map((p) => ({ nguoiChoiId: p.mucTieuId, nguyenNhan: NguyenNhanChet.BI_BAN })),
        phatBan,
      );
    }
    this.ketQuaNgay = { ketQuaPhien, coBauLai, phatBan };
    this.hetHanPha = null;
    this.suKien.phat({ loai: 'KET_QUA_NGAY', ketQua: this.ketQuaNgay }, { loai: 'TAT_CA' });
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
      this.chuyen('chuaKetThuc');
      return false;
    }
    const pheThang = ketQua === KetQuaThangThua.PHE_SOI_THANG ? Phe.SOI : Phe.DAN;
    this.ghi('KET_THUC', { pheThang, luot: this.van.luotHienTai }); // trước ketThuc() — nó đóng nhật ký
    this.van.ketThuc(pheThang);
    this.suKien.phat({ loai: 'KET_THUC', pheThang }, { loai: 'TAT_CA' });
    return true;
  }

  /** Phiên bỏ phiếu của lượt, kèm một vòng bầu lại khi hòa và BR11 tắt (UC16, UC16b, Q03). */
  private async boPhieu(luot: LuotChoi): Promise<KetQuaPhien> {
    const henGio = this.phuThuoc.boHenGio;
    const cuTri = this.van.layNguoiConSong().map((n) => n.id);
    const phien = new PhienBauCu(luot.soThuTu, cuTri, henGio.bayGio() + this.thoiGian.boPhieu);
    this.hetHanPha = phien.thoiHan;
    luot.ganPhienBauCu(phien);
    await this.thuPhieu(phien, this.thoiGian.boPhieu);
    const ketQua = phien.kiemPhieu(this.van.boLuatChoi);
    if (ketQua.loai !== 'BAU_LAI') return ketQua;

    const vongLai = phien.taoVongBauLai(henGio.bayGio() + this.thoiGian.bauLai);
    this.hetHanPha = vongLai.thoiHan;
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
        this.moi(
          n.id,
          thoiHan,
          {
            viec: 'BO_PHIEU',
            luaChon: [{ mucTieu: phien.layDanhSachUngVien() }],
            choPhepBoTrang: true,
          },
          (tho) => {
            const phieu = phien.ghiPhieu(n.id, docPhieu(tho), henGio.bayGio());
            this.ghi('PHIEU_BAU', {
              luot: phien.soLuot,
              vongBauLai: phien.laVongBauLai,
              nguoiBauId: phieu.nguoiBauId,
              nguoiBiBauId: phieu.nguoiBiBauId,
            });
            return phieu;
          },
        ),
      ),
    );
  }

  /**
   * Ghi một sự kiện vào nhật ký ván (2.7) — thời điểm lấy từ `BoHenGio`, nhật ký không tự đọc giờ.
   * Nhật ký mang cả thông tin bí mật; chỉ mở khi ván kết thúc.
   */
  private ghi(loai: LoaiSuKien, duLieu: Record<string, unknown>): void {
    this.van.nhatKy.ghiSuKien(loai, duLieu, this.phuThuoc.boHenGio.bayGio());
  }

  /** Ghi ý định vào lượt và vào nhật ký cùng lúc — hai nơi không bao giờ lệch nhau. */
  private ghiYDinh(luot: LuotChoi, hanhDong: HanhDongDem): void {
    luot.ghiYDinh(hanhDong);
    this.ghi('Y_DINH', {
      luot: luot.soThuTu,
      nguoiThucHienId: hanhDong.nguoiThucHienId,
      loaiHanhDong: hanhDong.loaiHanhDong,
      mucTieuId: hanhDong.mucTieuId,
    });
  }

  /** Ghi từng người chết kèm nguyên nhân; người bị Thợ săn bắn ghi cả người bắn. */
  private ghiNguoiChet(
    danhSach: readonly { nguoiChoiId: string; nguyenNhan: NguyenNhanChet }[],
    phatBan: readonly PhatBan[],
  ): void {
    for (const { nguoiChoiId, nguyenNhan } of danhSach) {
      const nguoiBan = phatBan.find((p) => p.mucTieuId === nguoiChoiId)?.nguoiBanId;
      this.ghi('NGUOI_CHET', {
        luot: this.van.luotHienTai,
        nguoiChoiId,
        nguyenNhan,
        ...(nguoiBan ? { nguoiBanId: nguoiBan } : {}),
      });
    }
  }

  /** Đổi pha qua `VanDau` rồi phát `CHUYEN_PHA` cho cả làng. */
  private chuyen(suKienPha: SuKienChuyenPha): void {
    const trangThai = this.van.chuyenPha(suKienPha);
    this.ghi('CHUYEN_PHA', { trangThai, luot: this.van.luotHienTai });
    this.suKien.phat(
      { loai: 'CHUYEN_PHA', trangThai, luot: this.van.luotHienTai },
      { loai: 'TAT_CA' },
    );
  }

  /** Đổi bước đêm và phát `DOI_BUOC_DEM` — thứ tự bước vốn công khai theo cấu hình (Q05). */
  private datBuocDem(buoc: LoaiVai | null): void {
    this.buocDemHienTai = buoc;
    this.suKien.phat({ loai: 'DOI_BUOC_DEM', buoc }, { loai: 'TAT_CA' });
  }

  /** Mời một người qua `CongLuaChon` và phát `MOI_HANH_DONG` **riêng cho người đó**. */
  private moi<T>(
    nguoiChoiId: string,
    thoiHan: number,
    moTa: Omit<LoiMoiDangMo, 'hetHanLuc'>,
    kiemTra: (tho: unknown) => T,
  ): Promise<T | null> {
    const cong = this.phuThuoc.congLuaChon;
    const hua = cong.cho(nguoiChoiId, thoiHan, kiemTra);
    const hetHanLuc = cong.layHetHanLuc(nguoiChoiId)!;
    const loiMoi: LoiMoiDangMo = { ...moTa, hetHanLuc };
    this.loiMoi.set(nguoiChoiId, loiMoi);
    // Chỉ xóa đúng lời mời này — Sói đổi ý được mời lại ngay, không được xóa nhầm lời mời mới.
    void hua.finally(() => {
      if (this.loiMoi.get(nguoiChoiId) === loiMoi) this.loiMoi.delete(nguoiChoiId);
    });
    this.suKien.phat(
      { loai: 'MOI_HANH_DONG', nguoiChoiId, viec: moTa.viec, hetHanLuc },
      { loai: 'NGUOI_CHOI', nguoiChoiId },
    );
    return hua;
  }

  /** Chờ một pha ngày có đếm giờ — hạn được công khai cho cả làng qua góc nhìn. */
  private choHen(ma: string, thoiHan: number): Promise<void> {
    return new Promise((xong) => {
      this.hetHanPha = this.phuThuoc.boHenGio.datHen(ma, thoiHan, xong);
    });
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
        this.ghiYDinh(luot, hanhDong);
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
    this.ghiYDinh(
      luot,
      cacDeXuat.find((h) => h.mucTieuId === chon)!,
    );
  }

  /** Mời một người hành động; lựa chọn được kiểm bằng chính luật của vai. */
  private moiHanhDong(
    nguoiChoi: NguoiChoi,
    luot: LuotChoi,
    thoiHan: number,
  ): Promise<HanhDongDem | null> {
    const nc = this.taoNguCanh(nguoiChoi, luot);
    const demDauKhongChet = this.laDemDauKhongChet(luot);
    const cacNhom = nguoiChoi.vaiTro
      .layCacLuaChon(nc)
      .filter((nhom) => !(demDauKhongChet && nhom.loai === LoaiHanhDong.DOC))
      .map((nhom) => ({
        ...(nhom.loai ? { loai: nhom.loai } : {}),
        mucTieu: nhom.mucTieu.map((m) => m.id),
      }));
    const moTa = {
      viec: 'HANH_DONG_DEM' as const,
      luaChon: cacNhom,
      choPhepBoTrang: false,
      // Vai có nhóm "cứu" là vai được báo nạn nhân — BR07.
      ...(cacNhom.some((n) => n.loai === LoaiHanhDong.CUU)
        ? { nanNhan: this.layThongTinNanNhan() }
        : {}),
    };
    return this.moi<HanhDongDem>(nguoiChoi.id, thoiHan, moTa, (tho) => {
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
    this.ghi('KET_QUA_SOI', { tienTriId, ...ketQua });
    this.suKien.phat(
      { loai: 'KET_QUA_SOI', ...ketQua },
      { loai: 'NGUOI_CHOI', nguoiChoiId: tienTriId },
    );
  }

  private moiThoSanBan(thoSan: NguoiChoi, ungVien: readonly NguoiChoi[]): Promise<string | null> {
    const hopLe = ungVien.map((n) => n.id);
    const moTa = {
      viec: 'THO_SAN_BAN' as const,
      luaChon: [{ mucTieu: hopLe }],
      choPhepBoTrang: false,
    };
    return this.moi(thoSan.id, this.thoiGian.thoSanBan, moTa, (tho) => {
      const { mucTieuId } = docLuaChon(tho);
      if (!hopLe.includes(mucTieuId)) throw new LoiNghiepVu('MUC_TIEU_KHONG_HOP_LE', mucTieuId);
      return mucTieuId;
    });
  }
}
