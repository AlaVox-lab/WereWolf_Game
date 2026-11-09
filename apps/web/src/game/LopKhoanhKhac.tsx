import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { TextEffect } from '@/components/ui/text-effect';
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

/**
 * Lời dẫn của quản trò cho mỗi khoảnh khắc. Hình ảnh (thẻ vai trồi lên, giá treo cổ, mũi tên)
 * diễn trong cảnh 3D phía sau; lớp này chỉ đặt chữ lên trên, chừa cảnh để nhìn thấy.
 */
function loiDan(
  kk: KhoanhKhac,
  ten: (id: string) => string,
  vaiToi: LoaiVaiCongKhai,
  luot: number,
) {
  switch (kk.loai) {
    case 'DOI_THOI':
      return kk.thoi === 'dem'
        ? {
            lon: 'Màn đêm buông xuống',
            phu: `Đêm thứ ${thuTu(luot)} — cả làng nhắm mắt.`,
            viTri: 'giua',
          }
        : { lon: 'Gà gáy, trời rạng', phu: 'Cả làng mở mắt.', viTri: 'giua' };
    case 'GOI_VAI':
      return {
        lon: LOI_GOI_VAI[kk.vai],
        phu:
          kk.vai === vaiToi
            ? 'Đến lượt bạn — mở mắt ra.'
            : `Những ai không phải ${TEN_VAI[kk.vai]}, hãy tiếp tục ngủ.`,
        viTri: 'duoi',
      };
    case 'CONG_BO':
      return kk.nguoiChet.length
        ? {
            lon: `Đêm qua ${kk.nguoiChet.map(ten).join(' và ')} đã ra đi`,
            phu: 'Quản trò không nói họ chết vì đâu.',
            viTri: 'giua',
          }
        : {
            lon: 'Đêm qua bình yên',
            phu: 'Không ai chết. Cả làng thức dậy đông đủ.',
            viTri: 'giua',
          };
    case 'TREO_CO':
      return {
        lon: `Làng đã treo cổ ${ten(kk.id)}`,
        phu: `Vai của ${ten(kk.id)} vẫn là bí mật cho tới hết ván.`,
        viTri: 'duoi',
      };
    case 'BI_BAN':
      return {
        lon: `${ten(kk.id)} trúng mũi tên cuối cùng`,
        phu: 'Không ai biết mũi tên từ tay ai.',
        viTri: 'duoi',
      };
    case 'KHONG_AI_BI_TREO':
      return {
        lon: 'Không ai bị treo cổ',
        phu: kk.coBauLai ? 'Bầu lại vẫn hòa — sợi dây được cuộn lại.' : 'Phiếu hòa hoặc bỏ trắng.',
        viTri: 'giua',
      };
    default:
      return null;
  }
}

export function LopKhoanhKhac({ kk, thoiLuong, onXong, ten, vaiToi, luot }: Props) {
  useEffect(() => {
    const h = setTimeout(onXong, thoiLuong);
    return () => clearTimeout(h);
  }, [kk, thoiLuong, onXong]);

  const loi = loiDan(kk, ten, vaiToi, luot);
  if (!loi) return null;
  return (
    <motion.div
      className={`lop-kk kk-${loi.viTri} kk-${kk.loai}`}
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="kk-chu">
        <TextEffect as="p" per="word" preset="blur" delay={0.25} className="kk-chu-lon">
          {loi.lon}
        </TextEffect>
        <TextEffect as="p" per="line" preset="fade" delay={0.9} className="kk-chu-phu">
          {loi.phu}
        </TextEffect>
      </div>
    </motion.div>
  );
}
