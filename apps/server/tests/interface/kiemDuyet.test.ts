// REST xếp hạng và kiểm duyệt (ROADMAP 7.6–7.10): UC05 bảng xếp hạng, UC21 báo cáo vi phạm,
// UC22 xem xét báo cáo, UC23 khóa / mở khóa tài khoản, UC24 bảng điều khiển.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { KhoDuLieu } from '../../src/application/kho/KhoDuLieu.js';
import { BoLuatChoi } from '../../src/domain/luat/BoLuatChoi.js';
import { bamMatKhau } from '../../src/infrastructure/auth/matKhau.js';
import { taoKhoBoNho } from '../../src/infrastructure/repository/boNho/khoBoNho.js';
import { moSocket, taoMayChuThu, taoNguoiDung } from './mayChuThu.js';

let kho: KhoDuLieu;
let may: Awaited<ReturnType<typeof taoMayChuThu>>;
let quanTri: ReturnType<typeof taoNguoiDung>;
let quanTriId: string;

beforeAll(async () => {
  kho = taoKhoBoNho();
  may = await taoMayChuThu({ kho });
  const tk = await kho.taiKhoan.tao({
    tenDangNhap: 'quantri',
    matKhauBam: await bamMatKhau('quantri123'),
    bietDanh: 'Trưởng làng',
    laQuanTri: true,
  });
  quanTriId = tk.id;
  quanTri = taoNguoiDung(may.url);
  await quanTri.goi('/api/tai-khoan/dang-nhap', 'POST', {
    tenDangNhap: 'quantri',
    matKhau: 'quantri123',
  });
});
afterAll(() => may.dong());

async function nguoiDaDangKy(ten: string) {
  const u = taoNguoiDung(may.url);
  const r = await u.goi('/api/tai-khoan/dang-ky', 'POST', {
    tenDangNhap: ten,
    bietDanh: ten.toUpperCase(),
    matKhau: 'matkhau123',
  });
  return { u, id: r.body.id as string };
}

let soPhong = 0;
/** Lưu thẳng một ván đã xong: `thang` thuộc phe Sói và thắng, `thua` là Dân, kèm một người ảo. */
async function luuVan(thangId: string, thuaId: string, aoId?: string): Promise<string> {
  const phongId = await kho.phong.taoPhong(`KD${soPhong++}`, thangId);
  const luc = new Date('2026-11-15T12:00:00Z');
  return kho.van.luuVan({
    phongId,
    trangThai: 'KET_THUC',
    pheThang: 'SOI',
    soLuot: 2,
    batDauLuc: luc,
    ketThucLuc: new Date(luc.getTime() + 60_000),
    boLuat: new BoLuatChoi().layGiaTri(),
    nguoiChoi: [
      { id: thangId, loaiVai: 'Soi', conSong: true, thuTuGhe: 1, trangThaiKyNang: {} },
      { id: thuaId, loaiVai: 'DanLang', conSong: false, thuTuGhe: 2, trangThaiKyNang: {} },
      ...(aoId
        ? [{ id: aoId, loaiVai: 'BaoVe', conSong: false, thuTuGhe: 3, trangThaiKyNang: {} }]
        : []),
    ],
    luot: [],
    tinNhan: [],
    nhatKy: [],
    diemCong: [
      { taiKhoanId: thangId, diem: 3, thang: true },
      { taiKhoanId: thuaId, diem: 1, thang: false },
    ],
  });
}

describe('UC05 — bảng xếp hạng mùa hiện tại', () => {
  it('cộng điểm theo Q14 (thắng +3, thua +1), sắp điểm cao trước, cùng thành tích thì cùng hạng', async () => {
    const a = await nguoiDaDangKy('xh_a');
    const b = await nguoiDaDangKy('xh_b');
    await luuVan(a.id, b.id);
    await luuVan(a.id, b.id);
    const r = await a.u.goi('/api/xep-hang');
    expect(r.status).toBe(200);
    expect(r.body.mua).toMatchObject({ ten: expect.any(String), batDau: expect.any(Number) });
    const dongA = r.body.dong.find((d: { taiKhoanId: string }) => d.taiKhoanId === a.id);
    const dongB = r.body.dong.find((d: { taiKhoanId: string }) => d.taiKhoanId === b.id);
    expect(dongA).toMatchObject({ diem: 6, soVan: 2, soThang: 2, bietDanh: 'XH_A' });
    expect(dongB).toMatchObject({ diem: 2, soVan: 2, soThang: 0 });
    expect(dongA.hang).toBeLessThan(dongB.hang);
    expect(r.body.dong[0].hang).toBe(1);
    expect((await taoNguoiDung(may.url).goi('/api/xep-hang')).status).toBe(401);
  });
});

