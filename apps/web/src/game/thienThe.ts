// Vị trí mặt trăng / mặt trời trên vòng cung trời — chỉ để vẽ, suy từ góc nhìn và đồng hồ máy chủ.
import type { GocNhinNguoiChoi } from '@moonvillage/shared';

/** Độ dài danh nghĩa của một đêm cho mặt trăng đi hết vòng cung — chỉ để vẽ. */
const DEM_DANH_NGHIA = 150_000;

/**
 * Mặt trăng hoặc mặt trời trên vòng cung trời là đồng hồ của pha. Ban ngày chia vòng cung theo
 * ba chặng có hạn công khai (công bố, thảo luận, bỏ phiếu); ban đêm không có hạn công khai (Q05)
 * nên mặt trăng trôi theo thời gian đã qua của đêm.
 */
export function tienDoThienThe(
  g: GocNhinNguoiChoi,
  bayGio: number,
  batDauPha: number,
  batDauDem: number,
): number {
  const phan =
    g.hetHanPha !== null && g.hetHanPha > batDauPha
      ? Math.min(1, Math.max(0, (bayGio - batDauPha) / (g.hetHanPha - batDauPha)))
      : 1;
  switch (g.trangThai) {
    case 'PHA_DEM':
    case 'GIAI_QUYET_DEM':
      return 0.06 + 0.88 * Math.min(1, (bayGio - batDauDem) / DEM_DANH_NGHIA);
    case 'PHA_CONG_BO':
      return 0.06 + 0.08 * phan;
    case 'PHA_THAO_LUAN':
      return 0.14 + 0.56 * phan;
    case 'PHA_BO_PHIEU':
      return 0.7 + 0.2 * phan;
    case 'GIAI_QUYET_PHIEU':
      return 0.92;
    default:
      return 0.5;
  }
}
