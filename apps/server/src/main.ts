// Điểm khởi động máy chủ — đọc biến môi trường rồi giao cho lapRapMayChu().
//
// KHO=bo-nho chạy không cần PostgreSQL (mất dữ liệu khi tắt); mặc định dùng Prisma với DATABASE_URL.
import type { KhoDuLieu } from './application/kho/KhoDuLieu.js';
import { taoKhoBoNho } from './infrastructure/repository/boNho/khoBoNho.js';
import { taoKhoPrisma, taoPrisma } from './infrastructure/repository/prisma/khoPrisma.js';
import { lapRapMayChu } from './interface/lapRap.js';

const port = Number(process.env.PORT ?? 3000);
const biMat = process.env.JWT_SECRET ?? 'chi-dung-khi-phat-trien-doi-o-may-chu-that';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('Thiếu JWT_SECRET ở môi trường production');
}

const kho: KhoDuLieu =
  process.env.KHO === 'bo-nho'
    ? taoKhoBoNho()
    : taoKhoPrisma(
        taoPrisma(
          process.env.DATABASE_URL ??
            'postgresql://moonvillage:moonvillage@localhost:5433/moonvillage',
        ),
      );

const mayChu = lapRapMayChu({
  kho,
  biMatPhien: biMat,
  choPhepNguoiChoiAo: process.env.CHO_PHEP_NGUOI_CHOI_AO === 'true',
});

mayChu.http.listen(port, () => {
  console.log(
    `Máy chủ Làng Trăng Mờ chạy tại http://localhost:${port} (kho: ${process.env.KHO ?? 'prisma'})`,
  );
});
