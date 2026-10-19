import { describe, expect, it } from 'vitest';
import { Phe, TrangThaiVan } from '../../src/domain/chung/index.js';
import {
  KenhChung,
  KenhNguoiChet,
  KenhSoi,
  LoaiKenh,
  type KenhChat,
  type ThanhVienKenh,
  type TinhHinhKenh,
} from '../../src/domain/kenh/index.js';
import { BoLuatChoi } from '../../src/domain/luat/index.js';
import { DanLang, Soi } from '../../src/domain/vaitro/index.js';
import { NguoiChoi, NguyenNhanChet, VanDau } from '../../src/domain/van/index.js';

const tv = (phe: Phe, conSong: boolean): ThanhVienKenh => ({ conSong, vaiTro: { phe } });
const DAN_SONG = tv(Phe.DAN, true);
const DAN_CHET = tv(Phe.DAN, false);
const SOI_SONG = tv(Phe.SOI, true);
const SOI_CHET = tv(Phe.SOI, false);
const DEM_LUOT_SOI: TinhHinhKenh = { trangThai: TrangThaiVan.PHA_DEM, dangLuotSoi: true };
const THAO_LUAN: TinhHinhKenh = { trangThai: TrangThaiVan.PHA_THAO_LUAN, dangLuotSoi: false };

const chung = new KenhChung();
const soi = new KenhSoi();
const nguoiChet = new KenhNguoiChet();

describe('KenhChat — bảng quyền ARCHITECTURE.md mục 5.2', () => {
  it('mỗi lớp mang đúng loại kênh', () => {
    expect([chung.loaiKenh, soi.loaiKenh, nguoiChet.loaiKenh]).toEqual([
      LoaiKenh.CHUNG,
      LoaiKenh.SOI,
      LoaiKenh.NGUOI_CHET,
    ]);
  });

  it('BR14 — người chết xem được kênh chung và kênh người chết, không xem được kênh Sói', () => {
    for (const chet of [DAN_CHET, SOI_CHET]) {
      expect(chung.coTheXem(chet)).toBe(true);
      expect(nguoiChet.coTheXem(chet)).toBe(true);
      expect(soi.coTheXem(chet)).toBe(false);
    }
  });

  it('người còn sống không bao giờ thấy kênh người chết', () => {
    expect(nguoiChet.coTheXem(DAN_SONG)).toBe(false);
    expect(nguoiChet.coTheXem(SOI_SONG)).toBe(false);
  });

  it('kênh Sói: chỉ Sói còn sống, chỉ gửi được trong lượt Sói', () => {
    expect(soi.coTheXem(SOI_SONG)).toBe(true);
    expect(soi.coTheXem(DAN_SONG)).toBe(false);
    expect(soi.coTheGui(SOI_SONG, DEM_LUOT_SOI)).toBe(true);
    expect(soi.coTheGui(SOI_SONG, { ...DEM_LUOT_SOI, dangLuotSoi: false })).toBe(false);
    expect(soi.coTheGui(DAN_SONG, DEM_LUOT_SOI)).toBe(false);
  });

  it('Q10 — kênh chung mở ở pha thảo luận và pha bỏ phiếu, đóng ở pha đêm', () => {
    expect(chung.coTheGui(DAN_SONG, THAO_LUAN)).toBe(true);
    expect(
      chung.coTheGui(DAN_SONG, { trangThai: TrangThaiVan.PHA_BO_PHIEU, dangLuotSoi: false }),
    ).toBe(true);
    expect(chung.coTheGui(DAN_SONG, DEM_LUOT_SOI)).toBe(false);
    expect(chung.coTheGui(DAN_CHET, THAO_LUAN)).toBe(false);
  });

  it('kênh người chết luôn mở — người chết nhắn được cả ban đêm', () => {
    expect(nguoiChet.coTheGui(DAN_CHET, DEM_LUOT_SOI)).toBe(true);
    expect(nguoiChet.coTheGui(SOI_CHET, THAO_LUAN)).toBe(true);
    expect(nguoiChet.coTheGui(DAN_SONG, THAO_LUAN)).toBe(false);
  });

  // Bảng luật viết lại độc lập với mã nguồn, để đối chiếu toàn bộ ma trận.
  const mongDoi = (kenh: KenhChat, t: ThanhVienKenh, th: TinhHinhKenh) => {
    const laSoiSong = t.conSong && t.vaiTro.phe === Phe.SOI;
    const ngayMo =
      th.trangThai === TrangThaiVan.PHA_THAO_LUAN || th.trangThai === TrangThaiVan.PHA_BO_PHIEU;
    switch (kenh.loaiKenh) {
      case LoaiKenh.CHUNG:
        return { xem: true, gui: t.conSong && ngayMo };
      case LoaiKenh.SOI:
        return {
          xem: laSoiSong,
          gui: laSoiSong && th.trangThai === TrangThaiVan.PHA_DEM && th.dangLuotSoi,
        };
      case LoaiKenh.NGUOI_CHET:
        return { xem: !t.conSong, gui: !t.conSong };
    }
  };

  it('ma trận 3 kênh × 4 kiểu người × 10 trạng thái × lượt Sói khớp bảng luật', () => {
    let soO = 0;
    for (const kenh of [chung, soi, nguoiChet]) {
      for (const t of [DAN_SONG, DAN_CHET, SOI_SONG, SOI_CHET]) {
        for (const trangThai of Object.values(TrangThaiVan)) {
          for (const dangLuotSoi of [true, false]) {
            const th = { trangThai, dangLuotSoi };
            const ky = `${kenh.loaiKenh} ${JSON.stringify(t)} ${trangThai} ${dangLuotSoi}`;
            expect({ xem: kenh.coTheXem(t), gui: kenh.coTheGui(t, th) }, ky).toEqual(
              mongDoi(kenh, t, th),
            );
            soO++;
          }
        }
      }
    }
    expect(soO).toBe(240);
  });

  it('NguoiChoi thật dùng được làm thành viên kênh', () => {
    const nguoiChoi = ['s', 'a', 'b', 'c', 'd', 'e'].map((id, i) => {
      const nc = new NguoiChoi(id, `tk-${id}`, i + 1);
      nc.nhanVai(id === 's' ? new Soi() : new DanLang());
      return nc;
    });
    const van = new VanDau('v', 'ph', nguoiChoi, new BoLuatChoi());
    van.taoLuotMoi();
    const s = van.layNguoiChoi('s');
    expect(soi.coTheXem(s)).toBe(true);
    van.danhDauChet([{ nguoiChoiId: 's', nguyenNhan: NguyenNhanChet.BI_TREO_CO }]);
    expect(soi.coTheXem(s)).toBe(false);
    expect(nguoiChet.coTheXem(s)).toBe(true);
  });
});
