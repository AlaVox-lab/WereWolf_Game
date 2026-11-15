// Cổng Socket.IO (ROADMAP 4.7–4.9, 4.11): bắt tay bằng cookie, lệnh phòng, chơi trọn một ván qua
// socket với người chơi ảo, ST05 rà mọi gói tin, kênh chat (UC18), BR13 kết nối lại, Q04 hủy ván.
import type { GocNhinNguoiChoi, GoiGocNhin, PhongCongKhai } from '@moonvillage/shared';
import { afterEach, describe, expect, it } from 'vitest';
import {
  lenh,
  moSocket,
  nguoiMoi,
  taoMayChuThu,
  THOI_GIAN_NHANH,
  type SocketThu,
} from './mayChuThu.js';

type MayThu = Awaited<ReturnType<typeof taoMayChuThu>>;
const canDong: (() => Promise<void> | void)[] = [];
afterEach(async () => {
  for (const d of canDong.splice(0).reverse()) await d();
});

async function dungMay(them = {}) {
  const may = await taoMayChuThu(them);
  canDong.push(() => may.dong());
  return may;
}

/** Một người chơi thật qua socket: ghi lại mọi gói, tự trả lời mọi lời mời bằng lựa chọn đầu tiên. */
async function nguoiChoi(may: MayThu, ten: string, tuChoi = true) {
  const u = await nguoiMoi(may.url, ten);
  const id = (await u.goi('/api/tai-khoan/toi')).body.id as string;
  const goi: { ten: string; duLieu: unknown }[] = [];
  const s = await moSocket(may.url, u.cookie, (sk) =>
    sk.onAny((tenSk, duLieu) => goi.push({ ten: tenSk, duLieu })),
  );
  canDong.push(() => {
    s.disconnect();
  });
  const daTraLoi = new Set<number>();
  let gocNhin: GocNhinNguoiChoi | null = null;
  let phong: PhongCongKhai | null = null;
  s.on('phong:cap-nhat', (p) => {
    phong = p;
  });
  s.on('van:goc-nhin', ({ gocNhin: g }: GoiGocNhin) => {
    gocNhin = g;
    const viec = g.viecCanLam;
    if (!tuChoi || !viec || daTraLoi.has(viec.hetHanLuc)) return;
    daTraLoi.add(viec.hetHanLuc);
    const nhom = viec.luaChon.find((n) => n.mucTieu.length > 0);
    if (viec.viec === 'BO_PHIEU') {
      void lenh(s, 'van:bo-phieu', { mucTieuId: nhom?.mucTieu[0] ?? null });
    } else if (nhom) {
      void lenh(s, 'van:hanh-dong', {
        mucTieuId: nhom.mucTieu[0]!,
        ...(nhom.loai ? { loai: nhom.loai } : {}),
      });
    }
  });
  return {
    id,
    u,
    s,
    goi,
    get gocNhin(): GocNhinNguoiChoi | null {
      return gocNhin;
    },
    get phong(): PhongCongKhai | null {
      return phong;
    },
  };
}

function cho(dieuKien: () => boolean, ms = 15_000): Promise<void> {
  return new Promise((ok, loi) => {
    const batDau = Date.now();
    const h = setInterval(() => {
      if (dieuKien()) {
        clearInterval(h);
        ok();
      } else if (Date.now() - batDau > ms) {
        clearInterval(h);
        loi(new Error('hết giờ chờ'));
      }
    }, 20);
  });
}

describe('Socket.IO — bắt tay và phòng (4.7)', () => {
  it('không có cookie phiên thì bị từ chối', async () => {
    const may = await dungMay();
    await expect(moSocket(may.url, '')).rejects.toThrow('CHUA_DANG_NHAP');
  });

  it('vào phòng bằng mã, mọi thành viên nhận phong:cap-nhat; chủ phòng loại người thì người đó nhận null', async () => {
    const may = await dungMay();
    const a = await nguoiChoi(may, 'chu_a');
    const b = await nguoiChoi(may, 'khach_b');
    const ma = (await a.u.goi('/api/phong', 'POST')).body.maPhong as string;
    await cho(() => a.phong?.maPhong === ma);
    expect(await lenh(b.s, 'phong:vao', { maPhong: ma.toLowerCase() })).toEqual({ ok: true });
    await cho(() => a.phong?.thanhVien.length === 2 && b.phong?.maPhong === ma);
    expect(await lenh(b.s, 'phong:goi-y-vai', {})).toMatchObject({
      ok: false,
      loi: 'KHONG_PHAI_CHU_PHONG',
    });
    expect(await lenh(a.s, 'phong:loai', { taiKhoanId: b.id })).toEqual({ ok: true });
    await cho(() => b.phong === null && a.phong?.thanhVien.length === 1);
  });

  it('lệnh sai lược đồ bị từ chối với DU_LIEU_KHONG_HOP_LE', async () => {
    const may = await dungMay();
    const a = await nguoiChoi(may, 'sai_luoc_do');
    expect(await lenh(a.s, 'phong:vao', {} as never)).toMatchObject({
      ok: false,
      loi: 'DU_LIEU_KHONG_HOP_LE',
    });
  });
});

