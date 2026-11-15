import type { GocNhinNguoiChoi, NhomLuaChonCongKhai } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import { BorderBeam } from '@/components/ui/border-beam';
import { Button } from '@/components/ui/button';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { AnhVai } from './anhVai';
import { dongHo } from './hienThi';

export type LoaiThuoc = NonNullable<NhomLuaChonCongKhai['loai']>;

interface Props {
  g: GocNhinNguoiChoi;
  ten: (id: string) => string;
  conLai: number;
  tong: number;
  /** Nhóm lựa chọn đang mở — chỉ Phù thủy có hai nhóm (cứu, độc). */
  nhom: LoaiThuoc | null;
  onDoiNhom: (n: LoaiThuoc | null) => void;
  /** Ai đang chọn được — cùng danh sách đang sáng trên bàn 3D. */
  chonDuoc: ReadonlySet<string>;
  daChon: string | null;
  onChon: (id: string) => void;
  daGui: boolean;
  /** Lựa chọn có thật sự gửi lên máy chủ không (không phải bản xem trước). */
  guiThat: boolean;
  loiGui: string | null;
  onGui: () => void;
  onBoTrang: () => void;
}

const TIEU_DE = {
  HANH_DONG_DEM: 'Đến lượt bạn',
  BO_PHIEU: 'Lá phiếu của bạn',
  THO_SAN_BAN: 'Mũi tên cuối cùng',
} as const;

/** Câu dưới mỗi lọ — nhóm rỗng nghĩa là lọ không dùng được lúc này (máy chủ đã quyết). */
function moTaLo(
  n: NhomLuaChonCongKhai,
  kyNang: Record<string, unknown>,
  ten: (id: string) => string,
): string {
  const conLo = n.loai === 'CUU' ? kyNang.conThuocCuu : kyNang.conThuocDoc;
  if (n.mucTieu.length === 0) return conLo === false ? 'Đã dùng' : 'Không dùng được đêm nay';
  return n.loai === 'CUU' ? `Cứu ${n.mucTieu.map(ten).join(', ')}` : 'Chọn người bên dưới';
}

export function BangViec(p: Props) {
  const giam = useReducedMotion();
  const viec = p.g.viecCanLam!;
  const coHaiLo = viec.luaChon.some((n) => n.loai);
  const nanNhan = viec.nanNhan;
  const phanTram = p.tong > 0 ? Math.round((100 * p.conLai) / p.tong) : 0;
  const vai = viec.viec === 'THO_SAN_BAN' ? 'ThoSan' : p.g.toi.loaiVai;

  return (
    <motion.section
      className="tam bang-viec"
      aria-label={TIEU_DE[viec.viec]}
      initial={giam ? false : { opacity: 0, y: 48, rotateX: 14 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={giam ? { opacity: 0 } : { opacity: 0, y: 30 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    >
      {!p.daGui && <BorderBeam size={120} duration={6} colorFrom="#ffcf6e" colorTo="#c4452f" />}
      <div className="bang-viec-dau">
        {viec.viec !== 'BO_PHIEU' && <AnhVai vai={vai} rong={40} />}
        <h2 className="bang-viec-tieu-de">
          {p.daGui ? (
            TIEU_DE[viec.viec]
          ) : (
            <TextShimmer as="span" duration={2.4}>
              {TIEU_DE[viec.viec]}
            </TextShimmer>
          )}
        </h2>
        <div className="vong-dong-ho" aria-label={`Còn ${dongHo(p.conLai)}`}>
          <AnimatedCircularProgressBar
            value={phanTram}
            gaugePrimaryColor={p.conLai < 6000 ? '#c4452f' : '#e6a646'}
            gaugeSecondaryColor="rgba(255,255,255,0.08)"
            className="vong-dong-ho-mui"
          />
          <span>{dongHo(p.conLai)}</span>
        </div>
      </div>

      {nanNhan && (
        <p className="nan-nhan">
          {nanNhan.nanNhanId
            ? `Đêm nay Sói cắn ${p.ten(nanNhan.nanNhanId)}${nanNhan.anToan ? ' — người này đã được che chắn.' : '.'}`
            : 'Đêm nay Sói không cắn ai.'}
        </p>
      )}

      {coHaiLo && (
        <div className="hai-lo">
          {viec.luaChon.map((n) => (
            <button
              key={n.loai}
              type="button"
              className={`lo-thuoc lo-${n.loai} ${p.nhom === n.loai ? 'lo-dang-mo' : ''}`}
              onClick={() => p.onDoiNhom(p.nhom === n.loai ? null : n.loai!)}
              disabled={p.daGui || n.mucTieu.length === 0}
              aria-pressed={p.nhom === n.loai}
            >
              <span className="lo-ten">{n.loai === 'CUU' ? 'Lọ cứu' : 'Lọ độc'}</span>
              <span className="phu">{moTaLo(n, p.g.toi.trangThaiKyNang, p.ten)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Cùng danh sách đang sáng trên bàn — chọn bằng bàn phím hay trình đọc màn hình cũng được. */}
      {p.chonDuoc.size > 0 && (
        <div className="muc-tieu" role="radiogroup" aria-label="Chọn người">
          {[...p.chonDuoc].map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={p.daChon === id}
              className={`muc-tieu-nut ${p.daChon === id ? 'muc-tieu-chon' : ''}`}
              onClick={() => p.onChon(id)}
            >
              {p.ten(id)}
            </button>
          ))}
        </div>
      )}

      <div className="bang-viec-chan">
        <p className="lua-chon-hien" aria-live="polite">
          {p.daGui
            ? p.guiThat
              ? 'Đã gửi. Chờ những người khác.'
              : 'Đã ghi lựa chọn. Bản xem trước không gửi đi đâu cả.'
            : p.daChon
              ? `Bạn chọn: ${p.ten(p.daChon)}`
              : 'Chạm vào một người trên bàn.'}
        </p>
        {viec.choPhepBoTrang && (
          <Button variant="secondary" onClick={p.onBoTrang} disabled={p.daGui}>
            Bỏ trắng
          </Button>
        )}
        <Button onClick={p.onGui} disabled={!p.daChon || p.daGui}>
          Xác nhận
        </Button>
      </div>
      {p.loiGui && (
        <p className="o-loi" role="alert">
          {p.loiGui}
        </p>
      )}
      {!viec.choPhepBoTrang && <p className="ghi-chu">Hết giờ mà chưa chọn thì coi như bỏ lượt.</p>}
    </motion.section>
  );
}
