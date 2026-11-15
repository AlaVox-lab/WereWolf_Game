// Lớp gọi REST (ROADMAP 5.1). Cookie phiên httpOnly đi kèm tự động; lỗi máy chủ có dạng
// PhanHoiLoi { loi, thongDiep } — ném LoiApi mang câu tiếng Việt để hiện thẳng cho người dùng.
import type { PhanHoiLoi } from '@moonvillage/shared';

export class LoiApi extends Error {
  constructor(
    readonly ma: string,
    readonly thongDiep: string,
    readonly maHttp: number,
  ) {
    super(thongDiep);
  }
}

export async function goiApi<T>(duongDan: string, phuongThuc = 'GET', than?: unknown): Promise<T> {
  const res = await fetch(`/api${duongDan}`, {
    method: phuongThuc,
    credentials: 'same-origin',
    headers: than === undefined ? {} : { 'content-type': 'application/json' },
    ...(than === undefined ? {} : { body: JSON.stringify(than) }),
  });
  const chu = await res.text();
  const duLieu = chu ? (JSON.parse(chu) as unknown) : null;
  if (!res.ok) {
    const loi = duLieu as PhanHoiLoi | null;
    throw new LoiApi(
      loi?.loi ?? 'LOI_MAY_CHU',
      loi?.thongDiep ?? 'Không nối được máy chủ. Thử lại sau.',
      res.status,
    );
  }
  return duLieu as T;
}
