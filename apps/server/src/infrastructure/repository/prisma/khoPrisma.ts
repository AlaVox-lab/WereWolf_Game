// Kho dữ liệu trên PostgreSQL qua Prisma 7 (driver adapter `pg`). Chuyển BIGINT ↔ chuỗi ở ranh
// giới này; tầng ứng dụng chỉ thấy chuỗi.
import { PrismaPg } from '@prisma/adapter-pg';
import type {
  BaoCaoLuu,
  HoSoLuu,
  KhoDuLieu,
  TaiKhoanLuu,
  TrangThaiBaoCao,
} from '../../../application/kho/KhoDuLieu.js';
import { pheCuaVai } from '../../../application/BoChiaVai.js';
import type { LoaiVai } from '../../../domain/chung/LoaiVai.js';
import { soSanhXepHang } from '../boNho/khoBoNho.js';
import { PrismaClient } from './generated/client.js';

type TkDb = {
  id: bigint;
  tenDangNhap: string;
  matKhauBam: string;
  laQuanTri: boolean;
  biKhoa: boolean;
  laNguoiChoiAo: boolean;
  ngayTao: Date;
};
type HsDb = {
  taiKhoanId: bigint;
  bietDanh: string;
  anhDaiDien: string;
  soVanDaChoi: number;
  soVanThang: number;
};

const tk = (t: TkDb): TaiKhoanLuu => ({ ...t, id: String(t.id) });
// Chọn đúng từng trường — dòng DB còn khóa chính BigInt, trải cả dòng thì JSON hỏng.
const hs = (h: HsDb): HoSoLuu => ({
  taiKhoanId: String(h.taiKhoanId),
  bietDanh: h.bietDanh,
  anhDaiDien: h.anhDaiDien,
  soVanDaChoi: h.soVanDaChoi,
  soVanThang: h.soVanThang,
});
const bc = (b: {
  id: bigint;
  vanId: bigint;
  nguoiBaoCaoId: bigint;
  nguoiBiBaoCaoId: bigint;
  lyDo: string;
  trangThai: string;
  ghiChuXuLy: string | null;
  ngayTao: Date;
}): BaoCaoLuu => ({
  id: String(b.id),
  vanId: String(b.vanId),
  nguoiBaoCaoId: String(b.nguoiBaoCaoId),
  nguoiBiBaoCaoId: String(b.nguoiBiBaoCaoId),
  lyDo: b.lyDo,
  trangThai: b.trangThai as TrangThaiBaoCao,
  ghiChuXuLy: b.ghiChuXuLy,
  ngayTao: b.ngayTao,
});

export function taoPrisma(chuoiKetNoi: string) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: chuoiKetNoi }) });
}

