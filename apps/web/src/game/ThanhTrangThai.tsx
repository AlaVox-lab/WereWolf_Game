import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TextEffect } from '@/components/ui/text-effect';
import { AnhVai } from './anhVai';
import { canLamGi, dongHo, LOI_GOI_VAI, TEN_PHE, tenPha } from './hienThi';

/** Sổ tay cho người mới (N05): năng lực của vai mình và bộ luật đang dùng trong ván này. */
function SoTay({ g }: { g: GocNhinNguoiChoi }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="nut-so-tay">
          <BookOpen aria-hidden />
          Sổ tay
        </Button>
      </DialogTrigger>
      <DialogContent className="so-tay" data-thoi="dem">
        <DialogHeader>
          <DialogTitle className="so-tay-tieu-de">Bạn là {g.toi.tenVai}</DialogTitle>
          <DialogDescription>{g.toi.moTaNangLuc}</DialogDescription>
        </DialogHeader>
        <h3 className="so-tay-muc">Luật của ván này</h3>
        <ul className="so-tay-luat">
          {g.boLuat.map((q) => (
            <li key={q.ma} className={q.dangBat ? '' : 'so-tay-tat'}>
              <span className="so-tay-dau">{q.dangBat ? 'Bật' : 'Tắt'}</span>
              {q.noiDung}
            </li>
          ))}
        </ul>
        <p className="ghi-chu">
          Ban đêm mỗi vai thức dậy theo thứ tự; ban ngày cả làng thảo luận rồi bỏ phiếu treo cổ. Dân
          thắng khi hết Sói, Sói thắng khi số Sói bằng số người còn lại.
        </p>
      </DialogContent>
    </Dialog>
  );
}

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
        <SoTay g={g} />
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