describe('UC21 — báo cáo vi phạm', () => {
  it('chỉ người cùng ván báo cáo được một người thật khác, mỗi cặp một lần', async () => {
    const soi = await nguoiDaDangKy('bc_soi');
    const dan = await nguoiDaDangKy('bc_dan');
    const la = await nguoiDaDangKy('bc_la');
    const ao = await kho.taiKhoan.layNguoiChoiAo(1);
    const vanId = await luuVan(soi.id, dan.id, ao.id);
    const gui = (u: typeof soi.u, nguoiBiBaoCaoId: string, lyDo = 'Chửi bới trong kênh chung') =>
      u.goi('/api/bao-cao', 'POST', { vanId, nguoiBiBaoCaoId, lyDo });

    expect((await gui(la.u, soi.id)).status).toBe(403);
    expect((await gui(dan.u, dan.id)).body.loi).toBe('KHONG_TU_BAO_CAO');
    expect((await gui(dan.u, ao.id)).body.loi).toBe('KHONG_BAO_CAO_NGUOI_AO');
    expect((await gui(dan.u, la.id)).body.loi).toBe('KHONG_TIM_THAY_NGUOI_CHOI');
    expect((await gui(dan.u, soi.id, 'ít')).body.loi).toBe('LY_DO_KHONG_HOP_LE');
    const ok = await gui(dan.u, soi.id);
    expect(ok.status).toBe(201);
    expect(ok.body.trangThai).toBe('CHO_XU_LY');
    expect((await gui(dan.u, soi.id)).status).toBe(409);
  });
});

