// Hằng số và trạng thái dùng chung của cảnh 3D. Đơn vị: mét giả định, bàn đặt tại gốc tọa độ.
import { createContext, useContext } from 'react';

export const CAO_BAN = 0.9;
export const BAN_KINH_BAN = 2.3;
/** Vòng ghế quanh bàn — quân người chơi đứng ở đây. */
export const BAN_KINH_GHE = 3.15;
/** Vòng thẻ nằm úp trên mặt bàn, trước mặt mỗi người. */
export const BAN_KINH_THE = 1.7;
/** Giá treo cổ dựng phía sau bàn, đối diện người xem. */
export const VI_TRI_GIA_TREO: [number, number, number] = [0, 0, -4.4];

/** Góc của ghế thứ `i` sao cho người xem luôn ngồi ở mép gần camera (+z). */
export function gocGhe(i: number, viTriToi: number, n: number) {
  return Math.PI / 2 + ((i - viTriToi) * 2 * Math.PI) / n;
}

export function diemTrenVong(goc: number, banKinh: number, y: number): [number, number, number] {
  return [banKinh * Math.cos(goc), y, banKinh * Math.sin(goc)];
}

/**
 * Độ "đêm" của cảnh, 0 = giữa trưa, 1 = nửa đêm — một con số trôi mượt mỗi khung hình, mọi lớp
 * (trời, đèn, sương, cửa sổ, đom đóm) cùng đọc nên đổi ngày đêm đồng bộ.
 */
export interface TrangThaiCanh {
  dem: { current: number };
  /** 0..1 — mặt trăng / mặt trời trên vòng cung trời, cũng là đồng hồ của pha. */
  tienDo: { current: number };
}

export const NguCanhCanh = createContext<TrangThaiCanh | null>(null);

export function useCanh(): TrangThaiCanh {
  const c = useContext(NguCanhCanh);
  if (!c) throw new Error('useCanh() phải nằm trong <CanhBaChieu>');
  return c;
}

/** Tiến dần tới đích theo thời gian — giống `THREE.MathUtils.damp`, không phụ thuộc tốc độ khung. */
export function tienToi(hienTai: number, dich: number, doNhanh: number, dt: number) {
  return hienTai + (dich - hienTai) * (1 - Math.exp(-doNhanh * dt));
}

/** Bộ sinh số giả ngẫu nhiên có hạt — cảnh vẽ giống nhau mỗi lần mở. */
export function taoNgauNhien(hat: number) {
  let a = hat;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
