import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import { motion } from 'motion/react';
import { HuyHieuVai } from './HuyHieuVai';
import { canLamGi, dongHo, LOI_GOI_VAI, TEN_PHE, tenPha } from './hienThi';

interface Props {
  g: GocNhinNguoiChoi;
  /** Mili giây còn lại của pha ngày hoặc việc đang làm; `null` khi không có hạn công khai. */
  conLai: number | null;
}

/** Thanh "bạn là ai — pha nào — cần làm gì" (3.1): ba tấm gỗ chồng lớp ở mép trên màn hình. */
export function ThanhTrangThai({ g, conLai }: Props) {
  const conSong = g.nguoiChoi.filter((n) => n.conSong).length;
  const kyNang = g.toi.trangThaiKyNang;
  return (
    <header className="thanh-tren">
      <div className="tam tam-nho thanh-lang">
        <p className="ten-lang">Làng Trăng Mờ</p>
        <p className="phu">
          {g.luot > 0 ? `Lượt ${g.luot} · ` : ''}
          {conSong}/{g.nguoiChoi.length} người còn sống
        </p>
      </div>

      <div className="thanh-pha" aria-live="polite">
        {/* Mỗi lần đổi pha tiêu đề mọc lên lại; không chờ bản cũ thoát — tua nhanh không kẹt. */}
        <motion.h1
          key={tenPha(g)}
          className="ten-pha"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {tenPha(g)}
        </motion.h1>
        <p className="can-lam-gi">
          {canLamGi(g)}
          {conLai !== null && conLai > 0 && (
            <span className="dong-ho-pha"> · còn {dongHo(conLai)}</span>
          )}
        </p>
        {g.buocDem && (
          <p className="buoc-dem">
            <HuyHieuVai vai={g.buocDem} co={22} />
            {LOI_GOI_VAI[g.buocDem]}
          </p>
        )}
        {g.tienDoBoPhieu && (
          <p className="buoc-dem">
            {g.tienDoBoPhieu.daBau}/{g.tienDoBoPhieu.tong} phiếu đã bỏ
          </p>
        )}
      </div>

      <div className={`tam tam-nho thanh-toi ${g.toi.conSong ? '' : 'thanh-toi-chet'}`}>
        <HuyHieuVai vai={g.toi.loaiVai} co={48} />
        <div>
          <p className="phu">Bạn là</p>
          <p className="ten-vai-nho">{g.toi.tenVai}</p>
          <p className={`phe phe-${g.toi.phe}`}>{TEN_PHE[g.toi.phe]}</p>
          {g.toi.loaiVai === 'PhuThuy' && (
            <p className="phu">
              Lọ cứu {kyNang.conThuocCuu ? 'còn' : 'đã dùng'} · lọ độc{' '}
              {kyNang.conThuocDoc ? 'còn' : 'đã dùng'}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