describe('UC22–UC24 — quản trị', () => {
  it('người thường không vào được bất kỳ đường dẫn quản trị nào', async () => {
    const u = await nguoiDaDangKy('qt_thuong');
    for (const duongDan of [
      '/api/quan-tri/tong-quan',
      '/api/quan-tri/bao-cao',
      '/api/quan-tri/tai-khoan',
    ]) {
      expect((await u.u.goi(duongDan)).status).toBe(403);
    }
    expect(
      (await u.u.goi(`/api/quan-tri/tai-khoan/${u.id}/khoa`, 'POST', { biKhoa: true })).status,
    ).toBe(403);
  });

  it('UC22 — danh sách báo cáo kèm tên; bác bỏ thì không xử lý lại được; quản trị viên mở được nhật ký ván', async () => {
    const soi = await nguoiDaDangKy('qt_soi');
    const dan = await nguoiDaDangKy('qt_dan');
    const vanId = await luuVan(soi.id, dan.id);
    await dan.u.goi('/api/bao-cao', 'POST', {
      vanId,
      nguoiBiBaoCaoId: soi.id,
      lyDo: 'Lộ vai cố ý',
    });

    const ds = await quanTri.goi('/api/quan-tri/bao-cao');
    const bc = ds.body.find((b: { vanId: string }) => b.vanId === vanId);
    expect(bc).toMatchObject({
      nguoiBaoCao: { id: dan.id, ten: 'QT_DAN' },
      nguoiBiBaoCao: { id: soi.id, ten: 'QT_SOI', biKhoa: false },
      lyDo: 'Lộ vai cố ý',
      trangThai: 'CHO_XU_LY',
    });
    expect((await quanTri.goi(`/api/lich-su/${vanId}`)).status).toBe(200);

    const xl = await quanTri.goi(`/api/quan-tri/bao-cao/${bc.id}`, 'POST', {
      quyetDinh: 'BAC_BO',
      ghiChu: 'Không đủ chứng cứ',
    });
    expect(xl.body.trangThai).toBe('BAC_BO');
    const lai = await quanTri.goi(`/api/quan-tri/bao-cao/${bc.id}`, 'POST', {
      quyetDinh: 'CANH_CAO',
      ghiChu: '',
    });
    expect(lai.body.loi).toBe('BAO_CAO_DA_XU_LY');
    expect(
      (
        await quanTri.goi('/api/quan-tri/bao-cao/999999', 'POST', {
          quyetDinh: 'BAC_BO',
          ghiChu: '',
        })
      ).status,
    ).toBe(404);
  });

  it('UC23 — khóa từ báo cáo: bị đẩy khỏi phòng chờ, ngắt socket, không đăng nhập lại được; mở khóa thì vào lại', async () => {
    const soi = await nguoiDaDangKy('khoa_soi');
    const dan = await nguoiDaDangKy('khoa_dan');
    const vanId = await luuVan(soi.id, dan.id);
    await dan.u.goi('/api/bao-cao', 'POST', {
      vanId,
      nguoiBiBaoCaoId: soi.id,
      lyDo: 'Gian lận nhiều lần',
    });

    const phong = await soi.u.goi('/api/phong', 'POST');
    const lyDo = new Promise<string>((ok) => {
      void moSocket(may.url, soi.u.cookie, (s) => s.on('phien:ket-thuc', ok));
    });
    await new Promise((r) => setTimeout(r, 100));

    const bc = (await quanTri.goi('/api/quan-tri/bao-cao')).body.find(
      (b: { vanId: string }) => b.vanId === vanId,
    );
    const xl = await quanTri.goi(`/api/quan-tri/bao-cao/${bc.id}`, 'POST', {
      quyetDinh: 'KHOA_TAI_KHOAN',
      ghiChu: 'Tái phạm',
    });
    expect(xl.body.trangThai).toBe('KHOA_TAI_KHOAN');
    expect(await lyDo).toMatch(/khóa/);
    expect(may.phong.phongCua(soi.id)).toBeNull();
    expect(may.phong.coPhong(phong.body.maPhong)).toBe(false);
    expect((await soi.u.goi('/api/tai-khoan/toi')).status).toBe(401);
    const dangNhap = (u: ReturnType<typeof taoNguoiDung>) =>
      u.goi('/api/tai-khoan/dang-nhap', 'POST', { tenDangNhap: 'khoa_soi', matKhau: 'matkhau123' });
    expect((await dangNhap(taoNguoiDung(may.url))).body.loi).toBe('TAI_KHOAN_BI_KHOA');

    const tk = (await quanTri.goi('/api/quan-tri/tai-khoan')).body.find(
      (t: { id: string }) => t.id === soi.id,
    );
    expect(tk).toMatchObject({ biKhoa: true, tenDangNhap: 'khoa_soi' });
    expect(tk).not.toHaveProperty('matKhauBam');

    expect(
      (await quanTri.goi(`/api/quan-tri/tai-khoan/${soi.id}/khoa`, 'POST', { biKhoa: false }))
        .status,
    ).toBe(204);
    expect((await dangNhap(taoNguoiDung(may.url))).status).toBe(200);
  });

  it('UC23 — không tự khóa mình, không khóa quản trị viên; mã lạ là 404', async () => {
    const tuKhoa = await quanTri.goi(`/api/quan-tri/tai-khoan/${quanTriId}/khoa`, 'POST', {
      biKhoa: true,
    });
    expect(tuKhoa.body.loi).toBe('KHONG_KHOA_QUAN_TRI');
    expect(
      (await quanTri.goi('/api/quan-tri/tai-khoan/khong-co/khoa', 'POST', { biKhoa: true })).status,
    ).toBe(404);
  });

  it('UC24 — tổng quan: số ván, ván thắng theo phe, người chơi, báo cáo chờ xử lý', async () => {
    const r = await quanTri.goi('/api/quan-tri/tong-quan');
    expect(r.status).toBe(200);
    const [thongKe, taiKhoan, baoCao] = await Promise.all([
      kho.van.thongKe(),
      kho.taiKhoan.danhSach(),
      kho.baoCao.danhSach(),
    ]);
    expect(r.body).toEqual({
      ...thongKe,
      soNguoiChoi: taiKhoan.length,
      soTaiKhoanBiKhoa: taiKhoan.filter((t) => t.biKhoa).length,
      soBaoCaoChoXuLy: baoCao.filter((b) => b.trangThai === 'CHO_XU_LY').length,
    });
    expect(r.body.soVanSoiThang).toBeGreaterThan(0);
    expect(r.body.soBaoCaoChoXuLy).toBeGreaterThan(0);
  });
});
