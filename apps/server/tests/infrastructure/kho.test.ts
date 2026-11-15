// Hợp đồng kho dữ liệu (ROADMAP 4.1) — cùng một bộ kiểm cho bản bộ nhớ và bản Prisma. Bản Prisma
// chỉ chạy khi có DATABASE_URL_TEST (cơ sở dữ liệu riêng cho kiểm thử, đã `prisma migrate deploy`);
// CI không có PostgreSQL nên bỏ qua.
import { afterAll, describe, expect, it } from 'vitest';
import type { KhoDuLieu, VanDaKetThuc } from '../../src/application/kho/KhoDuLieu.js';
import { taoKhoBoNho } from '../../src/infrastructure/repository/boNho/khoBoNho.js';
import { taoKhoPrisma, taoPrisma } from '../../src/infrastructure/repository/prisma/khoPrisma.js';

const URL_TEST = process.env.DATABASE_URL_TEST;
const duoi = () => Math.random().toString(36).slice(2, 8);

const BO_LUAT = {
  batDemDauCoChet: true,
  camPhuThuyTuCuu: true,
  choBaoVeTuDo: false,
  camDoTrungDem: true,
  thoSanBanKhiTreoCo: true,
  hoaPhieuKhongAiChet: true,
};

async function taoNguoiChoi(kho: KhoDuLieu, so: number) {
  const ds = [];
  for (let i = 0; i < so; i++) {
    ds.push(
      await kho.taiKhoan.tao({ tenDangNhap: `t${duoi()}${i}`, matKhauBam: 'x', bietDanh: `N${i}` }),
    );
  }
  return ds;
}

