import { describe, expect, it } from 'vitest';
import { BoGiaiQuyetDem } from '../../src/application/BoGiaiQuyetDem.js';
import { BoHenGio } from '../../src/application/BoHenGio.js';
import { CongLuaChon } from '../../src/application/CongLuaChon.js';
import { DongHoGia, LoiNghiepVu } from '../../src/domain/chung/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import { DanLang, Soi, ThoSan, type VaiTro } from '../../src/domain/vaitro/index.js';
import { NguoiChoi, NguyenNhanChet, VanDau } from '../../src/domain/van/index.js';

function batLoi(fn: () => unknown): LoiNghiepVu {
  try {
    fn();
  } catch (e) {
    if (e instanceof LoiNghiepVu) return e;
    throw e;
  }
  throw new Error('không ném lỗi');
}

/** Chờ mọi microtask đang treo chạy xong — để lời hứa kịp giải quyết sau khi tua đồng hồ. */
const choMicrotask = () => new Promise<void>((r) => setImmediate(r));

/** Chỉ nhận chuỗi nằm trong danh sách cho phép. */
const chiNhan = (choPhep: string[]) => (luaChon: unknown) => {
  if (typeof luaChon !== 'string' || !choPhep.includes(luaChon)) {
    throw new LoiNghiepVu('MUC_TIEU_KHONG_HOP_LE', String(luaChon));
  }
  return luaChon;
};

describe('BoHenGio — tác nhân AC04', () => {
  it('gọi lại đúng lúc hết hạn và trả thời điểm hết hạn tuyệt đối', () => {
    const dongHo = new DongHoGia(1_000);
    const hen = new BoHenGio(dongHo);
    let daGoi = false;
    expect(hen.datHen('dem', 30_000, () => (daGoi = true))).toBe(31_000);
    expect(hen.layHetHanLuc('dem')).toBe(31_000);
    dongHo.tua(29_999);
    expect(daGoi).toBe(false);
    dongHo.tua(1);
    expect(daGoi).toBe(true);
    expect(hen.dangCho('dem')).toBe(false);
  });

  it('đặt lại cùng mã thì hẹn cũ bị hủy', () => {
    const dongHo = new DongHoGia();
    const hen = new BoHenGio(dongHo);
    const goi: string[] = [];
    hen.datHen('buoc', 10, () => goi.push('cu'));
    hen.datHen('buoc', 20, () => goi.push('moi'));
    dongHo.tua(100);
    expect(goi).toEqual(['moi']);
  });

  it('hủy một hẹn hoặc tất cả', () => {
    const dongHo = new DongHoGia();
    const hen = new BoHenGio(dongHo);
    let soLan = 0;
    hen.datHen('a', 10, () => soLan++);
    hen.datHen('b', 10, () => soLan++);
    hen.huy('a');
    expect(hen.dangCho('a')).toBe(false);
    hen.huyTatCa();
    dongHo.tua(100);
    expect(soLan).toBe(0);
    expect(dongHo.soHenDangCho()).toBe(0);
  });
});

