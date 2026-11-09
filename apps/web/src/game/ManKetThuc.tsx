import type { KetThucCongKhai, SuKienNhatKyCongKhai } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { TextEffect } from '@/components/ui/text-effect';
import { AnhVai } from './anhVai';
import { TEN_PHE, TEN_VAI, dongHo, thuTu } from './hienThi';

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

export function ManKetThuc({
  ketThuc,
  ten,
  conSong,
}: {
  ketThuc: KetThucCongKhai;
  ten: (id: string) => string;
  conSong: ReadonlySet<string>;
}) {
  const giam = useReducedMotion();
  const [moNhatKy, setMoNhatKy] = useState(false);
  const thang = ketThuc.pheThang;
  const dong = ketThuc.nhatKy
    .map((sk) => ({ sk, cau: cau(sk, ten) }))
    .filter((x): x is { sk: SuKienNhatKyCongKhai; cau: string } => x.cau !== null);

  return (
    <motion.section
      className={`man-ket-thuc ket-thuc-${thang}`}
      aria-label="Hết ván"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <TextEffect as="h2" per="char" preset="scale" className="kk-chu-dai">
        {thang === 'SOI' ? 'Bầy Sói thắng' : 'Dân làng thắng'}
      </TextEffect>
      <p className="kk-chu-phu">
        {thang === 'SOI'
          ? 'Số Sói đã bằng số người còn lại — làng thuộc về bầy.'
          : 'Con Sói cuối cùng đã ngã — làng lại bình yên.'}
      </p>

      <ul className="lat-vai">
        {ketThuc.vai.map((v, i) => (
          <motion.li
            key={v.id}
            className={`lat-vai-o ${conSong.has(v.id) ? '' : 'lat-vai-chet'} ${v.phe === thang ? 'lat-vai-thang' : ''}`}
            initial={giam ? false : { opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.6 + i * 0.12, duration: 0.6 }}
          >
            <AnhVai vai={v.loaiVai} rong={84} />
            <span className="lat-vai-ten">{ten(v.id)}</span>
            <span className="phu">
              {TEN_VAI[v.loaiVai]}
              {conSong.has(v.id) ? '' : ' · đã chết'}
            </span>
          </motion.li>
        ))}
      </ul>

      <button
        type="button"
        className="nut nut-phu"
        onClick={() => setMoNhatKy((m) => !m)}
        aria-expanded={moNhatKy}
      >
        {moNhatKy ? 'Đóng diễn biến' : 'Xem diễn biến cả ván'}
      </button>
      {moNhatKy && (
        <ol className="nhat-ky tam">
          {dong.map(({ sk, cau: c }) => (
            <li key={sk.thuTu}>
              <span className="nhat-ky-gio">{dongHo(sk.thoiDiem)}</span>
              {c}
            </li>
          ))}
        </ol>
      )}
    </motion.section>
  );
}
