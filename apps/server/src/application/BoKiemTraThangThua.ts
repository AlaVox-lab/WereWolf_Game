import { Phe } from '../domain/chung/Phe.js';
import type { VanChiDoc } from '../domain/vaitro/NguCanhHanhDong.js';

/** Ba kết quả có thể của một lần kiểm tra (UC19 — điều kiện sau). */
export enum KetQuaThangThua {
  PHE_DAN_THANG = 'PHE_DAN_THANG',
  PHE_SOI_THANG = 'PHE_SOI_THANG',
  CHUA_KET_THUC = 'CHUA_KET_THUC',
}

/**
 * Bộ kiểm tra thắng thua (UC19) — đúng công thức mục 16.4 tài liệu gốc, không diễn đạt mơ hồ:
 *
 * - S = số người còn sống thuộc phe Sói, D = số người còn sống không thuộc phe Sói
 * - S = 0 → phe Dân thắng (BR02)
 * - ngược lại S ≥ D → phe Sói thắng (BR01)
 * - ngược lại ván tiếp tục
 *
 * Phải gọi **hai lần mỗi lượt**: sau giải quyết đêm (kể cả dây chuyền Thợ săn) và sau thi hành
 * kết quả bỏ phiếu. Thiếu lần đầu là TC15 hỏng — ván chạy thừa một pha thảo luận.
 */
export class BoKiemTraThangThua {
  kiemTra(van: VanChiDoc): KetQuaThangThua {
    const conSong = van.layNguoiConSong();
    const S = conSong.filter((n) => n.vaiTro.phe === Phe.SOI).length;
    const D = conSong.length - S;
    if (S === 0) return KetQuaThangThua.PHE_DAN_THANG; // BR02
    if (S >= D) return KetQuaThangThua.PHE_SOI_THANG; // BR01
    return KetQuaThangThua.CHUA_KET_THUC;
  }
}
