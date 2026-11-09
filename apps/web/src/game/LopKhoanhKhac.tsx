import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { HuyHieuVai } from './HuyHieuVai';
import { LOI_GOI_VAI, TEN_VAI, thuTu } from './hienThi';
import type { KhoanhKhac } from './khoanhKhac';

interface Props {
  kk: KhoanhKhac;
  /** Thời gian chiếu, mili giây — hết thì gọi `onXong`. */
  thoiLuong: number;
  onXong: () => void;
  ten: (id: string) => string;
  vaiToi: LoaiVaiCongKhai;
  luot: number;
}

const EM = [0.22, 1, 0.36, 1] as const;

/** Huy hiệu người chơi khi chưa lộ vai: đĩa tròn mang chữ cái đầu tên. */
function DiaNguoi({ ten, co = 120 }: { ten: string; co?: number }) {
  return (
    <span className="dia-nguoi" style={{ width: co, height: co, fontSize: co * 0.48 }}>
      {ten.charAt(0)}
    </span>
  );
}

function GoiVai({ vai, laToi }: { vai: LoaiVaiCongKhai; laToi: boolean }) {
  const giam = useReducedMotion();
  return (
    <div className="kk-giua">
      <motion.div
        className="vong-goi"
        initial={giam ? false : { scale: 0.4, opacity: 0, rotate: -40 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 1.4, opacity: 0 }}
        transition={{ duration: 0.9, ease: EM }}
        style={{ ['--mau-vai' as string]: `var(--vai-${vai})` }}
      >
        <HuyHieuVai vai={vai} co={168} />
      </motion.div>
      <motion.p
        className="kk-chu-lon"
        initial={giam ? false : { opacity: 0, y: 24, letterSpacing: '0.2em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '-0.01em' }}
        transition={{ duration: 0.9, delay: 0.2, ease: EM }}
      >
        {LOI_GOI_VAI[vai]}
      </motion.p>
      <motion.p
        className="kk-chu-phu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {laToi
          ? 'Đến lượt bạn — mở mắt ra.'
          : `Những ai không phải ${TEN_VAI[vai]}, hãy tiếp tục ngủ.`}
      </motion.p>
    </div>
  );
}

function CongBo({ nguoiChet, ten }: { nguoiChet: string[]; ten: (id: string) => string }) {
  const giam = useReducedMotion();
  return (
    <div className="kk-giua">
      <motion.p
        className="kk-chu-lon"
        initial={giam ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EM }}
      >
        {nguoiChet.length ? 'Đêm qua có người ra đi' : 'Đêm qua bình yên'}
      </motion.p>
      {nguoiChet.length > 0 ? (
        <div className="hang-nguoi-chet">
          {nguoiChet.map((id, i) => (
            <motion.div
              key={id}
              className="nguoi-chet"
              initial={giam ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.25, duration: 0.7, ease: EM }}
            >
              <motion.div
                initial={{ filter: 'grayscale(0) brightness(1)' }}
                animate={{ filter: 'grayscale(1) brightness(0.7)' }}
                transition={{ delay: 1.6 + i * 0.25, duration: 1.4 }}
              >
                <DiaNguoi ten={ten(id)} co={104} />
              </motion.div>
              <p className="ten-nguoi-chet">{ten(id)}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="kk-chu-phu">Không ai chết. Cả làng thức dậy đông đủ.</p>
      )}
      {nguoiChet.length > 0 && <p className="kk-chu-phu">Quản trò không nói họ chết vì đâu.</p>}
    </div>
  );
}

/** Giá treo cổ dựng lên, sợi dây thả xuống, người bị treo đung đưa rồi lịm dần. */
function TreoCo({ ten }: { ten: string }) {
  const giam = useReducedMotion();
  const d = giam ? 0 : 1;
  return (
    <div className="kk-giua kk-treo">
      <svg viewBox="0 0 420 440" className="gia-treo" aria-hidden="true">
        <motion.g
          initial={giam ? false : { y: 260, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9 * d, ease: EM }}
        >
          <rect x="40" y="404" width="300" height="20" className="go-treo" />
          <rect x="96" y="40" width="20" height="368" className="go-treo" />
          <rect x="96" y="40" width="228" height="18" className="go-treo" />
          <path d="M116 120 L176 58 L190 58 L116 134 Z" className="go-treo" />
        </motion.g>
        <motion.path
          d="M300 58 V170"
          className="day-treo"
          initial={giam ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8 * d, duration: 0.6 * d, ease: 'easeIn' }}
        />
        <motion.g
          style={{ transformOrigin: '300px 58px' }}
          initial={giam ? false : { y: -200, opacity: 0 }}
          animate={giam ? { y: 0, opacity: 1 } : { y: 0, opacity: 1, rotate: [0, 9, -6, 4, -2, 0] }}
          transition={{
            y: { delay: 1.3, type: 'spring', stiffness: 160, damping: 11 },
            opacity: { delay: 1.3, duration: 0.2 },
            rotate: { delay: 1.7, duration: 3, ease: 'easeInOut' },
          }}
        >
          <ellipse cx="300" cy="182" rx="15" ry="9" className="thong-long" />
          <motion.g
            initial={{ filter: 'grayscale(0)' }}
            animate={{ filter: 'grayscale(1) brightness(0.6)' }}
            transition={{ delay: 3.6 * d, duration: 1.4 }}
          >
            <circle cx="300" cy="248" r="56" className="dia-treo" />
            <text x="300" y="268" textAnchor="middle" className="chu-treo">
              {ten.charAt(0)}
            </text>
          </motion.g>
        </motion.g>
      </svg>
      <motion.p
        className="kk-chu-lon"
        initial={giam ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2 * d, duration: 0.8, ease: EM }}
      >
        Làng đã treo cổ {ten}
      </motion.p>
      <motion.p
        className="kk-chu-phu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 * d }}
      >
        Vai của {ten} vẫn là bí mật cho tới hết ván.
      </motion.p>
    </div>
  );
}

