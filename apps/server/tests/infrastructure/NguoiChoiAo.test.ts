import { describe, expect, it } from 'vitest';
import { BoKiemTraThangThua, KetQuaThangThua } from '../../src/application/BoKiemTraThangThua.js';
import { NgauNhienCoHat, Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  ThoSan,
  TienTri,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';
import { NguoiChoiAo } from '../../src/infrastructure/bot/NguoiChoiAo.js';
import { taoTran, xaHangDoi, type Tran } from '../application/kichBan.js';

/** Bộ vai n người: Sói lớn nhất còn < n/3 (Q06), bốn vai đặc biệt, còn lại Dân làng. */
function boVai(n: number): Record<string, () => VaiTro> {
  const vai: Record<string, () => VaiTro> = {};
  const soSoi = Math.max(1, Math.floor((n - 1) / 3));
  for (let i = 1; i <= soSoi; i++) vai[`soi${i}`] = () => new Soi();
  vai.bv = () => new BaoVe();
  vai.tt = () => new TienTri();
  vai.pt = () => new PhuThuy();
  vai.ts = () => new ThoSan();
  for (let i = 1; Object.keys(vai).length < n; i++) vai[`dan${i}`] = () => new DanLang();
  return vai;
}

interface LanGui {
  id: string;
  luc: number;
  trangThai: TrangThaiVan;
  loi: string | null;
}

/** Dựng ván, gắn người chơi ảo cho mọi người trừ `nguoiThat`, ghi lại mọi lời mời và lần gửi. */
function dungVanAo(n: number, hatGiong: number, nguoiThat: string[] = []) {
  const tran = taoTran(boVai(n), {}, hatGiong);
  const cacBot = tran.van
    .layDanhSachNguoiChoi()
    .filter((p) => !nguoiThat.includes(p.id))
    .map(
      (p, i) =>
        new NguoiChoiAo(
          p.id,
          tran.dieuPhoi,
          tran.cong,
          tran.boHenGio,
          new NgauNhienCoHat(hatGiong * 100 + i),
        ),
    );
  const moi: { id: string; luc: number }[] = [];
  tran.dieuPhoi.suKien.dangKy((sk) => {
    if (sk.loai === 'MOI_HANH_DONG') moi.push({ id: sk.nguoiChoiId, luc: tran.dongHo.bayGio() });
  });
  const gui: LanGui[] = [];
  const goc = tran.cong.ghiNhan.bind(tran.cong);
  tran.cong.ghiNhan = (id: string, luaChon: unknown) => {
    const lan: LanGui = { id, luc: tran.dongHo.bayGio(), trangThai: tran.van.trangThai, loi: null };
    gui.push(lan);
    try {
      goc(id, luaChon);
    } catch (e) {
      lan.loi = (e as { ma?: string }).ma ?? String(e);
      throw e;
    }
  };
  for (const bot of cacBot) bot.batDau();
  return { tran, cacBot, moi, gui };
}

/** Tua đồng hồ giả tới khi lời hứa xong. */
async function chayDenXong<T>(tran: Tran, hua: Promise<T>): Promise<T> {
  let xong = false;
  let ketQua: T | undefined;
  hua.then((v) => {
    xong = true;
    ketQua = v;
  });
  for (let i = 0; i < 20_000 && !xong; i++) {
    await xaHangDoi();
    if (!xong) tran.dongHo.tua(500);
  }
  if (!xong) throw new Error('ván không kết thúc');
  return ketQua as T;
}

describe('NguoiChoiAo — người chơi ảo đi chung luồng với người thật (2.8)', () => {
  it('một ván 8 người toàn người chơi ảo chạy tới khi có phe thắng, không lần gửi nào bị từ chối', async () => {
    const { tran, gui } = dungVanAo(8, 1);
    const pheThang = await chayDenXong(tran, tran.dieuPhoi.chayVan());
    expect([Phe.DAN, Phe.SOI]).toContain(pheThang);
    expect(gui.length).toBeGreaterThan(5);
    expect(gui.filter((g) => g.loi)).toEqual([]);
    // Phe thắng khớp công thức BR01/BR02 trên trạng thái cuối.
    const kq = new BoKiemTraThangThua().kiemTra(tran.van);
    expect(kq).toBe(
      pheThang === Phe.DAN ? KetQuaThangThua.PHE_DAN_THANG : KetQuaThangThua.PHE_SOI_THANG,
    );
  });

  it('trả lời sau 1–4 giây kể từ khi được mời', async () => {
    const { tran, moi, gui } = dungVanAo(8, 2);
    await chayDenXong(tran, tran.dieuPhoi.chayVan());
    for (const g of gui) {
      const loiMoi = moi.filter((m) => m.id === g.id && m.luc <= g.luc).at(-1)!;
      expect(g.luc - loiMoi.luc).toBeGreaterThanOrEqual(1_000);
      expect(g.luc - loiMoi.luc).toBeLessThanOrEqual(4_500); // tua đồng hồ theo bước 0,5 giây
    }
  });

  it('chỉ gửi khi được mời — Dân làng không bao giờ gửi gì ban đêm', async () => {
    const { tran, gui } = dungVanAo(8, 3);
    await chayDenXong(tran, tran.dieuPhoi.chayVan());
    const danDem = gui.filter(
      (g) => g.id.startsWith('dan') && g.trangThai === TrangThaiVan.PHA_DEM,
    );
    expect(danDem).toEqual([]);
  });

  it('người thật không trả lời thì người chơi ảo cũng không trả lời thay', async () => {
    const { tran, gui } = dungVanAo(8, 4, ['dan1']);
    await chayDenXong(tran, tran.dieuPhoi.chayVan());
    expect(gui.filter((g) => g.id === 'dan1')).toEqual([]);
  });

  it('dừng người chơi ảo thì nó thôi trả lời', async () => {
    const { tran, cacBot, gui } = dungVanAo(8, 5);
    cacBot.find((b) => b.nguoiChoiId === 'bv')!.dung();
    await chayDenXong(tran, tran.dieuPhoi.xuLyPhaDem());
    expect(gui.filter((g) => g.id === 'bv')).toEqual([]);
  });

  it('cùng hạt giống cho cùng một ván — cùng phe thắng, cùng nhật ký (PC03)', async () => {
    const chay = async () => {
      const { tran } = dungVanAo(9, 6);
      await chayDenXong(tran, tran.dieuPhoi.chayVan());
      return JSON.stringify(tran.van.nhatKy.xuatBanCongKhai());
    };
    expect(await chay()).toBe(await chay());
  });

  it('20 ván 6–12 người với hạt giống khác nhau đều kết thúc, không lỗi', async () => {
    const thang = { DAN: 0, SOI: 0 };
    for (let hat = 10; hat < 30; hat++) {
      const n = 6 + (hat % 7);
      const { tran, gui } = dungVanAo(n, hat);
      const pheThang = await chayDenXong(tran, tran.dieuPhoi.chayVan());
      expect(tran.van.trangThai).toBe(TrangThaiVan.KET_THUC);
      expect(gui.filter((g) => g.loi)).toEqual([]);
      thang[pheThang]++;
    }
    expect(thang.DAN + thang.SOI).toBe(20);
  });
});
