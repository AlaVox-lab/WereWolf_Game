import { TrangThaiVan } from '../../domain/chung/TrangThaiVan.js';
import type { KhoVan, VanDaKetThuc } from '../kho/KhoDuLieu.js';
import type { VanDangChay } from './SoDangKyVan.js';

/** Điểm mùa — người dùng chốt ngày 15/11/2026 (ROADMAP 7.4, game-rules.md Q14). */
export const DIEM_XEP_HANG = { thang: 3, thua: 1 } as const;

/**
 * Lưu ván đã kết thúc (UC20, ROADMAP 4.10): người chơi, lượt, ý định, kết quả đêm, phiên và phiếu
 * bầu, tin nhắn, nhật ký — rồi cộng số ván vào hồ sơ và điểm mùa của **người thật** (người chơi
 * ảo không được tính). Ván bị hủy (Q04) vẫn được ghi để đối chiếu, nhưng không cộng gì.
 */
export class DichVuLuuVan {
  constructor(
    private readonly kho: KhoVan,
    private readonly phongIdCua: (maPhong: string) => string,
  ) {}

  /** Dựng bản ghi ván từ trạng thái trong bộ nhớ — tách riêng để kiểm thử không cần kho. */
  dungBanGhi(v: VanDangChay, ketThucLuc: number): VanDaKetThuc {
    const { van } = v;
    const daXong = van.trangThai === TrangThaiVan.KET_THUC;
    const nhatKy = van.nhatKy.xuatBanCongKhai();
    const thoiDiemYDinh = (luot: number, nguoi: string, loai: string) =>
      nhatKy.find(
        (s) =>
          s.loai === 'Y_DINH' &&
          s.duLieu.luot === luot &&
          s.duLieu.nguoiThucHienId === nguoi &&
          s.duLieu.loaiHanhDong === loai,
      )?.thoiDiem ?? v.batDauLuc;

    return {
      phongId: this.phongIdCua(v.maPhong),
      trangThai: daXong ? 'KET_THUC' : 'HUY_VAN',
      pheThang: daXong && van.pheThang ? van.pheThang : null,
      soLuot: van.luotHienTai,
      batDauLuc: new Date(v.batDauLuc),
      ketThucLuc: new Date(ketThucLuc),
      boLuat: van.boLuatChoi.layGiaTri(),
      nguoiChoi: van.layDanhSachNguoiChoi().map((n) => ({
        id: n.id,
        loaiVai: n.vaiTro.loaiVai,
        conSong: n.conSong,
        thuTuGhe: n.thuTuGhe,
        trangThaiKyNang: { ...n.vaiTro.layTrangThaiKyNang() },
      })),
      luot: van.layDanhSachLuot().map((l) => ({
        soThuTu: l.soThuTu,
        hanhDong: l.layYDinh().map((h) => ({
          nguoiThucHienId: h.nguoiThucHienId,
          loaiHanhDong: h.loaiHanhDong,
          mucTieuId: h.mucTieuId,
          doUuTien: h.doUuTien,
          thoiDiem: new Date(thoiDiemYDinh(l.soThuTu, h.nguoiThucHienId, h.loaiHanhDong)),
        })),
        ketQuaDem: l.ketQuaDem
          ? l.ketQuaDem
              .layDanhSachChet()
              .map((c) => ({ nguoiChoiId: c.nguoiChoiId, nguyenNhan: c.nguyenNhan }))
          : null,
        phien: l.layDanhSachPhienBauCu().map((p, i) => {
          const kq = p.ketQuaPhien;
          return {
            vong: i + 1,
            ketQua: kq?.loai ?? 'CHUA_CHOT',
            nguoiBiTreoId: kq?.loai === 'TREO_CO' ? kq.nguoiBiTreoId : null,
            phieu: p.layDanhSachPhieu().map((ph) => ({
              nguoiBauId: ph.nguoiBauId,
              nguoiBiBauId: ph.nguoiBiBauId,
            })),
          };
        }),
      })),
      tinNhan: v.dieuPhoi.quanLyKenh.layTatCaTinNhan().map((t) => ({
        nguoiGuiId: t.nguoiGuiId,
        kenh: t.kenh,
        noiDung: t.noiDung,
        thoiDiem: new Date(t.thoiDiem),
      })),
      nhatKy: nhatKy.map((s) => ({
        thuTu: s.thuTu,
        loai: s.loai,
        duLieu: { ...s.duLieu },
        thoiDiem: Math.max(0, s.thoiDiem - v.batDauLuc),
      })),
      diemCong: daXong
        ? van
            .layDanhSachNguoiChoi()
            .filter((n) => !v.nguoiAo.has(n.id))
            .map((n) => {
              const thang = n.vaiTro.phe === van.pheThang;
              return {
                taiKhoanId: n.id,
                diem: thang ? DIEM_XEP_HANG.thang : DIEM_XEP_HANG.thua,
                thang,
              };
            })
        : [],
    };
  }

  /** UC20 — lưu ván, trả mã ván trong cơ sở dữ liệu. */
  luu(v: VanDangChay, ketThucLuc: number): Promise<string> {
    return this.kho.luuVan(this.dungBanGhi(v, ketThucLuc));
  }
}
