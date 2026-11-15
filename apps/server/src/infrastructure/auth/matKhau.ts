// Băm và so mật khẩu bằng bcryptjs (ROADMAP 4.2). Chỉ lưu bản băm — tài liệu gốc UC01: "mật khẩu
// đã băm".
import bcrypt from 'bcryptjs';

const DO_KHO = 10;

export function bamMatKhau(matKhau: string): Promise<string> {
  return bcrypt.hash(matKhau, DO_KHO);
}

/** So mật khẩu với bản băm. Bản băm "!" (người chơi ảo) không bao giờ khớp. */
export function soMatKhau(matKhau: string, banBam: string): Promise<boolean> {
  if (!banBam.startsWith('$2')) return Promise.resolve(false);
  return bcrypt.compare(matKhau, banBam);
}

/** Bản cài cổng `BoMatKhau` của tầng ứng dụng. */
export const boMatKhauBcrypt = { bam: bamMatKhau, so: soMatKhau };
