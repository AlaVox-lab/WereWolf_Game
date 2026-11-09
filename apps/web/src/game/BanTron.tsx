import type { GocNhinNguoiChoi, LoaiVaiCongKhai, PheCongKhai } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { HuyHieuVai } from './HuyHieuVai';

export interface ThongTinGhe {
  id: string;
  ten: string;
  conSong: boolean;
  laToi: boolean;
  /** Đồng đội Sói — chỉ người xem là Sói mới thấy. */
  laDongDoi: boolean;
  /** Kết quả soi — chỉ Tiên tri thấy trên người mình đã soi. */
  pheDaSoi: PheCongKhai | null;
  /** Vai lộ ra khi hết ván. */
  vaiLo: LoaiVaiCongKhai | null;
}

export function dungGhe(
  g: GocNhinNguoiChoi,
  ten: (id: string, ghe: number) => string,
): ThongTinGhe[] {
  const vaiLo = new Map(g.ketThuc?.vai.map((v) => [v.id, v.loaiVai]) ?? []);
  return [...g.nguoiChoi]
    .sort((a, b) => a.thuTuGhe - b.thuTuGhe)
    .map((n) => ({
      id: n.id,
      ten: ten(n.id, n.thuTuGhe),
      conSong: n.conSong,
      laToi: n.id === g.toi.id,
      laDongDoi: g.toi.dongDoi?.includes(n.id) ?? false,
      pheDaSoi: g.ketQuaSoi.findLast((k) => k.mucTieuId === n.id)?.phe ?? null,
      vaiLo: vaiLo.get(n.id) ?? null,
    }));
}

interface Props {
  ghe: ThongTinGhe[];
  /** Mã người được chọn làm mục tiêu lúc này (sáng lên, bấm được). */
  chonDuoc: ReadonlySet<string>;
  daChon: string | null;
  onChon: (id: string) => void;
  /** Ghế đang được diễn trong cảnh treo cổ / trúng tên — tạm ẩn khỏi bàn. */
  dangDien: string | null;
  laDem: boolean;
}

/** Bàn tròn nhìn nghiêng: người xem luôn ngồi ở mép gần, ghế xa nhỏ dần theo phối cảnh. */
export function BanTron({ ghe, chonDuoc, daChon, onChon, dangDien, laDem }: Props) {
  const giam = useReducedMotion();
  const n = ghe.length;
  const viTriToi = Math.max(
    0,
    ghe.findIndex((g) => g.laToi),
  );

  return (
    <div className="ban-tron">
      <svg className="mat-ban-svg" viewBox="0 0 1000 520" aria-hidden="true">
        <defs>
          <radialGradient id="anh-nen" cx="50%" cy="46%" r="50%">
            <stop offset="0%" stopColor="#ffcf86" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#f0a24a" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#f0a24a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="500" cy="282" rx="372" ry="176" className="vanh-ban" />
        <ellipse cx="500" cy="258" rx="372" ry="176" className="mat-ban" />
        {[0.82, 0.64, 0.46].map((k) => (
          <ellipse key={k} cx="500" cy="258" rx={372 * k} ry={176 * k} className="van-go" />
        ))}
        {/* Trăng khuyết khảm giữa bàn — tên làng. */}
        <path
          d="M512 214 A46 46 0 1 0 512 302 A37 37 0 1 1 512 214 Z"
          transform="translate(500 258) scale(1 0.5) translate(-500 -258)"
          className="kham-trang"
        />
        <ellipse cx="500" cy="230" rx="300" ry="170" fill="url(#anh-nen)" className="anh-nen" />
        <g className="nen-chay" transform="translate(500 232)">
          <rect x="-9" y="-6" width="18" height="34" rx="3" className="than-nen" />
          <path d="M0 -30 C7 -20 6 -12 0 -6 C-6 -12 -7 -20 0 -30 Z" className="lua-nen" />
        </g>
      </svg>

      {ghe.map((g, i) => {
        const goc = Math.PI / 2 + ((i - viTriToi) * 2 * Math.PI) / n;
        const x = 50 + 47 * Math.cos(goc);
        const y = 48 + 46 * Math.sin(goc);
        const sau = (Math.sin(goc) + 1) / 2; // 0 = xa nhất, 1 = gần nhất
        const coTheChon = chonDuoc.has(g.id);
        const lop = [
          'ghe',
          g.laToi && 'ghe-toi',
          !g.conSong && 'ghe-chet',
          g.laDongDoi && 'ghe-dong-doi',
          coTheChon && 'ghe-chon-duoc',
          daChon === g.id && 'ghe-da-chon',
          dangDien === g.id && 'ghe-dang-dien',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={g.id}
            className="ghe-cho"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              zIndex: Math.round(y),
              ['--ty-le' as string]: 0.8 + sau * 0.3,
            }}
          >
            <motion.button
              type="button"
              className={lop}
              disabled={!coTheChon}
              onClick={() => onChon(g.id)}
              initial={giam ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: giam ? 0 : 0.25 + i * 0.07,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-label={`${g.ten}${g.laToi ? ' (bạn)' : ''}${g.conSong ? '' : ', đã chết'}`}
            >
              <span className="ghe-dia">
                {g.vaiLo ? (
                  <HuyHieuVai vai={g.vaiLo} co={56} />
                ) : (
                  <span className="ghe-chu">{g.ten.charAt(0)}</span>
                )}
                {!g.conSong && <span className="ghe-dau-chet" aria-hidden="true" />}
              </span>
              <span className="ghe-ten">
                {g.ten}
                {g.laToi && <span className="ghe-nhan"> · bạn</span>}
              </span>
              {g.pheDaSoi && (
                <span className={`ghe-soi ghe-soi-${g.pheDaSoi}`}>
                  {g.pheDaSoi === 'SOI' ? 'Sói' : 'Dân'}
                </span>
              )}
              {g.laDongDoi && !g.vaiLo && <span className="ghe-soi ghe-soi-SOI">Đồng đội</span>}
              {laDem && g.laToi && <span className="ghe-quang" aria-hidden="true" />}
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
