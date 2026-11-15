import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import type { DongHo } from '../../domain/chung/DongHo.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type { NguonNgauNhien } from '../../domain/chung/NguonNgauNhien.js';
import type { Phe } from '../../domain/chung/Phe.js';
import { TrangThaiVan } from '../../domain/chung/TrangThaiVan.js';
import type { LoaiKenh } from '../../domain/kenh/KenhChat.js';
import type { CauHinhVai } from '../../domain/luat/CauHinhVai.js';
import type { PhongChoi } from '../../domain/phong/PhongChoi.js';
import type { VanDau } from '../../domain/van/VanDau.js';
import { BoChiaVai } from '../BoChiaVai.js';
import { BoDieuPhoiVan } from '../BoDieuPhoiVan.js';
import { BoHenGio } from '../BoHenGio.js';
import type { SuKienMien } from '../BoPhatSuKien.js';
import type { CauHinhThoiGian } from '../CauHinhThoiGian.js';
import { CongLuaChon } from '../CongLuaChon.js';
import { taoGocNhin } from '../taoGocNhin.js';

/** Người chơi ảo của một ghế — bản cài ở infrastructure/bot, truyền vào từ main.ts. */
export interface NguoiChoiAoChay {
  batDau(): void;
  dung(): void;
}

export interface PhuThuocSoDangKyVan {
  dongHo: DongHo;
  nguonNgauNhien: NguonNgauNhien;
  thoiGian?: CauHinhThoiGian;
  /** Quãng để mọi người xem thẻ vai trước đêm đầu (MH04), mili giây. */
  thoiGianXemVai?: number;
  taoNguoiChoiAo?: (
    nguoiChoiId: string,
    dieuPhoi: BoDieuPhoiVan,
    cong: CongLuaChon,
    boHenGio: BoHenGio,
  ) => NguoiChoiAoChay;
}

export interface VanDangChay {
  vanId: string;
  maPhong: string;
  van: VanDau;
  cauHinhVai: CauHinhVai;
  dieuPhoi: BoDieuPhoiVan;
  cong: CongLuaChon;
  boHenGio: BoHenGio;
  batDauLuc: number;
  nguoiAo: ReadonlySet<string>;
  /** Phe thắng; `null` khi ván bị hủy (Q04). Có khi ván đã xong. */
  ketQua?: Phe | null;
}

/** Sự kiện của một ván, kèm danh sách người nhận lúc phát. */
export type NgheVan = (vanId: string, suKien: SuKienMien, nguoiNhan: readonly string[]) => void;

const XEM_VAI_MAC_DINH = 8_000;

/**
 * Sổ đăng ký ván đang chạy (UC11) — sống trong bộ nhớ; ván lưu vào cơ sở dữ liệu khi kết thúc
 * (4.10). Cửa duy nhất mà tầng thời gian thực gửi lựa chọn của người chơi vào ván: mọi lựa chọn
 * đi qua `CongLuaChon`, giống hệt người chơi ảo (nguyên tắc 2.5).
 */
export class SoDangKyVan {
  private readonly van = new Map<string, VanDangChay>();
  private readonly vanCuaNguoi = new Map<string, string>();
  private readonly nguoiNghe = new Set<NgheVan>();
  private readonly ngheKetThuc = new Set<(v: VanDangChay) => void | Promise<void>>();
  private readonly botCuaVan = new Map<string, NguoiChoiAoChay[]>();
  private soTiep = 1;

  constructor(private readonly phu: PhuThuocSoDangKyVan) {}

  dangKy(nghe: NgheVan): () => void {
    this.nguoiNghe.add(nghe);
    return () => this.nguoiNghe.delete(nghe);
  }

  /** Nghe ván kết thúc hoặc bị hủy — lưu ván (4.10), mở lại phòng. */
  dangKyKetThuc(nghe: (v: VanDangChay) => void | Promise<void>): () => void {
    this.ngheKetThuc.add(nghe);
    return () => this.ngheKetThuc.delete(nghe);
  }

