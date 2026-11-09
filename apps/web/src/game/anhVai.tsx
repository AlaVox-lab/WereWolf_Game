// Tranh thẻ vai — tranh khắc thế kỷ 16–17 thuộc phạm vi công cộng, lấy từ The Met Open Access
// (CC0). Ghi nguồn đầy đủ ở public/the-vai/nguon.json và docs/design/README.md.
import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { TEN_VAI } from './hienThi';

export const ANH_VAI: Record<LoaiVaiCongKhai, string> = {
  Soi: '/the-vai/Soi.webp',
  BaoVe: '/the-vai/BaoVe.webp',
  TienTri: '/the-vai/TienTri.webp',
  PhuThuy: '/the-vai/PhuThuy.webp',
  ThoSan: '/the-vai/ThoSan.webp',
  DanLang: '/the-vai/DanLang.webp',
};

/** Mặt sau mọi thẻ, cũng là mặt trăng trên trời: "Full Moon", Claude Mellan, 1635. */
export const ANH_TRANG = '/the-vai/MatSau.webp';

/** Tên tranh và tác giả — hiện nhỏ dưới thẻ khi lật. */
export const NGUON_VAI: Record<LoaiVaiCongKhai, string> = {
  Soi: 'Lucas Cranach, "Người sói", khoảng 1512',
  BaoVe: 'Albrecht Dürer, "Kỵ sĩ, Thần chết và Quỷ", 1513',
  TienTri: 'Agostino Veneziano, "Nữ tiên tri Cumae", 1516',
  PhuThuy: 'Pieter Bruegel, "Nhà giả kim", sau 1558',
  ThoSan: 'Albrecht Dürer, "Thánh Eustace", khoảng 1501',
  DanLang: 'Albrecht Dürer, "Đôi nông dân khiêu vũ", 1514',
};

/** Ảnh nhỏ của thẻ vai, khung viền màu vai — dùng ở thanh trạng thái, bảng việc, màn kết. */
export function AnhVai({
  vai,
  rong = 40,
  className = '',
}: {
  vai: LoaiVaiCongKhai;
  rong?: number;
  className?: string;
}) {
  return (
    <img
      src={ANH_VAI[vai]}
      alt={TEN_VAI[vai]}
      width={rong}
      height={Math.round(rong * 1.5)}
      className={`anh-vai ${className}`}
      style={{ ['--mau-vai' as string]: `var(--vai-${vai})` }}
      draggable={false}
    />
  );
}
