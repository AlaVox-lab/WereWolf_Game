/**
 * Mười trạng thái trong vòng đời của Ván đấu — sơ đồ `docs/diagrams/06-state-van-dau.puml`.
 * Đây chỉ là nhãn; hành vi chuyển tiếp nằm ở các lớp mẫu State trong `domain/van/trangthai/`.
 */
export enum TrangThaiVan {
  CHO_DU_NGUOI = 'CHO_DU_NGUOI',
  DANG_CHIA_VAI = 'DANG_CHIA_VAI',
  PHA_DEM = 'PHA_DEM',
  GIAI_QUYET_DEM = 'GIAI_QUYET_DEM',
  PHA_CONG_BO = 'PHA_CONG_BO',
  PHA_THAO_LUAN = 'PHA_THAO_LUAN',
  PHA_BO_PHIEU = 'PHA_BO_PHIEU',
  GIAI_QUYET_PHIEU = 'GIAI_QUYET_PHIEU',
  KET_THUC = 'KET_THUC',
  HUY_VAN = 'HUY_VAN',
}
