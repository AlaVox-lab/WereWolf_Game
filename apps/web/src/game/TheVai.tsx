import type { ThongTinCuaToi } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { TextEffect } from '@/components/ui/text-effect';
import { ANH_TRANG, ANH_VAI, NGUON_VAI } from './anhVai';
import { TEN_PHE } from './hienThi';

/**
 * MH04 — thẻ vai úp (mặt trăng của Mellan) bay vào rồi lật ngửa thành tranh khắc của vai. Chỉ
 * người xem thấy thẻ của mình.
 */
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
      className="lop-the-vai"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="the-vai-san">
        <motion.div
          className="the-vai"
          initial={giam ? { rotateY: 180 } : { rotateY: 0, rotateZ: -8, y: 120, opacity: 0 }}
          animate={{ rotateY: 180, rotateZ: 0, y: 0, opacity: 1 }}
          transition={{
            y: { type: 'spring', stiffness: 120, damping: 16 },
            rotateZ: { type: 'spring', stiffness: 120, damping: 16 },
            opacity: { duration: 0.4 },
            rotateY: { delay: giam ? 0 : 1.1, duration: giam ? 0 : 1.2, ease: [0.65, 0, 0.35, 1] },
          }}
          style={{ ['--mau-vai' as string]: `var(--vai-${toi.loaiVai})` }}
        >
          <div className="mat-the mat-sau" aria-hidden="true">
            <img src={ANH_TRANG} alt="" draggable={false} />
          </div>
          <div className="mat-the mat-truoc">
            <img src={ANH_VAI[toi.loaiVai]} alt={`Tranh thẻ ${toi.tenVai}`} draggable={false} />
            <p className="the-nguon">{NGUON_VAI[toi.loaiVai]}</p>
          </div>
        </motion.div>
      </div>

      <div className="the-vai-chu">
        <p className="phu">Bạn là</p>
        <TextEffect as="h2" per="char" preset="blur" delay={giam ? 0 : 1.9} className="ten-vai-lon">
          {toi.tenVai}
        </TextEffect>
        <p className={`phe phe-${toi.phe}`}>{TEN_PHE[toi.phe]}</p>
        <TextEffect as="p" per="line" preset="fade" delay={giam ? 0 : 2.4} className="mo-ta-vai">
          {toi.moTaNangLuc}
        </TextEffect>
        {toi.dongDoi && toi.dongDoi.length > 0 && (
          <p className="dong-doi">Đồng đội trong bầy: {toi.dongDoi.map(ten).join(', ')}</p>
        )}
        <motion.div
          initial={giam ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: giam ? 0 : 2.8 }}
        >
          <Button size="lg" onClick={onVao} autoFocus>
            Vào làng
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