describe('CongLuaChon — cái nào đến trước', () => {
  const taoCong = () => {
    const dongHo = new DongHoGia();
    return { dongHo, cong: new CongLuaChon(new BoHenGio(dongHo)) };
  };

  it('người chơi chọn trước hạn: lời hứa trả lựa chọn, đồng hồ bị hủy', async () => {
    const { dongHo, cong } = taoCong();
    const hua = cong.cho('p1', 25_000, chiNhan(['a', 'b']));
    expect(cong.dangChoNguoi('p1')).toBe(true);
    cong.ghiNhan('p1', 'b');
    expect(await hua).toBe('b');
    expect(cong.dangChoNguoi('p1')).toBe(false);
    expect(dongHo.soHenDangCho()).toBe(0);
  });

  it('BR12 — hết giờ chưa chọn: lời hứa trả null (bỏ lượt)', async () => {
    const { dongHo, cong } = taoCong();
    const hua = cong.cho('p1', 25_000, chiNhan(['a']));
    dongHo.tua(25_000);
    expect(await hua).toBeNull();
    expect(cong.dangChoNguoi('p1')).toBe(false);
  });

  it('lệnh tới sau khi hết giờ bị từ chối', async () => {
    const { dongHo, cong } = taoCong();
    const hua = cong.cho('p1', 1_000, chiNhan(['a']));
    dongHo.tua(1_000);
    await hua;
    expect(batLoi(() => cong.ghiNhan('p1', 'a')).ma).toBe('KHONG_CO_YEU_CAU');
  });

  it('lựa chọn sai bị báo lỗi nhưng vẫn chờ; chọn lại đúng thì nhận', async () => {
    const { cong } = taoCong();
    const hua = cong.cho('p1', 25_000, chiNhan(['a']));
    expect(batLoi(() => cong.ghiNhan('p1', 'x')).ma).toBe('MUC_TIEU_KHONG_HOP_LE');
    expect(cong.dangChoNguoi('p1')).toBe(true);
    cong.ghiNhan('p1', 'a');
    expect(await hua).toBe('a');
  });

  it('nhiều người chờ cùng lúc, mỗi người một lời mời; mời trùng người bị chặn', async () => {
    const { dongHo, cong } = taoCong();
    const s1 = cong.cho('s1', 45_000, chiNhan(['a', 'b']));
    const s2 = cong.cho('s2', 45_000, chiNhan(['a', 'b']));
    expect(() => cong.cho('s1', 1, chiNhan([]))).toThrow('DANG_CHO_LUA_CHON');
    cong.ghiNhan('s2', 'a');
    dongHo.tua(45_000);
    expect(await Promise.all([s1, s2])).toEqual([null, 'a']);
  });

  it('chưa được mời thì không ghi nhận được', () => {
    expect(batLoi(() => taoCong().cong.ghiNhan('p9', 'a')).ma).toBe('KHONG_CO_YEU_CAU');
  });

  it('hủy lời mời sớm: trả null như bỏ lượt', async () => {
    const { dongHo, cong } = taoCong();
    const hua = cong.cho('p1', 25_000, chiNhan(['a']));
    const hua2 = cong.cho('p2', 25_000, chiNhan(['a']));
    cong.huy('p1');
    cong.huyTatCa();
    expect(await Promise.all([hua, hua2])).toEqual([null, null]);
    expect(dongHo.soHenDangCho()).toBe(0);
  });

  it('trả thời điểm hết hạn để gửi xuống giao diện', () => {
    const dongHo = new DongHoGia(5_000);
    const cong = new CongLuaChon(new BoHenGio(dongHo));
    void cong.cho('p1', 15_000, chiNhan(['a']));
    expect(cong.layHetHanLuc('p1')).toBe(20_000);
    expect(cong.layHetHanLuc('p2')).toBeNull();
  });
});

describe('CongLuaChon cắm vào dây chuyền Thợ săn', () => {
  function taoVan() {
    const vai: Record<string, VaiTro> = {
      ts: new ThoSan(),
      soi: new Soi(),
      A: new DanLang(),
      B: new DanLang(),
      C: new DanLang(),
      D: new DanLang(),
    };
    const nguoiChoi = Object.entries(vai).map(([id, v], i) => {
      const nc = new NguoiChoi(id, `tk-${id}`, i + 1);
      nc.nhanVai(v);
      return nc;
    });
    const van = new VanDau('v', 'ph', nguoiChoi, new BoLuatChoi());
    van.taoLuotMoi();
    van.danhDauChet([{ nguoiChoiId: 'ts', nguyenNhan: NguyenNhanChet.BI_TREO_CO }]);
    return van;
  }

  const ganCong = (cong: CongLuaChon) => (thoSan: NguoiChoi, ungVien: readonly NguoiChoi[]) =>
    cong.cho(thoSan.id, 15_000, chiNhan(ungVien.map((n) => n.id)));

  it('Thợ săn chọn trong 15 giây thì bắn', async () => {
    const dongHo = new DongHoGia();
    const cong = new CongLuaChon(new BoHenGio(dongHo));
    const van = taoVan();
    const xong = new BoGiaiQuyetDem().xuLyDayChuyen(van, ['ts'], ganCong(cong));
    await choMicrotask();
    cong.ghiNhan('ts', 'soi');
    expect(await xong).toEqual([{ nguoiBanId: 'ts', mucTieuId: 'soi' }]);
  });

  it('UC17 luồng 2a — Thợ săn để hết giờ thì không ai bị bắn', async () => {
    const dongHo = new DongHoGia();
    const cong = new CongLuaChon(new BoHenGio(dongHo));
    const van = taoVan();
    const xong = new BoGiaiQuyetDem().xuLyDayChuyen(van, ['ts'], ganCong(cong));
    await choMicrotask();
    dongHo.tua(15_000);
    expect(await xong).toEqual([]);
    expect(van.layNguoiConSong()).toHaveLength(5);
  });
});
