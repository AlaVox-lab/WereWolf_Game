/**
 * Nguyên nhân một người bị loại. **Không bao giờ** hiển thị khi công bố buổi sáng (nguyên tắc
 * giao diện 14.2) — chỉ dùng bên trong luật (BR09: Thợ săn bị treo cổ) và trong nhật ký sau ván.
 */
export enum NguyenNhanChet {
  BI_CAN = 'BI_CAN',
  BI_DOC = 'BI_DOC',
  BI_TREO_CO = 'BI_TREO_CO',
  BI_BAN = 'BI_BAN',
}
