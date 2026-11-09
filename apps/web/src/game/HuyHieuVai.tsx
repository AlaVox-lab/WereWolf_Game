import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { TEN_VAI } from './hienThi';

/** Hình khắc của từng vai, vẽ trên khung 64 × 64 — một ngôn ngữ nét duy nhất cho cả bộ. */
const HINH: Record<LoaiVaiCongKhai, React.ReactNode> = {
  // Đầu sói nhìn thẳng: hai tai nhọn, mõm hẹp, mắt xếch.
  Soi: (
    <>
      <path d="M15 9 L25 23 L19 30 Z M49 9 L39 23 L45 30 Z" className="to-dam" />
      <path d="M19 27 L32 20 L45 27 L49 39 L37 53 L32 56 L27 53 L15 39 Z" className="to-nhat" />
      <path d="M23 36 L29 38.5 M41 36 L35 38.5" />
      <path d="M28.5 46 L32 49.5 L35.5 46" />
    </>
  ),
  // Khiên mang trăng khuyết — che chắn dưới ánh trăng.
  BaoVe: (
    <>
      <path d="M32 7 L52 15 V31 C52 44 43 52 32 57 C21 52 12 44 12 31 V15 Z" className="to-nhat" />
      <path d="M36 21.5 A11 11 0 1 0 36 43.5 A8.6 8.6 0 1 1 36 21.5 Z" className="to-dam" />
    </>
  ),
  // Con mắt mở giữa ba tia sáng.
  TienTri: (
    <>
      <path d="M32 8 V14 M17 12 L20.5 17.5 M47 12 L43.5 17.5" />
      <path d="M7 34 C17 19 47 19 57 34 C47 49 17 49 7 34 Z" className="to-nhat" />
      <circle cx="32" cy="34" r="8.5" />
      <circle cx="32" cy="34" r="3.4" className="to-dam" />
    </>
  ),
  // Bình thuốc cổ dài, bọt sủi.
  PhuThuy: (
    <>
      <path d="M26 8 H38" />
      <path
        d="M28 8 V22 L16 45 C13.5 51.5 17.5 56 24 56 H40 C46.5 56 50.5 51.5 48 45 L36 22 V8"
        className="to-nhat"
      />
      <path d="M19.5 40 H44.5" />
      <circle cx="27" cy="48" r="2.6" className="to-dam" />
      <circle cx="36" cy="46" r="2" className="to-dam" />
      <circle cx="32" cy="33" r="1.6" className="to-dam" />
    </>
  ),
  // Cung căng, mũi tên ngang.
  ThoSan: (
    <>
      <path d="M19 7 C42 17 42 47 19 57" className="to-khong" />
      <path d="M19 7 L19 57" />
      <path d="M9 32 H55 M55 32 L47.5 26.5 M55 32 L47.5 37.5 M9 32 L5 27.5 M9 32 L5 36.5 M14 32 L10 27.5 M14 32 L10 36.5" />
    </>
  ),
  // Đèn lồng của làng.
  DanLang: (
    <>
      <path d="M32 5 V11" />
      <path d="M23 11 H41 L43.5 16 H20.5 Z" className="to-dam" />
      <rect x="21.5" y="16" width="21" height="30" rx="2" className="to-nhat" />
      <path d="M32 24 C36.5 29.5 35.5 35 32 37 C28.5 35 27.5 29.5 32 24 Z" className="to-dam" />
      <path d="M23 46 H41 L38.5 51 H25.5 Z" className="to-dam" />
    </>
  ),
};

interface Props {
  vai: LoaiVaiCongKhai;
  /** Đường kính, px. */
  co?: number;
  /** Có vẽ đĩa nền tròn không — tắt khi lồng vào một huy hiệu khác. */
  coNen?: boolean;
  className?: string;
}

/** Huy hiệu vai — đĩa tròn viền màu vai, hình khắc ở giữa. */
export function HuyHieuVai({ vai, co = 64, coNen = true, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={co}
      height={co}
      role="img"
      aria-label={TEN_VAI[vai]}
      className={`huy-hieu ${className}`}
      style={{ ['--mau-vai' as string]: `var(--vai-${vai})` }}
    >
      {coNen && <circle cx="32" cy="32" r="30.5" className="huy-hieu-nen" />}
      <g className="huy-hieu-net" transform="translate(32 32) scale(0.78) translate(-32 -32)">
        {HINH[vai]}
      </g>
    </svg>
  );
}
