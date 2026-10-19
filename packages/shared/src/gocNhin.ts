// Góc nhìn của MỘT người chơi — dữ liệu duy nhất về ván được gửi xuống trình duyệt
// (ARCHITECTURE.md mục 8, PC04). Chỉ kiểu dữ liệu thuần, không lớp, không luật.

export type PheCongKhai = 'DAN' | 'SOI';
export type LoaiVaiCongKhai = 'DanLang' | 'BaoVe' | 'Soi' | 'TienTri' | 'PhuThuy' | 'ThoSan';
export type LoaiKenhCongKhai = 'CHUNG' | 'SOI' | 'NGUOI_CHET';
export type TrangThaiVanCongKhai =
  | 'CHO_DU_NGUOI'
  | 'DANG_CHIA_VAI'
  | 'PHA_DEM'
  | 'GIAI_QUYET_DEM'
  | 'PHA_CONG_BO'
  | 'PHA_THAO_LUAN'
  | 'PHA_BO_PHIEU'
  | 'GIAI_QUYET_PHIEU'
  | 'KET_THUC'
  | 'HUY_VAN';

/** Người khác trong ván — **không bao giờ** có vai hay phe. */
export interface NguoiChoiCongKhai {
  id: string;
  thuTuGhe: number;
  conSong: boolean;
}

/** Thông tin của chính người xem. */
export interface ThongTinCuaToi {
  id: string;
  loaiVai: LoaiVaiCongKhai;
  tenVai: string;
  phe: PheCongKhai;
  moTaNangLuc: string;
  conSong: boolean;
  /** Mã các Sói khác — chỉ khi chính mình là Sói (UC12 bước 6), ngoài ra `null`. */
  dongDoi: string[] | null;
  /** Trạng thái riêng của vai mình, ví dụ lọ thuốc còn lại. */
  trangThaiKyNang: Record<string, unknown>;
}

/** Một nhóm lựa chọn trong việc cần làm. `loai` chỉ có khi vai có nhiều loại hành động. */
export interface NhomLuaChonCongKhai {
  loai?: 'CUU' | 'DOC';
  mucTieu: string[];
}

/** Việc người xem đang được mời làm ngay lúc này. */
export interface ViecCanLam {
  viec: 'HANH_DONG_DEM' | 'BO_PHIEU' | 'THO_SAN_BAN';
  /** Thời điểm hết hạn tuyệt đối, mili giây — trình duyệt chỉ đếm ngược, không tự chuyển pha. */
  hetHanLuc: number;
  luaChon: NhomLuaChonCongKhai[];
  /** Được bỏ trắng (phiếu) — gửi `{ mucTieuId: null }`. */
  choPhepBoTrang: boolean;
  /** Chỉ cho Phù thủy trong lượt của mình (BR07): ai bị cắn, đã được đỡ chưa. */
  nanNhan?: { nanNhanId: string | null; anToan: boolean };
}

export interface KetQuaSoiCongKhai {
  luot: number;
  mucTieuId: string;
  phe: PheCongKhai;
}

/** Kết quả ngày công khai: chỉ ai chết — **không** ai bắn ai, kẻo lộ Thợ săn (Q09). */
export interface KetQuaNgayCongKhai {
  nguoiBiTreoId: string | null;
  coBauLai: boolean;
  nguoiChetThem: string[];
}

export interface MoTaQuyTacCongKhai {
  ma: string;
  dangBat: boolean;
  noiDung: string;
}

/** Một dòng của bản ghi diễn tiến. */
export interface SuKienNhatKyCongKhai {
  thuTu: number;
  thoiDiem: number;
  loai: string;
  duLieu: Record<string, unknown>;
}

/** Chỉ có khi ván đã `KET_THUC` (MH08): phe thắng, vai của tất cả, bản ghi diễn tiến. */
export interface KetThucCongKhai {
  pheThang: PheCongKhai;
  vai: { id: string; loaiVai: LoaiVaiCongKhai; phe: PheCongKhai }[];
  /** Bản ghi diễn tiến đầy đủ — ý định, phiếu, nguyên nhân chết (UC20, MH08). */
  nhatKy: SuKienNhatKyCongKhai[];
}

export interface GocNhinNguoiChoi {
  vanId: string;
  trangThai: TrangThaiVanCongKhai;
  luot: number;
  /** Vai đang tới lượt trong đêm — thứ tự bước vốn công khai theo cấu hình (Q05). */
  buocDem: LoaiVaiCongKhai | null;
  /** Hạn của pha ngày (công bố, thảo luận, bỏ phiếu) cho cả làng; ban đêm luôn `null`. */
  hetHanPha: number | null;
  toi: ThongTinCuaToi;
  nguoiChoi: NguoiChoiCongKhai[];
  viecCanLam: ViecCanLam | null;
  /** Kết quả soi của chính mình — chỉ Tiên tri có, người khác là mảng rỗng. */
  ketQuaSoi: KetQuaSoiCongKhai[];
  /** Người chết đêm qua — chỉ mã, không nguyên nhân. */
  congBoSang: string[];
  ketQuaNgay: KetQuaNgayCongKhai | null;
  /** Chỉ khi đang bỏ phiếu: bao nhiêu người đã bầu — số đếm, không nêu tên. */
  tienDoBoPhieu: { daBau: number; tong: number } | null;
  boLuat: MoTaQuyTacCongKhai[];
  kenhXemDuoc: LoaiKenhCongKhai[];
  kenhGuiDuoc: LoaiKenhCongKhai[];
  ketThuc: KetThucCongKhai | null;
}
