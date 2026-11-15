// Điểm lắp ráp phụ thuộc và khởi động máy chủ.
//
// KHO=bo-nho chạy không cần PostgreSQL (mất dữ liệu khi tắt); mặc định dùng Prisma với DATABASE_URL.
import { SoDangKyPhong } from './application/phong/SoDangKyPhong.js';
import { DichVuTaiKhoan } from './application/taikhoan/DichVuTaiKhoan.js';
import type { KhoDuLieu } from './application/kho/KhoDuLieu.js';
import { boMatKhauBcrypt } from './infrastructure/auth/matKhau.js';
import { taoBoPhien } from './infrastructure/auth/phien.js';
import { taoKhoBoNho } from './infrastructure/repository/boNho/khoBoNho.js';
import { taoKhoPrisma, taoPrisma } from './infrastructure/repository/prisma/khoPrisma.js';
import { NgauNhienThat } from './infrastructure/thoiGian.js';
import { createApp } from './interface/api/app.js';
import { taoRouterPhong } from './interface/api/phong.js';

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

const taiKhoan = new DichVuTaiKhoan(kho.taiKhoan, boMatKhauBcrypt);
const phong = new SoDangKyPhong({
  kho,
  nguonNgauNhien: new NgauNhienThat(),
  choPhepNguoiChoiAo: process.env.CHO_PHEP_NGUOI_CHOI_AO === 'true',
});
const app = createApp({
  taiKhoan,
  phien: taoBoPhien(biMat),
  routerThem: [taoRouterPhong(phong)],
});

app.listen(port, () => {
  console.log(
    `Máy chủ Làng Trăng Mờ chạy tại http://localhost:${port} (kho: ${process.env.KHO ?? 'prisma'})`,
  );
});
