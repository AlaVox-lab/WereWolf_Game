import { BoChiaVai } from '../../application/BoChiaVai.js';
import { BoDieuPhoiVan } from '../../application/BoDieuPhoiVan.js';
import { BoHenGio } from '../../application/BoHenGio.js';
import type { CauHinhThoiGian } from '../../application/CauHinhThoiGian.js';
import { CongLuaChon } from '../../application/CongLuaChon.js';
import { DongHoGia } from '../../domain/chung/DongHo.js';
import type { LoaiVai } from '../../domain/chung/LoaiVai.js';
import { NgauNhienCoHat } from '../../domain/chung/NguonNgauNhien.js';
import type { Phe } from '../../domain/chung/Phe.js';
import { BoLuatChoi, type CauHinhBoLuat } from '../../domain/luat/BoLuatChoi.js';
import { CauHinhVai } from '../../domain/luat/CauHinhVai.js';
import { NguoiChoi } from '../../domain/van/NguoiChoi.js';
import type { SuKien } from '../../domain/van/NhatKyVan.js';
import { VanDau } from '../../domain/van/VanDau.js';
import { NguoiChoiAo, type CauHinhNguoiChoiAo } from './NguoiChoiAo.js';

export interface TuyChonMoPhong {
  readonly soNguoi: number;
  readonly hatGiong: number;
  /** Mặc định `CauHinhVai.macDinh(soNguoi)`. */
  readonly cauHinhVai?: CauHinhVai;
  readonly luat?: Partial<CauHinhBoLuat>;
  readonly thoiGian?: CauHinhThoiGian;
  readonly nguoiChoiAo?: CauHinhNguoiChoiAo;
  /** Chặn trên số lần nhảy đồng hồ — chống vòng lặp vô tận nếu có lỗi. */
  readonly gioiHanBuoc?: number;
  /** Gọi một lần ngay sau khi dựng bộ điều phối, trước khi ván chạy — để kiểm thử đăng ký nghe sự kiện. */
  readonly quanSat?: (dieuPhoi: BoDieuPhoiVan) => void;
}

export interface KetQuaMoPhong {
  readonly pheThang: Phe;
  readonly soLuot: number;
  /** Thời gian giả lập của cả ván, mili giây. */
  readonly thoiGianGiaLap: number;
  readonly vai: Readonly<Record<string, LoaiVai>>;
  /** Mã những người còn sống lúc kết thúc — trạng thái cuối để đối chiếu BR01/BR02. */
  readonly conSong: readonly string[];
  readonly nhatKy: readonly SuKien[];
}

/**
 * Chạy trọn một ván **toàn người chơi ảo** trên đồng hồ giả (hạng mục 2.9). Đi đúng đường bắt đầu
 * ván thật: người chơi chưa có vai → `batDauVan` → `BoChiaVai` → `chiaVaiXong` → `chayVan()`.
 *
 * Đồng hồ nhảy thẳng tới hẹn kế tiếp sau khi mọi lời hứa đang treo đã chạy xong — một ván mất vài
 * mili giây thật. Cùng tùy chọn và hạt giống cho cùng một ván (PC03).
 */
export async function moPhongMotVan(tuyChon: TuyChonMoPhong): Promise<KetQuaMoPhong> {
  const { soNguoi, hatGiong } = tuyChon;
  const cauHinhVai = tuyChon.cauHinhVai ?? CauHinhVai.macDinh(soNguoi);
  const nguoiChoi = Array.from(
    { length: soNguoi },
    (_, i) => new NguoiChoi(`p${i + 1}`, `ao-${i + 1}`, i + 1),
  );
  const van = new VanDau(
    `mo-phong-${hatGiong}`,
    'mo-phong',
    nguoiChoi,
    new BoLuatChoi(tuyChon.luat),
  );

  const dongHo = new DongHoGia();
  const boHenGio = new BoHenGio(dongHo);
  const cong = new CongLuaChon(boHenGio);
  const nguon = new NgauNhienCoHat(hatGiong);

  van.chuyenPha('batDauVan');
  const vai = new BoChiaVai(nguon).chiaVai(van, cauHinhVai);
  van.chuyenPha('chiaVaiXong');

  const dieuPhoi = new BoDieuPhoiVan(van, cauHinhVai, {
    boHenGio,
    congLuaChon: cong,
    nguonNgauNhien: nguon,
    ...(tuyChon.thoiGian ? { thoiGian: tuyChon.thoiGian } : {}),
  });
  tuyChon.quanSat?.(dieuPhoi);
  nguoiChoi.forEach((n, i) =>
    new NguoiChoiAo(
      n.id,
      dieuPhoi,
      cong,
      boHenGio,
      new NgauNhienCoHat(hatGiong * 1_000 + i),
      tuyChon.nguoiChoiAo,
    ).batDau(),
  );

  let xong = false;
  let loi: unknown;
  let pheThang: Phe | undefined;
  dieuPhoi.chayVan().then(
    (phe) => {
      xong = true;
      pheThang = phe;
    },
    (e) => {
      xong = true;
      loi = e;
    },
  );

  const gioiHan = tuyChon.gioiHanBuoc ?? 100_000;
  for (let buoc = 0; !xong; buoc++) {
    await new Promise<void>((r) => setImmediate(r)); // để mọi lời hứa đang treo chạy xong
    if (xong) break;
    if (buoc >= gioiHan) throw new Error(`Ván ${hatGiong} chưa kết thúc sau ${gioiHan} bước`);
    if (!dongHo.tuaToiHenKeTiep()) throw new Error(`Ván ${hatGiong} kẹt: không còn hẹn nào`);
  }
  if (loi) throw loi;

  return {
    pheThang: pheThang!,
    soLuot: van.luotHienTai,
    thoiGianGiaLap: dongHo.bayGio(),
    vai,
    conSong: van.layNguoiConSong().map((n) => n.id),
    nhatKy: van.nhatKy.xuatBanCongKhai(),
  };
}
