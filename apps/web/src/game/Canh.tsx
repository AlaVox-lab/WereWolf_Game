import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, type ReactNode } from 'react';
import type { Thoi } from './hienThi';

/*
 * Sân khấu nhiều lớp — mỗi lớp trôi theo con trỏ một khoảng tỉ lệ với độ gần (biến `--sau`), nên
 * cảnh có chiều sâu. Thứ tự từ xa tới gần: trời → sao/mây → mặt trăng, mặt trời → núi xa → đồi
 * → rừng và làng → sương → bàn tròn → cây tiền cảnh → màn đêm.
 */

/** Bộ sinh số giả ngẫu nhiên có hạt — cảnh vẽ giống nhau mỗi lần mở. */
function taoNgauNhien(hat: number) {
  let a = hat;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RONG = 1440;
const CAO = 900;
const CHAN_TROI = 560;

function Lop({
  sau,
  children,
  className = '',
}: {
  sau: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`lop ${className}`} style={{ ['--sau' as string]: sau }}>
      {children}
    </div>
  );
}

function Svg({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${RONG} ${CAO}`}
      preserveAspectRatio="xMidYMax slice"
      className={`lop-svg ${className}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Vị trí trên vòng cung trời theo tiến độ 0..1; ngoài khoảng đó là đã lặn dưới chân trời. */
function viTriCung(p: number) {
  return { x: 140 + p * (RONG - 280), y: CHAN_TROI + 40 - Math.sin(Math.PI * p) * 400 };
}

function MatTrang() {
  return (
    <g>
      <defs>
        <radialGradient id="quang-trang">
          <stop offset="30%" stopColor="#efe9d6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#efe9d6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="190" fill="url(#quang-trang)" />
      <circle r="48" className="mat-trang" />
      <circle cx="-14" cy="-10" r="9" className="hoa-trang" />
      <circle cx="12" cy="14" r="6.5" className="hoa-trang" />
      <circle cx="18" cy="-16" r="4" className="hoa-trang" />
      <circle cx="-6" cy="22" r="3.5" className="hoa-trang" />
    </g>
  );
}

function MatTroi() {
  return (
    <g>
      <defs>
        <radialGradient id="quang-troi">
          <stop offset="35%" stopColor="#ffd98e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffd98e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="210" fill="url(#quang-troi)" />
      <g className="tia-nang">
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x="-3"
            y="-96"
            width="6"
            height="26"
            rx="3"
            transform={`rotate(${i * 30})`}
          />
        ))}
      </g>
      <circle r="56" className="mat-troi" />
    </g>
  );
}

function ThienThe({ thoi, tienDo }: { thoi: Thoi; tienDo: number }) {
  const giam = useReducedMotion();
  const den = viTriCung(tienDo);
  const moc = viTriCung(-0.14);
  const lan = viTriCung(1.14);
  return (
    <AnimatePresence initial={false}>
      <motion.g
        key={thoi}
        initial={{ x: moc.x, y: moc.y }}
        animate={{ x: den.x, y: den.y }}
        exit={{ x: lan.x, y: lan.y }}
        transition={{ duration: giam ? 0 : 2.4, ease: [0.45, 0, 0.25, 1] }}
      >
        {thoi === 'dem' ? <MatTrang /> : <MatTroi />}
      </motion.g>
    </AnimatePresence>
  );
}

/** Rặng thông: các tam giác chồng nhau, cao thấp theo hạt giống. */
function rangThong(hat: number, y0: number, caoMin: number, caoMax: number, buoc: number) {
  const r = taoNgauNhien(hat);
  let d = `M0 ${CAO} L0 ${y0}`;
  for (let x = 0; x <= RONG + buoc; x += buoc * (0.7 + r() * 0.6)) {
    const cao = caoMin + r() * (caoMax - caoMin);
    const rongNua = cao * 0.28;
    d += ` L${x - rongNua} ${y0} L${x} ${y0 - cao} L${x + rongNua} ${y0}`;
  }
  return `${d} L${RONG} ${y0} L${RONG} ${CAO} Z`;
}

interface Nha {
  x: number;
  y: number;
  rong: number;
  cao: number;
  cuaSo: number;
}

function cacNha(): Nha[] {
  const r = taoNgauNhien(13);
  const kq: Nha[] = [];
  for (const [tu, den] of [
    [250, 610],
    [880, 1200],
  ] as const) {
    for (let x = tu; x < den; x += 46 + r() * 34) {
      kq.push({
        x,
        y: 655 + r() * 18,
        rong: 34 + r() * 26,
        cao: 22 + r() * 16,
        cuaSo: r() > 0.35 ? 1 + Math.floor(r() * 2) : 0,
      });
    }
  }
  return kq;
}

export function Canh({
  thoi,
  tienDoThienThe,
  dangDenLuot,
  children,
}: {
  thoi: Thoi;
  /** 0..1 — mặt trăng hoặc mặt trời trên vòng cung trời, cũng là đồng hồ của pha. */
  tienDoThienThe: number;
  /** Đến lượt người xem ban đêm — màn đêm vén bớt quanh bàn. */
  dangDenLuot: boolean;
  children: ReactNode;
}) {
  const sao = useMemo(() => {
    const r = taoNgauNhien(7);
    return Array.from({ length: 90 }, () => ({
      x: r() * RONG,
      y: r() * (CHAN_TROI - 60),
      r: 0.6 + r() * 1.5,
      tre: r() * 6,
    }));
  }, []);
  const nha = useMemo(cacNha, []);
  const thong = useMemo(
    () => ({ xa: rangThong(3, 640, 30, 70, 26), gan: rangThong(5, 700, 60, 140, 40) }),
    [],
  );

  return (
    <div className="canh">
      <Lop sau={0} className="lop-troi">
        <div className="troi troi-dem" />
        <div className="troi troi-ngay" />
      </Lop>

      <Lop sau={0.04} className="lop-sao">
        <Svg>
          {sao.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              className="sao"
              style={{ animationDelay: `${s.tre}s` }}
            />
          ))}
        </Svg>
      </Lop>

      <Lop sau={0.08}>
        <Svg>
          <ThienThe thoi={thoi} tienDo={tienDoThienThe} />
        </Svg>
      </Lop>

      <Lop sau={0.1} className="lop-may">
        <Svg>
          <g className="may may-1">
            <ellipse cx="300" cy="200" rx="160" ry="26" />
            <ellipse cx="380" cy="186" rx="90" ry="24" />
          </g>
          <g className="may may-2">
            <ellipse cx="1080" cy="140" rx="200" ry="22" />
            <ellipse cx="1000" cy="128" rx="80" ry="20" />
          </g>
        </Svg>
      </Lop>

      <Lop sau={0.14}>
        <Svg>
          <path
            className="nui-xa"
            d="M0 560 L110 505 L210 530 L360 430 L470 492 L600 452 L760 360 L880 452 L1010 418 L1150 486 L1290 432 L1440 480 V900 H0 Z"
          />
        </Svg>
      </Lop>

      <Lop sau={0.22}>
        <Svg>
          <path
            className="nui-gan"
            d="M0 630 C150 586 280 612 420 596 C560 578 700 640 860 606 C1020 574 1190 628 1440 596 V900 H0 Z"
          />
          <path className="rung" d={thong.xa} />
        </Svg>
      </Lop>

      <Lop sau={0.3}>
        <Svg>
          {nha.map((n, i) => (
            <g key={i}>
              <path
                className="nha"
                d={`M${n.x} ${n.y} V${n.y - n.cao} L${n.x + n.rong / 2} ${n.y - n.cao - n.rong * 0.42} L${n.x + n.rong} ${n.y - n.cao} V${n.y} Z`}
              />
              {Array.from({ length: n.cuaSo }, (_, k) => (
                <rect
                  key={k}
                  className="cua-so"
                  x={n.x + 7 + k * (n.rong / 2 - 2)}
                  y={n.y - n.cao + 8}
                  width="7"
                  height="9"
                />
              ))}
            </g>
          ))}
          <path className="rung" d={thong.gan} />
        </Svg>
      </Lop>

      <Lop sau={0.36} className="lop-suong">
        <div className="suong suong-1" />
        <div className="suong suong-2" />
      </Lop>

      <Lop sau={0.2} className="lop-ban">
        {children}
      </Lop>

      <Lop sau={0.7} className="lop-tien-canh">
        <Svg>
          <path
            className="tien-canh"
            d="M-40 900 L-40 300 L20 340 L-10 420 L60 450 L0 520 L90 560 L10 640 L120 690 L30 760 L150 820 L170 900 Z"
          />
          <path
            className="tien-canh"
            d="M1480 900 L1480 260 L1420 310 L1450 390 L1370 420 L1440 500 L1340 540 L1430 620 L1310 680 L1410 750 L1280 820 L1270 900 Z"
          />
          <path
            className="tien-canh"
            d="M0 900 C240 860 420 884 720 872 C1020 860 1200 884 1440 862 V900 Z"
          />
        </Svg>
      </Lop>

      <div className={`man-dem ${dangDenLuot ? 'man-dem-ven' : ''}`} aria-hidden="true" />
    </div>
  );
}
