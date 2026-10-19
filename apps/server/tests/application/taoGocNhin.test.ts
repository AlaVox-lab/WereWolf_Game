import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import { describe, expect, it } from 'vitest';
import { taoGocNhin } from '../../src/application/taoGocNhin.js';
import { LoaiHanhDong, Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import {
  BaoVe,
  DanLang,
  PhuThuy,
  Soi,
  ThoSan,
  TienTri,
  type VaiTro,
} from '../../src/domain/vaitro/index.js';
import { chayKichBan, taoTran, type TraLoi, type Tran } from './kichBan.js';

const T = TrangThaiVan;

// Ván 8 người: s1, s2 (Sói), bv, tt, pt, ts, A, B.
const VAI: Record<string, () => VaiTro> = {
  s1: () => new Soi(),
  s2: () => new Soi(),
  bv: () => new BaoVe(),
  tt: () => new TienTri(),
  pt: () => new PhuThuy(),
  ts: () => new ThoSan(),
  A: () => new DanLang(),
  B: () => new DanLang(),
};
const MA_VAI = /\b(DanLang|BaoVe|Soi|TienTri|PhuThuy|ThoSan)\b/g;

type NgCanh = { lan: number; trangThai: TrangThaiVan };

/** Kịch bản cả ván: Sói cắn Dân đầu tiên còn sống; ban ngày cả làng bầu Sói đầu tiên còn sống. */
function kichBanCaVan(tran: Tran): Record<string, TraLoi> {
  const conSong = () => tran.van.layNguoiConSong();
  const soiDau = () => conSong().find((n) => n.vaiTro.phe === Phe.SOI)?.id;
  const danDau = () => conSong().find((n) => n.vaiTro.phe === Phe.DAN)?.id;
  const ngay = ({ trangThai }: NgCanh) =>
    trangThai === T.PHA_DEM ? undefined : { mucTieuId: soiDau() ?? null };
  const kichBan: Record<string, TraLoi> = {};
  for (const id of Object.keys(VAI)) kichBan[id] = ngay;
  const soi = (c: NgCanh) => (c.trangThai === T.PHA_DEM ? { mucTieuId: danDau() } : ngay(c));
  kichBan.s1 = soi;
  kichBan.s2 = soi;
  kichBan.tt = (c: NgCanh) => (c.trangThai === T.PHA_DEM ? { mucTieuId: 's1' } : ngay(c));
  kichBan.ts = (c: NgCanh) =>
    c.trangThai === T.GIAI_QUYET_PHIEU || c.trangThai === T.GIAI_QUYET_DEM
      ? { mucTieuId: soiDau() }
      : ngay(c);
  return kichBan;
}

/** Kiểm một góc nhìn không lộ gì ngoài phần của người xem. Trả số điều đã kiểm. */
function kiemKhongLo(v: GocNhinNguoiChoi): number {
  const daKetThuc = v.trangThai === 'KET_THUC';
  // Người khác chỉ có mã, ghế, còn sống — không vai, không phe.
  for (const n of v.nguoiChoi) expect(Object.keys(n).sort()).toEqual(['conSong', 'id', 'thuTuGhe']);
  if (!daKetThuc) expect(v.ketThuc).toBeNull();
  if (v.toi.phe !== 'SOI') expect(v.toi.dongDoi).toBeNull();
  if (v.toi.loaiVai !== 'TienTri') expect(v.ketQuaSoi).toEqual([]);
  if (v.viecCanLam?.nanNhan) expect(v.toi.loaiVai).toBe('PhuThuy');

  // Quét mã vai trong toàn bộ góc nhìn (trừ bước đêm công khai và phần kết thúc).
  const { buocDem: _b, ketThuc: _k, ...conLai } = v;
  const maVaiThay = new Set(JSON.stringify(conLai).match(MA_VAI) ?? []);
  expect([...maVaiThay].every((m) => m === v.toi.loaiVai)).toBe(true);

  // Dân thường (không Sói, không Tiên tri) không bao giờ thấy chữ phe "SOI" trước khi hết ván.
  if (!daKetThuc && v.toi.phe !== 'SOI' && v.toi.loaiVai !== 'TienTri') {
    expect(JSON.stringify(conLai)).not.toContain('"SOI"');
  }
  return 7;
}

describe('taoGocNhin — PC04, bản đơn vị của ST05', () => {
  it('suốt một ván, sau mọi sự kiện, góc nhìn của mọi người đều không lộ vai người khác', async () => {
    const tran = taoTran(VAI);
    const ids = tran.van.layDanhSachNguoiChoi().map((n) => n.id);
    let soDieuDaKiem = 0;
    let soGocNhin = 0;
    tran.dieuPhoi.suKien.dangKy(() => {
      for (const id of ids) {
        soDieuDaKiem += kiemKhongLo(taoGocNhin(tran.dieuPhoi, id));
        soGocNhin++;
      }
    });
    const { ketQua } = await chayKichBan(tran, tran.dieuPhoi.chayVan(), kichBanCaVan(tran));
    expect(ketQua).toBe(Phe.DAN);
    expect(soGocNhin).toBeGreaterThan(200);
    expect(soDieuDaKiem).toBeGreaterThan(1_000);

    // Hết ván thì mở toàn bộ vai cho mọi người (MH08).
    const cuoi = taoGocNhin(tran.dieuPhoi, 'A');
    expect(cuoi.ketThuc?.pheThang).toBe('DAN');
    expect(cuoi.ketThuc?.vai).toHaveLength(8);
    expect(cuoi.ketThuc?.vai.find((x) => x.id === 's1')).toEqual({
      id: 's1',
      loaiVai: 'Soi',
      phe: 'SOI',
    });
  });
});

describe('taoGocNhin — từng phần của góc nhìn', () => {
  /** Chạy pha đêm; trả lời theo kịch bản và chụp góc nhìn của người được mời ngay lúc mời. */
  async function chupKhiDuocMoi(kichBan: Record<string, unknown>, chup: string[]) {
    const tran = taoTran(VAI);
    const anh = new Map<string, GocNhinNguoiChoi>();
    const kb: Record<string, TraLoi> = {};
    for (const id of Object.keys(VAI)) {
      kb[id] = () => {
        if (chup.includes(id) && !anh.has(id)) anh.set(id, taoGocNhin(tran.dieuPhoi, id));
        return kichBan[id];
      };
    }
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), kb);
    return { tran, anh };
  }

  it('Bảo vệ trong lượt mình: việc cần làm và mục tiêu hợp lệ; Dân làng ban đêm không có việc gì', async () => {
    const tran = taoTran(VAI);
    const hua = tran.dieuPhoi.xuLyPhaDem();
    await new Promise((r) => setImmediate(r));
    const bv = taoGocNhin(tran.dieuPhoi, 'bv');
    expect(bv.viecCanLam).toMatchObject({ viec: 'HANH_DONG_DEM', choPhepBoTrang: false });
    expect(bv.viecCanLam?.luaChon).toEqual([{ mucTieu: Object.keys(VAI) }]);
    expect(bv.toi.trangThaiKyNang).toEqual({ mucTieuDemTruoc: null });
    expect(bv.hetHanPha).toBeNull(); // đêm không có hạn công khai (Q05)

    const a = taoGocNhin(tran.dieuPhoi, 'A');
    expect(a.viecCanLam).toBeNull();
    expect(a.buocDem).toBe('BaoVe');
    expect(a.kenhGuiDuoc).toEqual([]);
    await chayKichBan(tran, hua);
  });

  it('Sói: biết đồng đội, gửi được kênh Sói trong lượt Sói', async () => {
    const { anh } = await chupKhiDuocMoi({ s1: { mucTieuId: 'A' }, s2: { mucTieuId: 'A' } }, [
      's1',
    ]);
    const s1 = anh.get('s1')!;
    expect(s1.toi.dongDoi).toEqual(['s2']);
    expect(s1.kenhGuiDuoc).toEqual(['SOI']);
    expect(s1.viecCanLam?.luaChon[0]?.mucTieu).not.toContain('s2');
  });

  it('Phù thủy trong lượt mình: hai nhóm cứu/độc, được báo nạn nhân và cờ an toàn (BR07)', async () => {
    const { anh } = await chupKhiDuocMoi(
      { bv: { mucTieuId: 'A' }, s1: { mucTieuId: 'A' }, s2: { mucTieuId: 'A' } },
      ['pt'],
    );
    const pt = anh.get('pt')!;
    expect(pt.viecCanLam?.luaChon.map((n) => n.loai)).toEqual(['CUU', 'DOC']);
    expect(pt.viecCanLam?.luaChon[0]?.mucTieu).toEqual(['A']);
    expect(pt.viecCanLam?.nanNhan).toEqual({ nanNhanId: 'A', anToan: true });
    expect(pt.toi.trangThaiKyNang).toEqual({ conThuocCuu: true, conThuocDoc: true });
  });

  it('Tiên tri thấy kết quả soi của mình; người khác không', async () => {
    const { tran } = await chupKhiDuocMoi({ tt: { mucTieuId: 's2' } }, []);
    expect(taoGocNhin(tran.dieuPhoi, 'tt').ketQuaSoi).toEqual([
      { luot: 1, mucTieuId: 's2', phe: 'SOI' },
    ]);
    expect(taoGocNhin(tran.dieuPhoi, 'bv').ketQuaSoi).toEqual([]);
  });

  it('người chết chỉ biết vai của chính mình; xem được kênh chung và kênh người chết (BR14, Q09)', async () => {
    const { tran } = await chupKhiDuocMoi({ s1: { mucTieuId: 'bv' }, s2: { mucTieuId: 'bv' } }, []);
    tran.dieuPhoi.sauDem();
    const bv = taoGocNhin(tran.dieuPhoi, 'bv');
    expect(bv.toi).toMatchObject({ loaiVai: 'BaoVe', conSong: false });
    expect(bv.kenhXemDuoc).toEqual(['CHUNG', 'NGUOI_CHET']);
    expect(bv.congBoSang).toEqual(['bv']);
    const a = taoGocNhin(tran.dieuPhoi, 'A');
    expect(a.nguoiChoi.find((n) => n.id === 'bv')).toEqual({
      id: 'bv',
      thuTuGhe: 3,
      conSong: false,
    });
  });

  it('bỏ phiếu: được bỏ trắng, tiến độ là số đếm, hạn pha công khai', async () => {
    const tran = taoTran(VAI);
    let anhLucBau: GocNhinNguoiChoi | undefined;
    const kb: Record<string, TraLoi> = {};
    for (const id of Object.keys(VAI)) {
      kb[id] = ({ trangThai }: NgCanh) => {
        if (trangThai !== T.PHA_BO_PHIEU) return undefined;
        if (id === 'B') anhLucBau = taoGocNhin(tran.dieuPhoi, 'B');
        return { mucTieuId: null };
      };
    }
    await chayKichBan(
      tran,
      (async () => {
        await tran.dieuPhoi.xuLyPhaDem();
        tran.dieuPhoi.sauDem();
        await tran.dieuPhoi.xuLyPhaNgay();
      })(),
      kb,
    );
    expect(anhLucBau?.viecCanLam).toMatchObject({ viec: 'BO_PHIEU', choPhepBoTrang: true });
    expect(anhLucBau?.tienDoBoPhieu?.tong).toBe(8);
    expect(anhLucBau?.hetHanPha).toBeGreaterThan(0);
    expect(anhLucBau?.kenhGuiDuoc).toEqual(['CHUNG']);
  });

  it('Thợ săn bị treo cổ bắn người: kết quả ngày chỉ nói ai chết, không nói ai bắn (Q09)', async () => {
    const tran = taoTran(VAI);
    const kb: Record<string, TraLoi> = {};
    for (const id of Object.keys(VAI)) {
      kb[id] = ({ trangThai }: NgCanh) =>
        trangThai === T.PHA_BO_PHIEU ? { mucTieuId: 'ts' } : undefined;
    }
    kb.ts = ({ trangThai }: NgCanh) =>
      trangThai === T.GIAI_QUYET_PHIEU
        ? { mucTieuId: 'B' }
        : trangThai === T.PHA_BO_PHIEU
          ? { mucTieuId: 'A' }
          : undefined;
    await chayKichBan(
      tran,
      (async () => {
        await tran.dieuPhoi.xuLyPhaDem();
        tran.dieuPhoi.sauDem();
        await tran.dieuPhoi.xuLyPhaNgay();
      })(),
      kb,
    );
    const a = taoGocNhin(tran.dieuPhoi, 'A');
    expect(a.ketQuaNgay).toEqual({ nguoiBiTreoId: 'ts', coBauLai: false, nguoiChetThem: ['B'] });
    expect(JSON.stringify(a.ketQuaNgay)).not.toContain('nguoiBan');
  });

  it('BR03 tắt: đêm 1 Phù thủy không thấy nhóm độc', async () => {
    const tran = taoTran(VAI, { batDemDauCoChet: false });
    let pt: GocNhinNguoiChoi | undefined;
    await chayKichBan(tran, tran.dieuPhoi.xuLyPhaDem(), {
      pt: () => {
        pt = taoGocNhin(tran.dieuPhoi, 'pt');
        return { mucTieuId: 'A', loai: LoaiHanhDong.DOC };
      },
    });
    expect(pt?.viecCanLam?.luaChon.map((n) => n.loai)).toEqual(['CUU']);
  });
});