  /**
   * UC11 — chủ phòng bắt đầu ván: dựng `VanDau` từ phòng, chia vai (`BoChiaVai`, UC12), dựng
   * `BoDieuPhoiVan`, cho người chơi ảo vào chỗ, chờ mọi người xem thẻ rồi chạy vòng ván.
   */
  batDau(
    phong: PhongChoi,
    chuPhongId: string,
    laNguoiChoiAo: (id: string) => boolean,
  ): VanDangChay {
    const vanId = `van-${this.phu.dongHo.bayGio().toString(36)}-${this.soTiep++}`;
    const van = phong.batDauVan(chuPhongId, vanId);
    const cauHinhVai = phong.layCauHinhVai();
    van.chuyenPha('batDauVan');
    new BoChiaVai(this.phu.nguonNgauNhien).chiaVai(van, cauHinhVai);
    van.chuyenPha('chiaVaiXong');

    const boHenGio = new BoHenGio(this.phu.dongHo);
    const cong = new CongLuaChon(boHenGio);
    const dieuPhoi = new BoDieuPhoiVan(van, cauHinhVai, {
      boHenGio,
      congLuaChon: cong,
      nguonNgauNhien: this.phu.nguonNgauNhien,
      ...(this.phu.thoiGian ? { thoiGian: this.phu.thoiGian } : {}),
    });
    const nguoiAo = new Set(
      van
        .layDanhSachNguoiChoi()
        .map((n) => n.id)
        .filter(laNguoiChoiAo),
    );
    const dangChay: VanDangChay = {
      vanId,
      maPhong: phong.maPhong,
      van,
      cauHinhVai,
      dieuPhoi,
      cong,
      boHenGio,
      batDauLuc: this.phu.dongHo.bayGio(),
      nguoiAo,
    };
    this.van.set(vanId, dangChay);
    for (const n of van.layDanhSachNguoiChoi()) this.vanCuaNguoi.set(n.id, vanId);

    dieuPhoi.suKien.dangKy((sk, nguoiNhan) => {
      for (const nghe of this.nguoiNghe) nghe(vanId, sk, nguoiNhan);
    });
    const bot = [...nguoiAo].flatMap((id) => {
      const b = this.phu.taoNguoiChoiAo?.(id, dieuPhoi, cong, boHenGio);
      return b ? [b] : [];
    });
    bot.forEach((b) => b.batDau());
    this.botCuaVan.set(vanId, bot);

    boHenGio.datHen(`${vanId}:xem-vai`, this.phu.thoiGianXemVai ?? XEM_VAI_MAC_DINH, () => {
      dieuPhoi.chayVan().then(
        (phe) => this.ketThuc(dangChay, phe),
        () => this.ketThuc(dangChay, null),
      );
    });
    return dangChay;
  }

  lay(vanId: string): VanDangChay {
    const v = this.van.get(vanId);
    if (!v) throw new LoiNghiepVu('KHONG_TIM_THAY', `ván ${vanId}`);
    return v;
  }

  /** Ván người chơi đang ở, nếu có. */
  vanCua(nguoiChoiId: string): string | null {
    return this.vanCuaNguoi.get(nguoiChoiId) ?? null;
  }

  /** Góc nhìn của một người — dữ liệu duy nhất về ván được gửi xuống trình duyệt (PC04). */
  gocNhin(vanId: string, nguoiChoiId: string): GocNhinNguoiChoi {
    return taoGocNhin(this.lay(vanId).dieuPhoi, nguoiChoiId);
  }

  /** Lệnh `van:hanh-dong`, `van:bo-phieu` — lựa chọn thô vào đúng cửa người chơi ảo dùng. */
  guiLuaChon(nguoiChoiId: string, luaChonTho: unknown): void {
    const vanId = this.vanCua(nguoiChoiId);
    if (!vanId) throw new LoiNghiepVu('KHONG_CO_YEU_CAU', 'không ở trong ván nào');
    this.lay(vanId).cong.ghiNhan(nguoiChoiId, luaChonTho);
  }

  /** UC18 — gửi tin vào một kênh; quyền gửi do `BoQuanLyKenh` kiểm (BR14). */
  guiTin(nguoiChoiId: string, kenh: LoaiKenh, noiDung: string): void {
    const vanId = this.vanCua(nguoiChoiId);
    if (!vanId) throw new LoiNghiepVu('KHONG_DUOC_GUI', 'không ở trong ván nào');
    this.lay(vanId).dieuPhoi.quanLyKenh.guiTinNhan(
      nguoiChoiId,
      kenh,
      noiDung,
      this.phu.dongHo.bayGio(),
    );
  }

  /**
   * Q04 — hủy ván đang chạy: đóng mọi lời mời, dừng đồng hồ và người chơi ảo của ván, báo kết thúc
   * ngay (không chờ vòng ván — nó có thể đang đợi một hẹn vừa bị hủy).
   */
  huyVan(vanId: string): void {
    const v = this.lay(vanId);
    if (v.van.trangThai === TrangThaiVan.KET_THUC || v.van.trangThai === TrangThaiVan.HUY_VAN)
      return;
    v.van.huyVan();
    v.cong.huyTatCa();
    this.ketThuc(v, null);
  }

  /** Mọi ván còn chạy — tầng thời gian thực dùng cho BR13 và đóng máy chủ êm. */
  dangChay(): VanDangChay[] {
    return [...this.van.values()];
  }

  private ketThuc(v: VanDangChay, phe: Phe | null): void {
    if (!this.van.has(v.vanId)) return;
    v.ketQua = phe;
    this.botCuaVan.get(v.vanId)?.forEach((b) => b.dung());
    this.botCuaVan.delete(v.vanId);
    v.boHenGio.huyTatCa();
    this.van.delete(v.vanId);
    for (const n of v.van.layDanhSachNguoiChoi()) {
      if (this.vanCuaNguoi.get(n.id) === v.vanId) this.vanCuaNguoi.delete(n.id);
    }
    for (const nghe of this.ngheKetThuc) {
      void Promise.resolve(nghe(v)).catch((loi) => console.error('Lỗi khi kết thúc ván', loi));
    }
  }
}