function hopDong(ten: string, layKho: () => KhoDuLieu) {
  describe(`Kho dữ liệu — ${ten}`, () => {
    it('tạo tài khoản kèm hồ sơ; tìm theo tên và mã; tên đăng nhập là duy nhất', async () => {
      const kho = layKho();
      const ten = `u${duoi()}`;
      const tk = await kho.taiKhoan.tao({ tenDangNhap: ten, matKhauBam: 'h', bietDanh: 'Ngân' });
      expect((await kho.taiKhoan.timTheoTen(ten))?.id).toBe(tk.id);
      expect((await kho.taiKhoan.timTheoId(tk.id))?.tenDangNhap).toBe(ten);
      const hoSo = await kho.taiKhoan.layHoSo(tk.id);
      expect(hoSo).toMatchObject({ bietDanh: 'Ngân', soVanDaChoi: 0, soVanThang: 0 });
      // REST trả thẳng bản ghi này — phải chuyển được sang JSON, không lọt khóa BigInt của DB.
      expect(Object.keys(hoSo!).sort()).toEqual(
        ['anhDaiDien', 'bietDanh', 'soVanDaChoi', 'soVanThang', 'taiKhoanId'].sort(),
      );
      expect(() => JSON.stringify(hoSo)).not.toThrow();
      await expect(
        kho.taiKhoan.tao({ tenDangNhap: ten, matKhauBam: 'h', bietDanh: 'Trùng' }),
      ).rejects.toThrow();
    });

    it('UC03 cập nhật hồ sơ; UC23 khóa và mở khóa tài khoản', async () => {
      const kho = layKho();
      const [tk] = await taoNguoiChoi(kho, 1);
      await kho.taiKhoan.capNhatHoSo(tk!.id, { bietDanh: 'Trăng', anhDaiDien: 'Soi' });
      expect(await kho.taiKhoan.layHoSo(tk!.id)).toMatchObject({
        bietDanh: 'Trăng',
        anhDaiDien: 'Soi',
      });
      await kho.taiKhoan.datKhoa(tk!.id, true);
      expect((await kho.taiKhoan.timTheoId(tk!.id))?.biKhoa).toBe(true);
      await kho.taiKhoan.datKhoa(tk!.id, false);
      expect((await kho.taiKhoan.timTheoId(tk!.id))?.biKhoa).toBe(false);
    });

    it('tài khoản người chơi ảo được tạo một lần rồi dùng lại; không có trong danh sách quản trị', async () => {
      const kho = layKho();
      const a = await kho.taiKhoan.layNguoiChoiAo(7);
      const b = await kho.taiKhoan.layNguoiChoiAo(7);
      expect(a.id).toBe(b.id);
      expect(a.laNguoiChoiAo).toBe(true);
      expect((await kho.taiKhoan.danhSach()).some((t) => t.id === a.id)).toBe(false);
    });

    it('UC20 lưu ván: lịch sử, nhật ký, hồ sơ cộng số ván, điểm mùa thắng +3 thua +1', async () => {
      const kho = layKho();
      const nguoi = await taoNguoiChoi(kho, 6);
      const chu = nguoi[0]!;
      const phongId = await kho.phong.taoPhong(duoi().slice(0, 6).toUpperCase(), chu.id);
      const vai = ['Soi', 'BaoVe', 'TienTri', 'PhuThuy', 'ThoSan', 'DanLang'];
      const ds = nguoi.map((n, i) => ({
        id: n.id,
        loaiVai: vai[i]!,
        conSong: i !== 0,
        thuTuGhe: i + 1,
        trangThaiKyNang: {},
      }));
      const van: VanDaKetThuc = {
        phongId,
        trangThai: 'KET_THUC',
        pheThang: 'DAN',
        soLuot: 1,
        batDauLuc: new Date(Date.now() - 60_000),
        ketThucLuc: new Date(),
        boLuat: BO_LUAT,
        nguoiChoi: ds,
        luot: [
          {
            soThuTu: 1,
            hanhDong: [
              {
                nguoiThucHienId: ds[0]!.id,
                loaiHanhDong: 'CAN',
                mucTieuId: ds[5]!.id,
                doUuTien: 2,
                thoiDiem: new Date(),
              },
            ],
            ketQuaDem: [],
            phien: [
              {
                vong: 1,
                ketQua: 'TREO_CO',
                nguoiBiTreoId: ds[0]!.id,
                phieu: ds.slice(1).map((n) => ({ nguoiBauId: n.id, nguoiBiBauId: ds[0]!.id })),
              },
            ],
          },
        ],
        tinNhan: [
          { nguoiGuiId: ds[1]!.id, kenh: 'CHUNG', noiDung: 'Treo Sói!', thoiDiem: new Date() },
        ],
        nhatKy: [
          { thuTu: 1, loai: 'CHIA_VAI', duLieu: { vai: {} }, thoiDiem: 0 },
          { thuTu: 2, loai: 'KET_THUC', duLieu: { pheThang: 'DAN' }, thoiDiem: 5000 },
        ],
        diemCong: ds.map((n, i) => ({ taiKhoanId: n.id, diem: i === 0 ? 1 : 3, thang: i !== 0 })),
      };
      const vanId = await kho.van.luuVan(van);

      const lsSoi = await kho.van.lichSuCua(ds[0]!.id);
      expect(lsSoi[0]).toMatchObject({ vanId, loaiVai: 'Soi', thang: false, soNguoi: 6 });
      expect((await kho.van.lichSuCua(ds[3]!.id))[0]).toMatchObject({ thang: true });

      const ct = await kho.van.layVan(vanId);
      expect(ct?.nhatKy.map((s) => s.loai)).toEqual(['CHIA_VAI', 'KET_THUC']);
      expect(ct?.nguoiChoi).toHaveLength(6);
      // Mã ván lấy từ đường dẫn REST — mã lạ hay không có thì trả null, không ném lỗi (7.2).
      expect(await kho.van.layVan('khong-phai-so')).toBeNull();
      expect(await kho.van.layVan('987654321')).toBeNull();

      expect(await kho.taiKhoan.layHoSo(ds[3]!.id)).toMatchObject({
        soVanDaChoi: 1,
        soVanThang: 1,
      });
      const mua = await kho.xepHang.muaHienTai();
      const bang = await kho.xepHang.bangXepHang(mua.id);
      expect(bang.find((d) => d.taiKhoanId === ds[3]!.id)).toMatchObject({ diem: 3, soThang: 1 });
      expect(bang.find((d) => d.taiKhoanId === ds[0]!.id)).toMatchObject({ diem: 1, soThang: 0 });
      expect((await kho.van.thongKe()).soVanDanThang).toBeGreaterThanOrEqual(1);
    });

    it('UC21/UC22 báo cáo vi phạm: tạo, liệt kê, xử lý', async () => {
      const kho = layKho();
      const nguoi = await taoNguoiChoi(kho, 6);
      const phongId = await kho.phong.taoPhong(duoi().slice(0, 6).toUpperCase(), nguoi[0]!.id);
      const vanId = await kho.van.luuVan({
        phongId,
        trangThai: 'HUY_VAN',
        pheThang: null,
        soLuot: 0,
        batDauLuc: new Date(),
        ketThucLuc: new Date(),
        boLuat: BO_LUAT,
        nguoiChoi: nguoi.map((n, i) => ({
          id: n.id,
          loaiVai: 'DanLang',
          conSong: true,
          thuTuGhe: i + 1,
          trangThaiKyNang: {},
        })),
        luot: [],
        tinNhan: [],
        nhatKy: [],
        diemCong: [],
      });
      const b = await kho.baoCao.tao({
        vanId,
        nguoiBaoCaoId: nguoi[1]!.id,
        nguoiBiBaoCaoId: nguoi[2]!.id,
        lyDo: 'Nói lộ vai',
      });
      expect(b.trangThai).toBe('CHO_XU_LY');
      expect((await kho.baoCao.danhSach()).some((x) => x.id === b.id)).toBe(true);
      const xl = await kho.baoCao.xuLy(b.id, {
        trangThai: 'CANH_CAO',
        ghiChu: 'Nhắc nhở lần đầu',
        nguoiXuLyId: nguoi[0]!.id,
      });
      expect(xl).toMatchObject({ trangThai: 'CANH_CAO', ghiChuXuLy: 'Nhắc nhở lần đầu' });
    });
  });
}

hopDong('bộ nhớ', () => taoKhoBoNho());

describe.skipIf(!URL_TEST)('Kho dữ liệu — PostgreSQL', () => {
  const db = URL_TEST ? taoPrisma(URL_TEST) : null;
  afterAll(() => db?.$disconnect());
  hopDong('Prisma', () => taoKhoPrisma(db!));

  it('12.3 — nhat_ky_van không sửa, không xóa được (trigger)', async () => {
    await expect(db!.nhatKyVan.deleteMany({})).rejects.toThrow(/chỉ được ghi thêm/);
  });
});
