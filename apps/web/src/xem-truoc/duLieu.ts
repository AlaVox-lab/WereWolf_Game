// Ván mẫu để xem trước giao diện khi chưa có máy chủ thời gian thực (Giai đoạn 4). Tệp JSON do
// `npm run xuat-xem-truoc` sinh từ bộ mô phỏng thật: đúng những GocNhinNguoiChoi máy chủ sẽ gửi.
import type { GocNhinNguoiChoi } from '@moonvillage/shared';

interface KhungTho {
  t: number;
  su: string;
  /** `null` = y hệt khung trước của chính người đó. */
  gocNhin: (GocNhinNguoiChoi | null)[];
}

interface DuLieuTho {
  soNguoi: number;
  hatGiong: number;
  pheThang: string;
  soLuot: number;
  khung: KhungTho[];
}

export interface Khung {
  /** Thời điểm giả lập, mili giây. */
  t: number;
  /** Sự kiện miền vừa phát, hoặc `NHIP` cho mẫu lấy theo giây. */
  su: string;
  /** Góc nhìn của từng người, theo thứ tự ghế. */
  gocNhin: GocNhinNguoiChoi[];
}

export interface VanMau {
  hatGiong: number;
  khung: Khung[];
}

export async function taiVanMau(url = '/xem-truoc/van-mau.json'): Promise<VanMau> {
  const tho = (await (await fetch(url)).json()) as DuLieuTho;
  const hienTai: GocNhinNguoiChoi[] = [];
  const khung = tho.khung.map((k) => {
    k.gocNhin.forEach((g, i) => {
      if (g) hienTai[i] = g;
    });
    return { t: k.t, su: k.su, gocNhin: [...hienTai] };
  });
  return { hatGiong: tho.hatGiong, khung };
}

/**
 * Tên mẫu cho từng ghế — tên thật đến từ tài khoản ở Giai đoạn 4. Góc nhìn chỉ có mã người chơi.
 */
const TEN_MAU = [
  'Ngân',
  'Khoa',
  'Linh',
  'Tùng',
  'Mai',
  'Bảo',
  'Hà',
  'Quân',
  'Thư',
  'Duy',
  'Vy',
  'Phúc',
];
export const tenNguoiChoi = (id: string, thuTuGhe: number) =>
  TEN_MAU[thuTuGhe - 1] ?? id.toUpperCase();
