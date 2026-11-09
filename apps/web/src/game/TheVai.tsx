import type { ThongTinCuaToi } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { HuyHieuVai } from './HuyHieuVai';
import { TEN_PHE } from './hienThi';

/** MH04 — thẻ vai úp xuống rồi lật lên. Chỉ người xem thấy thẻ của mình. */
export function TheVai({
  toi,
  ten,
  onVao,
}: {
  toi: ThongTinCuaToi;
  ten: (id: string) => string;
  onVao: () => void;
}) {
  const giam = useReducedMotion();
  return (
    <motion.div
      className="lop-kk kk-dem lop-the-vai"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="the-vai-san">
        <motion.div
          className="the-vai"
          initial={giam ? { rotateY: 180 } : { rotateY: 0, y: 60, opacity: 0 }}
          animate={{ rotateY: 180, y: 0, opacity: 1 }}
          transition={{
            y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.4 },
            rotateY: { delay: giam ? 0 : 1.1, duration: giam ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] },
          }}
          style={{ ['--mau-vai' as string]: `var(--vai-${toi.loaiVai})` }}
        >
          <div className="mat-the mat-sau" aria-hidden="true">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="44" className="the-vong" />
              <path d="M70 26 A36 36 0 1 0 70 94 A29 29 0 1 1 70 26 Z" className="the-trang" />
            </svg>
          </div>
          <div className="mat-the mat-truoc">
            <p className="phu">Bạn là</p>
            <HuyHieuVai vai={toi.loaiVai} co={132} />
            <h2 className="ten-vai-lon">{toi.tenVai}</h2>
            <p className={`phe phe-${toi.phe}`}>{TEN_PHE[toi.phe]}</p>
            <p className="mo-ta-vai">{toi.moTaNangLuc}</p>
            {toi.dongDoi && toi.dongDoi.length > 0 && (
              <p className="dong-doi">Đồng đội trong bầy: {toi.dongDoi.map(ten).join(', ')}</p>
            )}
          </div>
        </motion.div>
      </div>
      <motion.button
        type="button"
        className="nut nut-chinh nut-vao"
        onClick={onVao}
        initial={giam ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: giam ? 0 : 2.3 }}
        autoFocus
      >
        Vào làng
      </motion.button>
    </motion.div>
  );
}