describe('Socket.IO — chơi trọn ván (4.7, 4.11, ST05)', () => {
  it('2 người thật + 4 người ảo chơi tới khi có phe thắng; không gói tin nào lộ vai người khác', async () => {
    const may = await dungMay();
    const a = await nguoiChoi(may, 'nguoi_a');
    const b = await nguoiChoi(may, 'nguoi_b');
    const ma = (await a.u.goi('/api/phong', 'POST')).body.maPhong as string;
    await lenh(b.s, 'phong:vao', { maPhong: ma });
    for (let i = 0; i < 4; i++)
      expect(await lenh(a.s, 'phong:them-nguoi-ao', {})).toEqual({ ok: true });
    await lenh(a.s, 'phong:goi-y-vai', {});
    await cho(() => a.phong?.viPham.length === 0 && a.phong?.thanhVien.length === 6);
    expect(await lenh(a.s, 'phong:bat-dau', {})).toEqual({ ok: true });

    await cho(
      () => a.gocNhin?.trangThai === 'KET_THUC' && b.gocNhin?.trangThai === 'KET_THUC',
      30_000,
    );
    expect(a.gocNhin!.ketThuc!.vai).toHaveLength(6);
    await cho(() => a.phong?.trangThai === 'CHO');

    // ST05 — bộ rà gói tin: mọi gói máy chủ gửi cho một người chỉ chứa phần người đó được thấy.
    for (const p of [a, b]) {
      const gocNhin = p.goi
        .filter((g) => g.ten === 'van:goc-nhin')
        .map((g) => (g.duLieu as GoiGocNhin).gocNhin);
      expect(gocNhin.length).toBeGreaterThan(5);
      const vaiToi = gocNhin[0]!.toi.loaiVai;
      for (const g of gocNhin) {
        expect(g.toi.id).toBe(p.id);
        for (const n of g.nguoiChoi)
          expect(Object.keys(n).sort()).toEqual(['conSong', 'id', 'thuTuGhe']);
        if (g.trangThai !== 'KET_THUC') expect(g.ketThuc).toBeNull();
        if (vaiToi !== 'TienTri') expect(g.ketQuaSoi).toEqual([]);
        if (vaiToi !== 'Soi') expect(g.toi.dongDoi).toBeNull();
        if (g.viecCanLam?.nanNhan) expect(vaiToi).toBe('PhuThuy');
      }
      for (const g of p.goi.filter((x) => x.ten === 'phong:cap-nhat' && x.duLieu)) {
        for (const tv of (g.duLieu as PhongCongKhai).thanhVien) {
          expect(Object.keys(tv).sort()).toEqual([
            'anhDaiDien',
            'id',
            'ketNoi',
            'laChuPhong',
            'laNguoiChoiAo',
            'ten',
          ]);
        }
      }
    }
  }, 40_000);
});

