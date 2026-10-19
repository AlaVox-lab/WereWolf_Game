import type {
  GocNhinNguoiChoi,
  KetQuaNgayCongKhai,
  LoaiKenhCongKhai,
  LoaiVaiCongKhai,
  NhomLuaChonCongKhai,
  PheCongKhai,
  TrangThaiVanCongKhai,
} from '@moonvillage/shared';
import { Phe } from '../domain/chung/Phe.js';
import { TrangThaiVan } from '../domain/chung/TrangThaiVan.js';
import type { BoDieuPhoiVan } from './BoDieuPhoiVan.js';

/**
 * Chiếu trạng thái ván thành **góc nhìn của đúng một người** (ARCHITECTURE.md mục 8, PC04).
 *
 * Đây là con đường **duy nhất** đưa dữ liệu ván xuống trình duyệt. Mọi trường được chọn tường
 * minh — không tuần tự hóa nguyên `VanDau` hay `NguoiChoi`. Quy tắc:
 *
 * - Vai, phe, trạng thái kỹ năng: **chỉ của chính mình**. Đồng đội chỉ khi mình là Sói.
 * - Người khác: chỉ mã, ghế, còn sống hay không — **kể cả người đã chết** (Q09).
 * - Việc cần làm và danh sách mục tiêu: chỉ của mình; nạn nhân đêm chỉ Phù thủy, trong lượt mình.
 * - Kết quả soi: chỉ Tiên tri, của chính mình.
 * - Công bố và kết quả ngày: chỉ ai chết, không nguyên nhân, không ai bắn ai.
 * - Tiến độ bỏ phiếu: số đếm, không tên.
 * - Vai của tất cả: chỉ khi ván đã `KET_THUC`.
 */
export function taoGocNhin(dieuPhoi: BoDieuPhoiVan, nguoiChoiId: string): GocNhinNguoiChoi {
  const van = dieuPhoi.van;
  const toi = van.layNguoiChoi(nguoiChoiId);
  const vai = toi.vaiTro;
  const daKetThuc = van.trangThai === TrangThaiVan.KET_THUC;
  const kenh = dieuPhoi.quanLyKenh;

  const loiMoi = dieuPhoi.layLoiMoi(nguoiChoiId);
  const ketQuaNgay = dieuPhoi.layKetQuaNgay();
  const phien = van.luotHienTai > 0 ? van.layLuotHienTai().phienBauCu : null;
  const dangBoPhieu = van.trangThai === TrangThaiVan.PHA_BO_PHIEU && phien !== null;

  return {
    vanId: van.id,
    trangThai: van.trangThai as TrangThaiVanCongKhai,
    luot: van.luotHienTai,
    buocDem: dieuPhoi.layBuocDemHienTai() as LoaiVaiCongKhai | null,
    hetHanPha: dieuPhoi.layHetHanPha(),
    toi: {
      id: toi.id,
      loaiVai: vai.loaiVai as LoaiVaiCongKhai,
      tenVai: vai.tenVai,
      phe: vai.phe as PheCongKhai,
      moTaNangLuc: vai.moTaNangLuc,
      conSong: toi.conSong,
      dongDoi:
        vai.phe === Phe.SOI
          ? van
              .layDanhSachNguoiChoi()
              .filter((n) => n.id !== toi.id && n.vaiTro.phe === Phe.SOI)
              .map((n) => n.id)
          : null,
      trangThaiKyNang: { ...vai.layTrangThaiKyNang() },
    },
    nguoiChoi: van
      .layDanhSachNguoiChoi()
      .map((n) => ({ id: n.id, thuTuGhe: n.thuTuGhe, conSong: n.conSong })),
    viecCanLam: loiMoi
      ? {
          viec: loiMoi.viec,
          hetHanLuc: loiMoi.hetHanLuc,
          luaChon: loiMoi.luaChon.map((nhom) => ({
            ...(nhom.loai ? { loai: nhom.loai as NonNullable<NhomLuaChonCongKhai['loai']> } : {}),
            mucTieu: [...nhom.mucTieu],
          })),
          choPhepBoTrang: loiMoi.choPhepBoTrang,
          ...(loiMoi.nanNhan ? { nanNhan: { ...loiMoi.nanNhan } } : {}),
        }
      : null,
    ketQuaSoi: dieuPhoi
      .layKetQuaSoi(nguoiChoiId)
      .map((k) => ({ luot: k.luot, mucTieuId: k.mucTieuId, phe: k.phe as PheCongKhai })),
    congBoSang: [...dieuPhoi.layCongBoSang()],
    ketQuaNgay: ketQuaNgay ? chieuKetQuaNgay(ketQuaNgay) : null,
    tienDoBoPhieu: dangBoPhieu
      ? { daBau: phien.layDanhSachPhieu().length, tong: phien.laySoCuTri() }
      : null,
    boLuat: van.boLuatChoi
      .layMoTa()
      .map((q) => ({ ma: q.ma, dangBat: q.dangBat, noiDung: q.noiDung })),
    kenhXemDuoc: kenh.cacKenhXemDuoc(nguoiChoiId) as LoaiKenhCongKhai[],
    kenhGuiDuoc: kenh
      .cacKenhXemDuoc(nguoiChoiId)
      .filter((k) => kenh.coTheGui(nguoiChoiId, k)) as LoaiKenhCongKhai[],
    ketThuc:
      daKetThuc && van.pheThang
        ? {
            pheThang: van.pheThang as PheCongKhai,
            vai: van.layDanhSachNguoiChoi().map((n) => ({
              id: n.id,
              loaiVai: n.vaiTro.loaiVai as LoaiVaiCongKhai,
              phe: n.vaiTro.phe as PheCongKhai,
            })),
            nhatKy: van.nhatKy.xuatBanCongKhai().map((sk) => ({
              thuTu: sk.thuTu,
              thoiDiem: sk.thoiDiem,
              loai: sk.loai,
              duLieu: { ...sk.duLieu },
            })),
          }
        : null,
  };
}

/** Kết quả ngày công khai: chỉ ai chết — bỏ `nguoiBanId` để không lộ ai là Thợ săn (Q09). */
function chieuKetQuaNgay(
  ketQua: NonNullable<ReturnType<BoDieuPhoiVan['layKetQuaNgay']>>,
): KetQuaNgayCongKhai {
  const phien = ketQua.ketQuaPhien;
  return {
    nguoiBiTreoId: phien.loai === 'TREO_CO' ? phien.nguoiBiTreoId : null,
    coBauLai: ketQua.coBauLai,
    nguoiChetThem: ketQua.phatBan.map((p) => p.mucTieuId),
  };
}
