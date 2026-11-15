// Phiên đăng nhập: JWT ký HS256 (jose) đặt trong cookie httpOnly (ROADMAP 4.2). Cùng cookie này
// được Socket.IO đọc lúc bắt tay (4.7).
import { jwtVerify, SignJWT } from 'jose';

export const TEN_COOKIE = 'ltm_phien';
export const THOI_HAN_PHIEN_GIAY = 7 * 24 * 3600;

export interface BoPhien {
  ky(taiKhoanId: string): Promise<string>;
  /** Mã tài khoản trong phiên hợp lệ, `null` nếu phiên sai hoặc đã hết hạn. */
  doc(token: string | undefined): Promise<string | null>;
}

export function taoBoPhien(biMat: string): BoPhien {
  const khoa = new TextEncoder().encode(biMat);
  return {
    ky: (taiKhoanId) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(taiKhoanId)
        .setIssuedAt()
        .setExpirationTime(`${THOI_HAN_PHIEN_GIAY}s`)
        .sign(khoa),
    async doc(token) {
      if (!token) return null;
      try {
        const { payload } = await jwtVerify(token, khoa, { algorithms: ['HS256'] });
        return payload.sub ?? null;
      } catch {
        return null;
      }
    },
  };
}

/** Đọc một cookie từ chuỗi tiêu đề `Cookie` — dùng ở bắt tay Socket.IO. */
export function docCookie(tieuDe: string | undefined, ten: string): string | undefined {
  for (const phan of (tieuDe ?? '').split(';')) {
    const [k, ...v] = phan.trim().split('=');
    if (k === ten) return decodeURIComponent(v.join('='));
  }
  return undefined;
}
