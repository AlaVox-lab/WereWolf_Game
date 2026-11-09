import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import { TextEffect } from '@/components/ui/text-effect';
import { AnhVai } from './anhVai';
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
        {/* Mỗi lần đổi pha tiêu đề hiện lại từng chữ (Motion Primitives — TextEffect). */}
        <TextEffect key={tenPha(g)} as="h1" per="char" preset="fade-in-blur" className="ten-pha">
          {tenPha(g)}
        </TextEffect>
        <p className="can-lam-gi">
          {canLamGi(g)}
          {conLai !== null && conLai > 0 && (
            <span className="dong-ho-pha"> · còn {dongHo(conLai)}</span>
          )}
        </p>
        {g.buocDem && (
          <p className="buoc-dem">
            <AnhVai vai={g.buocDem} rong={18} />
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
        <AnhVai vai={g.toi.loaiVai} rong={44} />
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
