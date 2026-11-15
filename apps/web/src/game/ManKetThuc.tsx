import type { KetThucCongKhai } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextEffect } from '@/components/ui/text-effect';
import { AnhVai } from './anhVai';
import { TEN_VAI } from './hienThi';
import { NhatKyVan } from './NhatKyVan';

export function ManKetThuc({
  ketThuc,
  ten,
  conSong,
  onVePhongCho,
}: {
  ketThuc: KetThucCongKhai;
  ten: (id: string) => string;
  conSong: ReadonlySet<string>;
  /** Chỉ phòng chơi thật có — bản xem trước không có phòng để về. */
  onVePhongCho?: () => void;
}) {
  const giam = useReducedMotion();
  const [moNhatKy, setMoNhatKy] = useState(false);
  const thang = ketThuc.pheThang;

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

      <div className="ket-thuc-nut">
        {onVePhongCho && (
          <Button size="lg" onClick={onVePhongCho}>
            Về phòng chờ
          </Button>
        )}
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setMoNhatKy((m) => !m)}
          aria-expanded={moNhatKy}
        >
          {moNhatKy ? 'Đóng diễn biến' : 'Xem diễn biến cả ván'}
        </Button>
      </div>
      {moNhatKy && <NhatKyVan nhatKy={ketThuc.nhatKy} ten={ten} className="tam" />}
    </motion.section>
  );
}