describe('Socket.IO — kênh chat (4.8)', () => {
  it('UC18 — tin kênh chung tới mọi người còn sống; người không phải Sói không gửi được vào kênh Sói', async () => {
    const may = await dungMay({ thoiGian: { ...THOI_GIAN_NHANH, thaoLuan: 4_000 } });
    const a = await nguoiChoi(may, 'chat_a');
    const b = await nguoiChoi(may, 'chat_b');
    const ma = (await a.u.goi('/api/phong', 'POST')).body.maPhong as string;
    await lenh(b.s, 'phong:vao', { maPhong: ma });
    for (let i = 0; i < 4; i++) await lenh(a.s, 'phong:them-nguoi-ao', {});
    await lenh(a.s, 'phong:goi-y-vai', {});
    await cho(() => a.phong?.viPham.length === 0);
    await lenh(a.s, 'phong:bat-dau', {});
    await cho(
      () => a.gocNhin?.trangThai === 'PHA_THAO_LUAN' || a.gocNhin?.trangThai === 'KET_THUC',
      20_000,
    );
    if (a.gocNhin!.trangThai === 'KET_THUC' || !a.gocNhin!.toi.conSong || !b.gocNhin!.toi.conSong)
      return;

    const nhanDuoc: string[] = [];
    b.s.on('kenh:tin-nhan', (t) => nhanDuoc.push(`${t.kenh}:${t.noiDung}`));
    expect(await lenh(a.s, 'kenh:gui', { kenh: 'CHUNG', noiDung: '  Tôi nghi Khoa  ' })).toEqual({
      ok: true,
    });
    await cho(() => nhanDuoc.includes('CHUNG:Tôi nghi Khoa'));
    expect(await lenh(a.s, 'kenh:gui', { kenh: 'CHUNG', noiDung: '   ' })).toMatchObject({
      loi: 'TIN_NHAN_KHONG_HOP_LE',
    });
    if (a.gocNhin!.toi.phe !== 'SOI') {
      expect(await lenh(a.s, 'kenh:gui', { kenh: 'SOI', noiDung: 'lén' })).toMatchObject({
        ok: false,
      });
    }
  }, 40_000);
});

describe('Socket.IO — mất kết nối (4.9)', () => {
  it('BR13 — kết nối lại giữa ván nhận ngay ảnh chụp phòng, góc nhìn và lịch sử kênh', async () => {
    const may = await dungMay({ thoiGianXemVai: 2_000 });
    const a = await nguoiChoi(may, 'mat_a', false);
    const ma = (await a.u.goi('/api/phong', 'POST')).body.maPhong as string;
    for (let i = 0; i < 5; i++) await lenh(a.s, 'phong:them-nguoi-ao', {});
    await lenh(a.s, 'phong:goi-y-vai', {});
    await cho(() => a.phong?.viPham.length === 0);
    await lenh(a.s, 'phong:bat-dau', {});
    await cho(() => a.gocNhin !== null);
    a.s.disconnect();
    await cho(() => may.phong.chieu(ma).thanhVien[0]!.ketNoi === false);

    const nhan: string[] = [];
    const lai: SocketThu = await moSocket(may.url, a.u.cookie, (s) =>
      s.onAny((ten) => nhan.push(ten)),
    );
    canDong.push(() => {
      lai.disconnect();
    });
    await cho(() =>
      ['phong:cap-nhat', 'van:goc-nhin', 'kenh:lich-su'].every((t) => nhan.includes(t)),
    );
    expect(may.phong.chieu(ma).thanhVien[0]!.ketNoi).toBe(true);
  }, 20_000);

  it('Q04 — quá nửa người còn sống mất kết nối liên tục quá ngưỡng thì ván bị hủy, phòng mở lại', async () => {
    const may = await dungMay({
      nguongMatKetNoiMs: 150,
      chuKyKiemTraMs: 40,
      thoiGianXemVai: 5_000,
    });
    const nguoi: Awaited<ReturnType<typeof nguoiChoi>>[] = [];
    for (const ten of ['q_a', 'q_b', 'q_c', 'q_d']) nguoi.push(await nguoiChoi(may, ten, false));
    const ma = (await nguoi[0]!.u.goi('/api/phong', 'POST')).body.maPhong as string;
    for (const p of nguoi.slice(1)) await lenh(p.s, 'phong:vao', { maPhong: ma });
    for (let i = 0; i < 2; i++) await lenh(nguoi[0]!.s, 'phong:them-nguoi-ao', {});
    await lenh(nguoi[0]!.s, 'phong:goi-y-vai', {});
    await cho(() => nguoi[0]!.phong?.viPham.length === 0);
    await lenh(nguoi[0]!.s, 'phong:bat-dau', {});
    await cho(() => may.van.dangChay().length === 1);
    for (const p of nguoi) p.s.disconnect();
    await cho(() => may.van.dangChay().length === 0, 5_000);
    expect(may.phong.chieu(ma).trangThai).toBe('CHO');
  }, 20_000);
});
