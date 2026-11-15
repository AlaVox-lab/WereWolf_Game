// Kho dữ liệu trong bộ nhớ — cùng hợp đồng với bản Prisma. Dùng cho kiểm thử, CI (không có
// PostgreSQL) và chạy thử nhanh (`KHO=bo-nho`). Tắt máy chủ là mất dữ liệu.
import type {
  BaoCaoLuu,
  ChiTietVan,
  DongXepHang,
  HoSoLuu,
  KhoDuLieu,
  TaiKhoanLuu,
  TomTatVan,
  VanDaKetThuc,
} from '../../../application/kho/KhoDuLieu.js';
import { pheCuaVai } from '../../../application/BoChiaVai.js';
import type { LoaiVai } from '../../../domain/chung/LoaiVai.js';

export function taoKhoBoNho(): KhoDuLieu {
  let soTiep = 1;
  const moi = () => String(soTiep++);
  const taiKhoan = new Map<string, TaiKhoanLuu>();
  const hoSo = new Map<string, HoSoLuu>();
  const van = new Map<string, VanDaKetThuc & { id: string }>();
  const baoCao = new Map<string, BaoCaoLuu>();
  const diemMua = new Map<string, { diem: number; soVan: number; soThang: number }>();
  const mua = { id: '1', ten: 'Mùa 1', batDau: new Date() };

  const khoTaiKhoan: KhoDuLieu['taiKhoan'] = {
    async timTheoTen(ten) {
      return [...taiKhoan.values()].find((t) => t.tenDangNhap === ten) ?? null;
    },
    async timTheoId(id) {
      return taiKhoan.get(id) ?? null;
    },
    async tao(du) {
      if ([...taiKhoan.values()].some((t) => t.tenDangNhap === du.tenDangNhap)) {
        throw new Error('TRUNG_TEN_DANG_NHAP');
      }
      const tk: TaiKhoanLuu = {
        id: moi(),
        tenDangNhap: du.tenDangNhap,
        matKhauBam: du.matKhauBam,
        laQuanTri: du.laQuanTri ?? false,
        biKhoa: false,
        laNguoiChoiAo: du.laNguoiChoiAo ?? false,
        ngayTao: new Date(),
      };
      taiKhoan.set(tk.id, tk);
      hoSo.set(tk.id, {
        taiKhoanId: tk.id,
        bietDanh: du.bietDanh,
        anhDaiDien: 'DanLang',
        soVanDaChoi: 0,
        soVanThang: 0,
      });
      return tk;
    },
    async layHoSo(id) {
      return hoSo.get(id) ?? null;
    },
    async capNhatHoSo(id, du) {
      const hs = hoSo.get(id);
      if (!hs) throw new Error('KHONG_TIM_THAY');
      Object.assign(hs, Object.fromEntries(Object.entries(du).filter(([, v]) => v !== undefined)));
      return hs;
    },
    async datKhoa(id, biKhoa) {
      const tk = taiKhoan.get(id);
      if (tk) tk.biKhoa = biKhoa;
    },
    async danhSach() {
      return [...taiKhoan.values()]
        .filter((t) => !t.laNguoiChoiAo)
        .map((t) => ({ ...t, hoSo: hoSo.get(t.id) ?? null }));
    },
    async layNguoiChoiAo(thuTu) {
      const ten = `ao_${String(thuTu).padStart(2, '0')}`;
      return (
        (await khoTaiKhoan.timTheoTen(ten)) ??
        khoTaiKhoan.tao({
          tenDangNhap: ten,
          matKhauBam: '!',
          bietDanh: `Người ảo ${thuTu}`,
          laNguoiChoiAo: true,
        })
      );
    },
  };

  return {
    taiKhoan: khoTaiKhoan,
    phong: {
      async taoPhong() {
        return moi();
      },
      async capNhatPhong() {},
    },
    van: {
      async luuVan(v) {
        const id = moi();
        van.set(id, { ...v, id });
        for (const { taiKhoanId, diem, thang } of v.diemCong) {
          const hs = hoSo.get(taiKhoanId);
          if (hs) {
            hs.soVanDaChoi += 1;
            if (thang) hs.soVanThang += 1;
          }
          const d = diemMua.get(taiKhoanId) ?? { diem: 0, soVan: 0, soThang: 0 };
          d.diem += diem;
          d.soVan += 1;
          if (thang) d.soThang += 1;
          diemMua.set(taiKhoanId, d);
        }
        return id;
      },
      async lichSuCua(taiKhoanId) {
        return [...van.values()]
          .filter((v) => v.nguoiChoi.some((n) => n.id === taiKhoanId))
          .sort((a, b) => b.ketThucLuc.getTime() - a.ketThucLuc.getTime())
          .map((v): TomTatVan => {
            const toi = v.nguoiChoi.find((n) => n.id === taiKhoanId)!;
            const phe = pheCuaVai(toi.loaiVai as LoaiVai);
            return {
              vanId: v.id,
              ketThucLuc: v.ketThucLuc,
              trangThai: v.trangThai,
              pheThang: v.pheThang,
              soNguoi: v.nguoiChoi.length,
              soLuot: v.soLuot,
              loaiVai: toi.loaiVai,
              thang: v.pheThang === phe,
            };
          });
      },
      async layVan(vanId) {
        const v = van.get(vanId);
        if (!v) return null;
        const ct: ChiTietVan = {
          vanId,
          ketThucLuc: v.ketThucLuc,
          trangThai: v.trangThai,
          pheThang: v.pheThang,
          nguoiChoi: v.nguoiChoi.map((n) => ({
            id: n.id,
            ten: hoSo.get(n.id)?.bietDanh ?? n.id,
            loaiVai: n.loaiVai,
            conSong: n.conSong,
            thuTuGhe: n.thuTuGhe,
          })),
          nhatKy: v.nhatKy,
        };
        return ct;
      },
      async thongKe() {
        const ds = [...van.values()].filter((v) => v.trangThai === 'KET_THUC');
        return {
          soVan: ds.length,
          soVanDanThang: ds.filter((v) => v.pheThang === 'DAN').length,
          soVanSoiThang: ds.filter((v) => v.pheThang === 'SOI').length,
        };
      },
    },
    xepHang: {
      async muaHienTai() {
        return mua;
      },
      async bangXepHang() {
        return [...diemMua.entries()]
          .map(([taiKhoanId, d]): DongXepHang => ({
            taiKhoanId,
            bietDanh: hoSo.get(taiKhoanId)?.bietDanh ?? taiKhoanId,
            anhDaiDien: hoSo.get(taiKhoanId)?.anhDaiDien ?? 'DanLang',
            ...d,
          }))
          .sort(soSanhXepHang);
      },
    },
    baoCao: {
      async tao(du) {
        const bc: BaoCaoLuu = {
          id: moi(),
          ...du,
          trangThai: 'CHO_XU_LY',
          ghiChuXuLy: null,
          ngayTao: new Date(),
        };
        baoCao.set(bc.id, bc);
        return bc;
      },
      async danhSach() {
        return [...baoCao.values()].sort((a, b) => b.ngayTao.getTime() - a.ngayTao.getTime());
      },
      async timTheoId(id) {
        return baoCao.get(id) ?? null;
      },
      async xuLy(id, du) {
        const bc = baoCao.get(id);
        if (!bc) throw new Error('KHONG_TIM_THAY');
        bc.trangThai = du.trangThai;
        bc.ghiChuXuLy = du.ghiChu;
        return bc;
      },
    },
  };
}

/** Điểm cao trước; bằng điểm thì tỉ lệ thắng cao trước, rồi nhiều ván hơn trước. */
export function soSanhXepHang(a: DongXepHang, b: DongXepHang): number {
  const tiLe = (d: DongXepHang) => (d.soVan ? d.soThang / d.soVan : 0);
  return b.diem - a.diem || tiLe(b) - tiLe(a) || b.soVan - a.soVan;
}