/** Mũi tên Thợ săn bay ngang màn hình, cắm vào người trúng — không lộ ai bắn (Q09). */
function BiBan({ ten }: { ten: string }) {
  const giam = useReducedMotion();
  return (
    <div className="kk-giua">
      <div className="san-ban">
        <motion.svg
          viewBox="0 0 220 24"
          className="mui-ten"
          aria-hidden="true"
          initial={giam ? false : { x: '-60vw', opacity: 1 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.55, ease: [0.5, 0, 0.9, 0.6] }}
        >
          <path d="M0 12 H200 M200 12 L186 4 M200 12 L186 20 M0 12 L10 4 M0 12 L10 20 M14 12 L24 4 M14 12 L24 20" />
        </motion.svg>
        <motion.div
          initial={giam ? false : { x: 0 }}
          animate={
            giam
              ? {}
              : {
                  x: [0, 14, -6, 3, 0],
                  filter: ['grayscale(0)', 'grayscale(0)', 'grayscale(1) brightness(0.65)'],
                }
          }
          transition={{ delay: 0.5, duration: 1.4 }}
        >
          <DiaNguoi ten={ten} co={132} />
        </motion.div>
      </div>
      <motion.p
        className="kk-chu-lon"
        initial={giam ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease: EM }}
      >
        {ten} trúng mũi tên cuối cùng
      </motion.p>
    </div>
  );
}

function DoiThoi({ laDem, luot }: { laDem: boolean; luot: number }) {
  const giam = useReducedMotion();
  return (
    <div className="kk-giua">
      <motion.p
        className="kk-chu-lon"
        initial={giam ? false : { opacity: 0, letterSpacing: '0.35em', filter: 'blur(8px)' }}
        animate={{ opacity: 1, letterSpacing: '-0.01em', filter: 'blur(0px)' }}
        transition={{ duration: 1.4, delay: 0.6, ease: EM }}
      >
        {laDem ? 'Màn đêm buông xuống' : 'Gà gáy, trời rạng'}
      </motion.p>
      <motion.p
        className="kk-chu-phu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        {laDem ? `Đêm thứ ${thuTu(luot)} — cả làng nhắm mắt.` : 'Cả làng mở mắt.'}
      </motion.p>
    </div>
  );
}

export function LopKhoanhKhac({ kk, thoiLuong, onXong, ten, vaiToi, luot }: Props) {
  useEffect(() => {
    const h = setTimeout(onXong, thoiLuong);
    return () => clearTimeout(h);
  }, [kk, thoiLuong, onXong]);

  let noiDung: React.ReactNode;
  let lop = 'kk-dem';
  switch (kk.loai) {
    case 'DOI_THOI':
      noiDung = <DoiThoi laDem={kk.thoi === 'dem'} luot={luot} />;
      lop = kk.thoi === 'dem' ? 'kk-dem kk-trong' : 'kk-sang kk-trong';
      break;
    case 'GOI_VAI':
      noiDung = <GoiVai vai={kk.vai} laToi={kk.vai === vaiToi} />;
      break;
    case 'CONG_BO':
      noiDung = <CongBo nguoiChet={kk.nguoiChet} ten={ten} />;
      lop = 'kk-sang';
      break;
    case 'TREO_CO':
      noiDung = <TreoCo ten={ten(kk.id)} />;
      lop = 'kk-hoang-hon';
      break;
    case 'BI_BAN':
      noiDung = <BiBan ten={ten(kk.id)} />;
      lop = 'kk-hoang-hon';
      break;
    case 'KHONG_AI_BI_TREO':
      noiDung = (
        <div className="kk-giua">
          <p className="kk-chu-lon">Không ai bị treo cổ</p>
          <p className="kk-chu-phu">
            {kk.coBauLai
              ? 'Bầu lại vẫn hòa — sợi dây được cuộn lại.'
              : 'Phiếu hòa hoặc bỏ trắng — sợi dây được cuộn lại.'}
          </p>
        </div>
      );
      lop = 'kk-hoang-hon';
      break;
    default:
      return null;
  }

  return (
    <motion.div
      className={`lop-kk ${lop}`}
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {noiDung}
    </motion.div>
  );
}
