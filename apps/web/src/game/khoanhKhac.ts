// Khoảnh khắc đáng diễn hoạt, suy từ hai góc nhìn liền nhau của CÙNG một người. Đây là việc của
// lớp trình bày (chọn lúc nào chiếu cảnh gì), không phải luật: ai chết, ai bị treo đã có sẵn
// trong góc nhìn máy chủ gửi.
import type { GocNhinNguoiChoi, LoaiVaiCongKhai } from '@moonvillage/shared';
import { thoiCua, type Thoi } from './hienThi';

export type KhoanhKhac =
  | { loai: 'DOI_THOI'; thoi: Thoi }
  | { loai: 'GOI_VAI'; vai: LoaiVaiCongKhai }
  | { loai: 'CONG_BO'; nguoiChet: string[] }
  | { loai: 'TREO_CO'; id: string }
  | { loai: 'BI_BAN'; id: string }
  | { loai: 'KHONG_AI_BI_TREO'; coBauLai: boolean }
  | { loai: 'KET_THUC' };

/**
 * Người chết ban ngày hiện ra theo đúng thứ tự máy chủ thi hành: người bị treo trước, rồi những
 * người trúng tên Thợ săn. Vì vậy người chết đầu tiên trong pha phán quyết là người bị treo —
 * và `ketQuaNgay.nguoiBiTreoId`, khi tới, xác nhận đúng người đó.
 */
export function timKhoanhKhac(
  truoc: GocNhinNguoiChoi,
  sau: GocNhinNguoiChoi,
  daCoNguoiBiTreo: boolean,
): KhoanhKhac[] {
  const kq: KhoanhKhac[] = [];
  if (thoiCua(truoc.trangThai) !== thoiCua(sau.trangThai) && sau.trangThai !== 'KET_THUC') {
    kq.push({ loai: 'DOI_THOI', thoi: thoiCua(sau.trangThai) });
  }
  if (sau.buocDem && sau.buocDem !== truoc.buocDem) kq.push({ loai: 'GOI_VAI', vai: sau.buocDem });
  if (sau.trangThai === 'PHA_CONG_BO' && truoc.trangThai !== 'PHA_CONG_BO') {
    kq.push({ loai: 'CONG_BO', nguoiChet: sau.congBoSang });
  }

  const vuaChet = sau.nguoiChoi
    .filter((n) => !n.conSong && truoc.nguoiChoi.find((m) => m.id === n.id)?.conSong)
    .map((n) => n.id);
  if (sau.trangThai === 'GIAI_QUYET_PHIEU') {
    vuaChet.forEach((id, i) =>
      kq.push(i === 0 && !daCoNguoiBiTreo ? { loai: 'TREO_CO', id } : { loai: 'BI_BAN', id }),
    );
  }

  const ngayMoi =
    sau.ketQuaNgay && JSON.stringify(sau.ketQuaNgay) !== JSON.stringify(truoc.ketQuaNgay);
  if (ngayMoi && sau.ketQuaNgay!.nguoiBiTreoId === null) {
    kq.push({ loai: 'KHONG_AI_BI_TREO', coBauLai: sau.ketQuaNgay!.coBauLai });
  }
  if (sau.trangThai === 'KET_THUC' && truoc.trangThai !== 'KET_THUC') kq.push({ loai: 'KET_THUC' });
  return kq;
}

/** Khoảnh khắc của mọi khung cho một người xem — tính một lần, dùng để định nhịp phát lại. */
export function khoanhKhacCaVan(cacGocNhin: GocNhinNguoiChoi[]): KhoanhKhac[][] {
  let daTreo = false;
  return cacGocNhin.map((sau, i) => {
    const truoc = cacGocNhin[i - 1];
    if (!truoc) return [];
    if (sau.luot !== truoc.luot || sau.trangThai !== 'GIAI_QUYET_PHIEU') daTreo = false;
    const kk = timKhoanhKhac(truoc, sau, daTreo);
    if (kk.some((k) => k.loai === 'TREO_CO')) daTreo = true;
    return kk;
  });
}

/** Mỗi khoảnh khắc cần bao lâu trên màn hình, mili giây ở tốc độ 1×. */
export const THOI_LUONG: Record<KhoanhKhac['loai'], number> = {
  DOI_THOI: 3200,
  GOI_VAI: 2600,
  CONG_BO: 4800,
  TREO_CO: 6200,
  BI_BAN: 3400,
  KHONG_AI_BI_TREO: 3200,
  KET_THUC: 0,
};
