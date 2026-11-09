// Chữ hiển thị suy từ góc nhìn — chỉ đặt tên và chọn câu chữ, KHÔNG quyết định điều gì của luật.
// Mọi quyết định (ai được làm gì, ai chết, ai thắng) đã nằm sẵn trong GocNhinNguoiChoi.
import type {
  GocNhinNguoiChoi,
  LoaiVaiCongKhai,
  PheCongKhai,
  TrangThaiVanCongKhai,
} from '@moonvillage/shared';

export type Thoi = 'dem' | 'ngay';

export const TEN_VAI: Record<LoaiVaiCongKhai, string> = {
  Soi: 'Sói',
  BaoVe: 'Bảo vệ',
  TienTri: 'Tiên tri',
  PhuThuy: 'Phù thủy',
  ThoSan: 'Thợ săn',
  DanLang: 'Dân làng',
};

export const TEN_PHE: Record<PheCongKhai, string> = { DAN: 'phe Dân', SOI: 'phe Sói' };

/** Câu báo khi một vai được gọi dậy trong đêm — thứ tự bước vốn công khai (Q05). */
export const LOI_GOI_VAI: Record<LoaiVaiCongKhai, string> = {
  BaoVe: 'Bảo vệ thức giấc',
  Soi: 'Bầy Sói mở mắt',
  TienTri: 'Tiên tri nhìn vào màn sương',
  PhuThuy: 'Phù thủy mở tủ thuốc',
  ThoSan: 'Thợ săn nâng cung',
  DanLang: 'Dân làng thức giấc',
};

const SO_THU_TU = ['nhất', 'hai', 'ba', 'tư', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
export const thuTu = (n: number) => SO_THU_TU[n - 1] ?? String(n);

/** Pha đêm và lúc giải quyết đêm là đêm; còn lại — kể cả kết thúc — là ngày. */
export function thoiCua(trangThai: TrangThaiVanCongKhai): Thoi {
  return trangThai === 'PHA_DEM' || trangThai === 'GIAI_QUYET_DEM' ? 'dem' : 'ngay';
}

export function tenPha(g: GocNhinNguoiChoi): string {
  switch (g.trangThai) {
    case 'PHA_DEM':
    case 'GIAI_QUYET_DEM':
      return `Đêm thứ ${thuTu(g.luot)}`;
    case 'PHA_CONG_BO':
      return 'Trời sáng';
    case 'PHA_THAO_LUAN':
      return 'Thảo luận';
    case 'PHA_BO_PHIEU':
      return 'Bỏ phiếu';
    case 'GIAI_QUYET_PHIEU':
      return 'Phán quyết';
    case 'KET_THUC':
      return 'Hết ván';
    case 'HUY_VAN':
      return 'Ván bị hủy';
    default:
      return 'Chờ bắt đầu';
  }
}

/** Dòng "cần làm gì" dưới tên pha — thanh "bạn là ai, pha nào, cần làm gì" (3.1). */
export function canLamGi(g: GocNhinNguoiChoi): string {
  const viec = g.viecCanLam;
  if (!g.toi.conSong && g.trangThai !== 'KET_THUC') return 'Bạn đã chết — hãy lặng lẽ theo dõi.';
  if (viec?.viec === 'THO_SAN_BAN') return 'Bạn vừa ngã xuống. Chọn người lãnh mũi tên cuối cùng.';
  if (viec?.viec === 'BO_PHIEU') return 'Chọn người làng sẽ treo cổ, hoặc bỏ trắng.';
  if (viec?.viec === 'HANH_DONG_DEM') {
    switch (g.toi.loaiVai) {
      case 'BaoVe':
        return 'Chọn một người để che chắn đêm nay.';
      case 'Soi':
        return 'Cùng bầy chọn con mồi đêm nay.';
      case 'TienTri':
        return 'Chọn một người để soi phe.';
      case 'PhuThuy':
        return 'Cứu nạn nhân, đầu độc ai đó, hoặc giữ thuốc.';
      default:
        return 'Đến lượt bạn.';
    }
  }
  switch (g.trangThai) {
    case 'PHA_DEM':
      if (g.buocDem && g.buocDem === g.toi.loaiVai) {
        return g.toi.loaiVai === 'Soi' ? 'Bầy đang chọn con mồi.' : 'Sắp tới lượt bạn.';
      }
      return 'Nhắm mắt lại — làng đang ngủ.';
    case 'GIAI_QUYET_DEM':
      return 'Màn đêm sắp tan.';
    case 'PHA_CONG_BO':
      return 'Nghe công bố của quản trò.';
    case 'PHA_THAO_LUAN':
      return 'Nói, nghi ngờ, bào chữa — trước khi bỏ phiếu.';
    case 'PHA_BO_PHIEU':
      return 'Bạn đã bỏ phiếu. Chờ cả làng.';
    case 'GIAI_QUYET_PHIEU':
      return 'Làng đã quyết.';
    case 'KET_THUC':
      return g.ketThuc ? `${TEN_PHE[g.ketThuc.pheThang]} giành chiến thắng.` : '';
    default:
      return '';
  }
}

/** Đồng hồ mm:ss từ số mili giây còn lại. */
export function dongHo(conLai: number): string {
  const s = Math.max(0, Math.ceil(conLai / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
