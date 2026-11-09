import type { GocNhinNguoiChoi, NhomLuaChonCongKhai } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { HuyHieuVai } from './HuyHieuVai';
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
  daChon: string | null;
  daGui: boolean;
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
  return n.loai === 'CUU' ? `Cứu ${n.mucTieu.map(ten).join(', ')}` : 'Chọn người trên bàn';
}

/** Vòng đồng hồ đếm ngược — trình duyệt chỉ đếm, máy chủ mới quyết hết giờ. */
function VongDongHo({ conLai, tong }: { conLai: number; tong: number }) {
  const r = 26;
  const chuVi = 2 * Math.PI * r;
  const phan = tong > 0 ? Math.max(0, Math.min(1, conLai / tong)) : 0;
  return (
    <div className={`vong-dong-ho ${conLai < 6000 ? 'vong-gap' : ''}`}>
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="vong-nen" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className="vong-chay"
          strokeDasharray={chuVi}
          strokeDashoffset={chuVi * (1 - phan)}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span>{dongHo(conLai)}</span>
    </div>
  );
}

export function BangViec({
  g,
  ten,
  conLai,
  tong,
  nhom,
  onDoiNhom,
  daChon,
  daGui,
  onGui,
  onBoTrang,
}: Props) {
  const giam = useReducedMotion();
  const viec = g.viecCanLam!;
  const coHaiLo = viec.luaChon.some((n) => n.loai);
  const nanNhan = viec.nanNhan;

  return (
    <motion.section
      className="tam bang-viec"
      aria-label={TIEU_DE[viec.viec]}
      initial={giam ? false : { opacity: 0, y: 40, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={giam ? { opacity: 0 } : { opacity: 0, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
    >
      <div className="bang-viec-dau">
        {viec.viec === 'HANH_DONG_DEM' && <HuyHieuVai vai={g.toi.loaiVai} co={44} />}
        {viec.viec === 'THO_SAN_BAN' && <HuyHieuVai vai="ThoSan" co={44} />}
        <h2 className="bang-viec-tieu-de">{TIEU_DE[viec.viec]}</h2>
        <VongDongHo conLai={conLai} tong={tong} />
      </div>

      {nanNhan && (
        <p className="nan-nhan">
          {nanNhan.nanNhanId
            ? `Đêm nay Sói cắn ${ten(nanNhan.nanNhanId)}${nanNhan.anToan ? ' — người này đã được che chắn.' : '.'}`
            : 'Đêm nay Sói không cắn ai.'}
        </p>
      )}

      {coHaiLo ? (
        <div className="hai-lo">
          {viec.luaChon.map((n) => (
            <button
              key={n.loai}
              type="button"
              className={`lo-thuoc lo-${n.loai} ${nhom === n.loai ? 'lo-dang-mo' : ''}`}
              onClick={() => onDoiNhom(nhom === n.loai ? null : n.loai!)}
              disabled={daGui || n.mucTieu.length === 0}
            >
              <span className="lo-ten">{n.loai === 'CUU' ? 'Lọ cứu' : 'Lọ độc'}</span>
              <span className="phu">{moTaLo(n, g.toi.trangThaiKyNang, ten)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="phu">Chạm vào một người đang sáng trên bàn.</p>
      )}

      <div className="bang-viec-chan">
        <p className="lua-chon-hien" aria-live="polite">
          {daGui
            ? 'Đã ghi lựa chọn. Bản xem trước không gửi đi đâu cả.'
            : daChon
              ? `Bạn chọn: ${ten(daChon)}`
              : 'Chưa chọn ai.'}
        </p>
        {viec.choPhepBoTrang && (
          <button type="button" className="nut nut-phu" onClick={onBoTrang} disabled={daGui}>
            Bỏ trắng
          </button>
        )}
        <button type="button" className="nut nut-chinh" onClick={onGui} disabled={!daChon || daGui}>
          Xác nhận
        </button>
      </div>
      {!viec.choPhepBoTrang && <p className="ghi-chu">Hết giờ mà chưa chọn thì coi như bỏ lượt.</p>}
    </motion.section>
  );
}