export function taoKhoPrisma(db: PrismaClient): KhoDuLieu {
  const khoTaiKhoan: KhoDuLieu['taiKhoan'] = {
    async timTheoTen(ten) {
      const t = await db.taiKhoan.findUnique({ where: { tenDangNhap: ten } });
      return t ? tk(t) : null;
    },
    async timTheoId(id) {
      const t = await db.taiKhoan.findUnique({ where: { id: BigInt(id) } });
      return t ? tk(t) : null;
    },
    async tao(du) {
      const t = await db.taiKhoan.create({
        data: {
          tenDangNhap: du.tenDangNhap,
          matKhauBam: du.matKhauBam,
          laNguoiChoiAo: du.laNguoiChoiAo ?? false,
          laQuanTri: du.laQuanTri ?? false,
          hoSo: { create: { bietDanh: du.bietDanh } },
        },
      });
      return tk(t);
    },
    async layHoSo(id) {
      const h = await db.hoSoNguoiChoi.findUnique({ where: { taiKhoanId: BigInt(id) } });
      return h ? hs(h) : null;
    },
    async capNhatHoSo(id, du) {
      const h = await db.hoSoNguoiChoi.update({
        where: { taiKhoanId: BigInt(id) },
        data: Object.fromEntries(Object.entries(du).filter(([, v]) => v !== undefined)),
      });
      return hs(h);
    },
    async datKhoa(id, biKhoa) {
      await db.taiKhoan.update({ where: { id: BigInt(id) }, data: { biKhoa } });
    },
    async danhSach() {
      const ds = await db.taiKhoan.findMany({
        where: { laNguoiChoiAo: false },
        include: { hoSo: true },
        orderBy: { id: 'asc' },
      });
      return ds.map((t) => ({ ...tk(t), hoSo: t.hoSo ? hs(t.hoSo) : null }));
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

  const khoXepHang: KhoDuLieu['xepHang'] = {
    async muaHienTai() {
      const m =
        (await db.muaGiai.findFirst({ where: { ketThuc: null }, orderBy: { id: 'desc' } })) ??
        (await db.muaGiai.create({ data: { ten: 'Mùa 1', batDau: new Date() } }));
      return { id: String(m.id), ten: m.ten, batDau: m.batDau };
    },
    async bangXepHang(muaId) {
      const ds = await db.banGhiXepHang.findMany({
        where: { muaId: BigInt(muaId) },
        include: { taiKhoan: { include: { hoSo: true } } },
      });
      return ds
        .map((d) => ({
          taiKhoanId: String(d.taiKhoanId),
          bietDanh: d.taiKhoan.hoSo?.bietDanh ?? d.taiKhoan.tenDangNhap,
          anhDaiDien: d.taiKhoan.hoSo?.anhDaiDien ?? 'DanLang',
          diem: d.diem,
          soVan: d.soVan,
          soThang: d.soThang,
        }))
        .sort(soSanhXepHang);
    },
  };

  return {
    taiKhoan: khoTaiKhoan,
    phong: {
      async taoPhong(maPhong, chuPhongId) {
        const p = await db.phongChoi.create({
          data: { maPhong, chuPhongId: BigInt(chuPhongId), trangThai: 'CHO' },
        });
        return String(p.id);
      },
      async capNhatPhong(phongId, du) {
        const id = BigInt(phongId);
        await db.$transaction([
          db.phongChoi.update({ where: { id }, data: { trangThai: du.trangThai } }),
          db.cauHinhVai.deleteMany({ where: { phongId: id } }),
          db.cauHinhVai.createMany({
            data: Object.entries(du.cauHinhVai).map(([loaiVai, soLuong]) => ({
              phongId: id,
              loaiVai,
              soLuong,
            })),
          }),
          db.boLuatChoi.deleteMany({ where: { phongId: id } }),
          db.boLuatChoi.create({ data: { phongId: id, ...du.boLuat } }),
        ]);
      },
    },
    van: {
      async luuVan(v) {
        const mua = await khoXepHang.muaHienTai();
        return db.$transaction(async (tx) => {
          const van = await tx.vanDau.create({
            data: {
              phongId: BigInt(v.phongId),
              trangThai: v.trangThai,
              pheThang: v.pheThang,
              soLuot: v.soLuot,
              batDauLuc: v.batDauLuc,
              ketThucLuc: v.ketThucLuc,
              boLuat: { create: { ...v.boLuat } },
            },
          });
          // Mã người chơi trong ván (= mã tài khoản) → khóa chính của nguoi_choi_trong_van.
          const maDong = new Map<string, bigint>();
          for (const n of v.nguoiChoi) {
            const dong = await tx.nguoiChoiTrongVan.create({
              data: {
                vanId: van.id,
                taiKhoanId: BigInt(n.id),
                loaiVai: n.loaiVai,
                conSong: n.conSong,
                thuTuGhe: n.thuTuGhe,
                trangThaiKyNang: n.trangThaiKyNang as object,
              },
            });
            maDong.set(n.id, dong.id);
          }
          const dong = (id: string | null) => (id === null ? null : (maDong.get(id) ?? null));
          for (const l of v.luot) {
            const luot = await tx.luotChoi.create({ data: { vanId: van.id, soThuTu: l.soThuTu } });
            if (l.hanhDong.length) {
              await tx.hanhDongDem.createMany({
                data: l.hanhDong.map((h) => ({
                  luotId: luot.id,
                  nguoiThucHienId: maDong.get(h.nguoiThucHienId)!,
                  loaiHanhDong: h.loaiHanhDong,
                  mucTieuId: dong(h.mucTieuId),
                  doUuTien: h.doUuTien,
                  thoiDiem: h.thoiDiem,
                })),
              });
            }
            if (l.ketQuaDem) {
              await tx.ketQuaDem.create({ data: { luotId: luot.id, danhSachChet: l.ketQuaDem } });
            }
            for (const p of l.phien) {
              const phien = await tx.phienBauCu.create({
                data: {
                  luotId: luot.id,
                  vong: p.vong,
                  ketQua: p.ketQua,
                  nguoiBiTreoId: p.nguoiBiTreoId,
                },
              });
              if (p.phieu.length) {
                await tx.phieuBau.createMany({
                  data: p.phieu.map((ph) => ({
                    phienId: phien.id,
                    nguoiBauId: maDong.get(ph.nguoiBauId)!,
                    nguoiBiBauId: dong(ph.nguoiBiBauId),
                  })),
                });
              }
            }
          }
          if (v.tinNhan.length) {
            await tx.tinNhan.createMany({
              data: v.tinNhan.map((t) => ({
                vanId: van.id,
                nguoiGuiId: maDong.get(t.nguoiGuiId)!,
                kenh: t.kenh,
                noiDung: t.noiDung,
                thoiDiem: t.thoiDiem,
              })),
            });
          }
          if (v.nhatKy.length) {
            await tx.nhatKyVan.createMany({
              data: v.nhatKy.map((s) => ({
                vanId: van.id,
                thuTu: s.thuTu,
                loai: s.loai,
                duLieu: s.duLieu as object,
                thoiDiem: BigInt(Math.round(s.thoiDiem)),
              })),
            });
          }
          // UC20 — cộng số ván vào hồ sơ và điểm mùa (thắng +3, thua +1).
          for (const d of v.diemCong) {
            const id = BigInt(d.taiKhoanId);
            await tx.hoSoNguoiChoi.update({
              where: { taiKhoanId: id },
              data: { soVanDaChoi: { increment: 1 }, soVanThang: { increment: d.thang ? 1 : 0 } },
            });
            await tx.banGhiXepHang.upsert({
              where: { muaId_taiKhoanId: { muaId: BigInt(mua.id), taiKhoanId: id } },
              create: {
                muaId: BigInt(mua.id),
                taiKhoanId: id,
                diem: d.diem,
                soVan: 1,
                soThang: d.thang ? 1 : 0,
              },
              update: {
                diem: { increment: d.diem },
                soVan: { increment: 1 },
                soThang: { increment: d.thang ? 1 : 0 },
              },
            });
          }
          return String(van.id);
        });
      },
      async lichSuCua(taiKhoanId) {
        const ds = await db.nguoiChoiTrongVan.findMany({
          where: { taiKhoanId: BigInt(taiKhoanId) },
          include: { van: { include: { _count: { select: { nguoiChoi: true } } } } },
          orderBy: { van: { ketThucLuc: 'desc' } },
        });
        return ds.map((n) => ({
          vanId: String(n.vanId),
          ketThucLuc: n.van.ketThucLuc ?? n.van.batDauLuc,
          trangThai: n.van.trangThai,
          pheThang: n.van.pheThang,
          soNguoi: n.van._count.nguoiChoi,
          soLuot: n.van.soLuot,
          loaiVai: n.loaiVai,
          thang: n.van.pheThang === pheCuaVai(n.loaiVai as LoaiVai),
        }));
      },
      async layVan(vanId) {
        if (!/^\d{1,18}$/.test(vanId)) return null; // mã lạ từ đường dẫn — BigInt() sẽ ném lỗi
        const v = await db.vanDau.findUnique({
          where: { id: BigInt(vanId) },
          include: {
            nguoiChoi: {
              include: { taiKhoan: { include: { hoSo: true } } },
              orderBy: { thuTuGhe: 'asc' },
            },
            nhatKy: { orderBy: { thuTu: 'asc' } },
          },
        });
        if (!v) return null;
        return {
          vanId: String(v.id),
          ketThucLuc: v.ketThucLuc ?? v.batDauLuc,
          trangThai: v.trangThai,
          pheThang: v.pheThang,
          nguoiChoi: v.nguoiChoi.map((n) => ({
            id: String(n.taiKhoanId),
            ten: n.taiKhoan.hoSo?.bietDanh ?? n.taiKhoan.tenDangNhap,
            loaiVai: n.loaiVai,
            conSong: n.conSong,
            thuTuGhe: n.thuTuGhe,
          })),
          nhatKy: v.nhatKy.map((s) => ({
            thuTu: s.thuTu,
            loai: s.loai,
            duLieu: s.duLieu as Record<string, unknown>,
            thoiDiem: Number(s.thoiDiem),
          })),
        };
      },
      async thongKe() {
        const [soVan, soVanDanThang, soVanSoiThang] = await Promise.all([
          db.vanDau.count({ where: { trangThai: 'KET_THUC' } }),
          db.vanDau.count({ where: { trangThai: 'KET_THUC', pheThang: 'DAN' } }),
          db.vanDau.count({ where: { trangThai: 'KET_THUC', pheThang: 'SOI' } }),
        ]);
        return { soVan, soVanDanThang, soVanSoiThang };
      },
    },
    xepHang: khoXepHang,
    baoCao: {
      async tao(du) {
        return bc(
          await db.baoCaoViPham.create({
            data: {
              vanId: BigInt(du.vanId),
              nguoiBaoCaoId: BigInt(du.nguoiBaoCaoId),
              nguoiBiBaoCaoId: BigInt(du.nguoiBiBaoCaoId),
              lyDo: du.lyDo,
            },
          }),
        );
      },
      async danhSach() {
        return (await db.baoCaoViPham.findMany({ orderBy: { ngayTao: 'desc' } })).map(bc);
      },
      async timTheoId(id) {
        const b = await db.baoCaoViPham.findUnique({ where: { id: BigInt(id) } });
        return b ? bc(b) : null;
      },
      async xuLy(id, du) {
        return bc(
          await db.baoCaoViPham.update({
            where: { id: BigInt(id) },
            data: {
              trangThai: du.trangThai,
              ghiChuXuLy: du.ghiChu,
              nguoiXuLyId: BigInt(du.nguoiXuLyId),
              ngayXuLy: new Date(),
            },
          }),
        );
      },
    },
  };
}
