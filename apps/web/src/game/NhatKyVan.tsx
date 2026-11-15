// Bản ghi diễn tiến thành câu tiếng Việt (MH08, UC04) — chỉ đọc, đúng như máy chủ ghi.
import type { SuKienNhatKyCongKhai } from '@moonvillage/shared';
import { TEN_PHE, dongHo, thuTu } from './hienThi';

const HANH_DONG: Record<string, string> = {
  BAO_VE: 'che chắn',
  CAN: 'cắn',
  SOI_THONG_TIN: 'soi',
  CUU: 'cứu',
  DOC: 'đầu độc',
  BAN: 'bắn',
};
const NGUYEN_NHAN: Record<string, string> = {
  BI_CAN: 'bị Sói cắn',
  BI_DOC: 'trúng độc',
  BI_TREO_CO: 'bị treo cổ',
  BI_BAN: 'trúng tên Thợ săn',
};

/** Một dòng bản ghi diễn tiến thành câu — chỉ đọc, đúng như máy chủ ghi. */
function cau(sk: SuKienNhatKyCongKhai, ten: (id: string) => string): string | null {
  const d = sk.duLieu as Record<string, unknown>;
  const t = (k: string) => ten(String(d[k]));
  switch (sk.loai) {
    case 'CHUYEN_PHA':
      return d.trangThai === 'GIAI_QUYET_DEM' ? `Đêm thứ ${thuTu(Number(d.luot))} khép lại` : null;
    case 'Y_DINH':
      return `${t('nguoiThucHienId')} ${HANH_DONG[String(d.loaiHanhDong)] ?? d.loaiHanhDong} ${t('mucTieuId')}`;
    case 'KET_QUA_SOI':
      return `${t('tienTriId')} thấy ${t('mucTieuId')} thuộc ${TEN_PHE[d.phe as 'DAN' | 'SOI']}`;
    case 'PHIEU_BAU':
      return `${t('nguoiBauId')} bầu ${d.nguoiBiBauId ? t('nguoiBiBauId') : 'trắng'}${d.vongBauLai ? ' (bầu lại)' : ''}`;
    case 'NGUOI_CHET':
      return `${t('nguoiChoiId')} ${NGUYEN_NHAN[String(d.nguyenNhan)] ?? d.nguyenNhan}`;
    default:
      return null;
  }
}

/**
 * Danh sách diễn tiến của một ván, giờ tính từ sự kiện đầu tiên (máy chủ ghi mốc tuyệt đối).
 * Dùng ở màn kết thúc và ở trang mở lại ván cũ.
 */
export function NhatKyVan({
  nhatKy,
  ten,
  className = '',
}: {
  nhatKy: SuKienNhatKyCongKhai[];
  ten: (id: string) => string;
  className?: string;
}) {
  const goc = nhatKy[0]?.thoiDiem ?? 0;
  const dong = nhatKy
    .map((sk) => ({ sk, cau: cau(sk, ten) }))
    .filter((x): x is { sk: SuKienNhatKyCongKhai; cau: string } => x.cau !== null);
  return (
    <ol className={`nhat-ky ${className}`}>
      {dong.map(({ sk, cau: c }) => (
        <li key={sk.thuTu}>
          <span className="nhat-ky-gio">{dongHo(sk.thoiDiem - goc)}</span>
          {c}
        </li>
      ))}
    </ol>
  );
}
