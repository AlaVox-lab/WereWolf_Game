import { LoaiVai } from '../chung/LoaiVai.js';
import { LoiNghiepVu } from '../chung/LoiNghiepVu.js';
import { Phe } from '../chung/Phe.js';
import type { HanhDongDem } from '../van/HanhDongDem.js';
import { VaiTro } from './VaiTro.js';

/**
 * Dân làng — không có năng lực. Ban đêm không ai gọi Dân làng dậy: vai bị loại ngay ở bước lọc
 * `laHanhDongDem()`, chứ không phải được gọi rồi đứng im.
 */
export class DanLang extends VaiTro {
  readonly loaiVai = LoaiVai.DanLang;
  readonly tenVai = 'Dân làng';
  readonly phe = Phe.DAN;
  readonly doUuTien = 0;
  readonly moTaNangLuc =
    'Bạn không có năng lực đặc biệt. Ban ngày hãy lắng nghe, suy luận và bỏ phiếu để tìm ra Sói.';

  protected dungNangLuc(): HanhDongDem {
    throw new LoiNghiepVu('VAI_KHONG_CO_NANG_LUC', 'Dân làng không hành động ban đêm');
  }
}
