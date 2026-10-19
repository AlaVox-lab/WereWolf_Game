// Bộ dựng ván và điều khiển kịch bản dùng chung cho kiểm thử bộ điều phối — không phải tệp kiểm thử.
import { BoDieuPhoiVan } from '../../src/application/BoDieuPhoiVan.js';
import { BoHenGio } from '../../src/application/BoHenGio.js';
import { CongLuaChon } from '../../src/application/CongLuaChon.js';
import {
  DongHoGia,
  LoaiVai,
  LoiNghiepVu,
  NgauNhienCoHat,
  type TrangThaiVan,
} from '../../src/domain/chung/index.js';
import { BoLuatChoi, CauHinhVai, type CauHinhBoLuat } from '../../src/domain/luat/index.js';
import type { VaiTro } from '../../src/domain/vaitro/index.js';
import { NguoiChoi, VanDau } from '../../src/domain/van/index.js';

/**
 * Dựng ván đã chia vai, đang ở `PHA_DEM`, cùng đồng hồ giả, cổng lựa chọn và bộ điều phối.
 * `vai` là bảng mã người chơi → hàm tạo vai; cấu hình vai suy ra từ chính bảng này.
 */
export function taoTran(
  vai: Record<string, () => VaiTro>,
  luat: Partial<CauHinhBoLuat> = {},
  hatGiong = 1,
) {
  const nguoiChoi = Object.entries(vai).map(([id, tao], i) => {
    const nc = new NguoiChoi(id, `tk-${id}`, i + 1);
    nc.nhanVai(tao());
    return nc;
  });
  const soLuong: Partial<Record<LoaiVai, number>> = {};
  for (const n of nguoiChoi) soLuong[n.vaiTro.loaiVai] = (soLuong[n.vaiTro.loaiVai] ?? 0) + 1;
  const van = new VanDau('v1', 'ph1', nguoiChoi, new BoLuatChoi(luat));
  van.chuyenPha('batDauVan');
  van.chuyenPha('chiaVaiXong');
  const dongHo = new DongHoGia();
  const boHenGio = new BoHenGio(dongHo);
  const cong = new CongLuaChon(boHenGio);
  const dieuPhoi = new BoDieuPhoiVan(van, new CauHinhVai(soLuong), {
    boHenGio,
    congLuaChon: cong,
    nguonNgauNhien: new NgauNhienCoHat(hatGiong),
  });
  return { van, dongHo, cong, dieuPhoi };
}

export type Tran = ReturnType<typeof taoTran>;

/**
 * Câu trả lời cho một người: một giá trị (lần mời nào cũng trả), một dãy (mỗi lần mời một phần
 * tử), hoặc một hàm nhận số thứ tự lần mời và trạng thái ván. Trả `undefined` là để hết giờ.
 */
export type TraLoi = unknown | ((ngCanh: { lan: number; trangThai: TrangThaiVan }) => unknown);

export const xaHangDoi = async () => {
  for (let i = 0; i < 5; i++) await new Promise<void>((r) => setImmediate(r));
};

/**
 * Chạy `hua` tới khi xong: mỗi vòng xả hàng đợi, ghi ai vừa được mời, trả lời theo `kichBan`
 * (không có trong kịch bản, hoặc dãy đã hết, thì để hết giờ), rồi tua đồng hồ 1 giây.
 * Câu trả lời dạng mảng được dùng lần lượt cho từng lần mời.
 */
export async function chayKichBan<T>(
  tran: Tran,
  hua: Promise<T>,
  kichBan: Record<string, TraLoi> = {},
) {
  const { dongHo, cong, van } = tran;
  let xong = false;
  let ketQua: T | undefined;
  let loi: unknown;
  hua.then(
    (v) => {
      xong = true;
      ketQua = v;
    },
    (e) => {
      xong = true;
      loi = e;
    },
  );
  const thuTuMoi: { id: string; luc: number }[] = [];
  const dangMoi = new Set<string>();
  const soLanMoi = new Map<string, number>();
  const loiGhiNhan: { id: string; ma: string }[] = [];
  const ids = van.layDanhSachNguoiChoi().map((n) => n.id);
  for (let vong = 0; vong < 2_000 && !xong; vong++) {
    await xaHangDoi();
    for (const id of ids) {
      const moi = cong.dangChoNguoi(id);
      if (moi && !dangMoi.has(id)) {
        thuTuMoi.push({ id, luc: dongHo.bayGio() });
        const lan = soLanMoi.get(id) ?? 0;
        soLanMoi.set(id, lan + 1);
        const traLoi = kichBan[id];
        const giaTri =
          typeof traLoi === 'function'
            ? traLoi({ lan, trangThai: van.trangThai })
            : Array.isArray(traLoi)
              ? traLoi[lan]
              : traLoi;
        if (id in kichBan && giaTri !== undefined) {
          try {
            cong.ghiNhan(id, giaTri);
          } catch (e) {
            // Lựa chọn bị luật từ chối: ghi lại, lời mời vẫn mở tới hết giờ.
            if (!(e instanceof LoiNghiepVu)) throw e;
            loiGhiNhan.push({ id, ma: e.ma });
          }
        }
      }
      if (moi && cong.dangChoNguoi(id)) dangMoi.add(id);
      else dangMoi.delete(id);
    }
    await xaHangDoi();
    if (!xong) dongHo.tua(1_000);
  }
  if (!xong) throw new Error('kịch bản không kết thúc');
  if (loi) throw loi;
  return { ketQua: ketQua as T, thuTuMoi, loiGhiNhan, thoiGian: dongHo.bayGio() };
}
