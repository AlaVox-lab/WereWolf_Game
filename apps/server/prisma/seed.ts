// Dữ liệu mẫu cho môi trường phát triển (ROADMAP 4.1): ba tài khoản người chơi, một tài khoản
// quản trị, mùa giải đầu tiên. Chạy lại an toàn — tài khoản đã có thì bỏ qua.
//
//   npm run db:seed --workspace @moonvillage/server
//
// Mật khẩu dưới đây CHỈ dùng khi phát triển — không bao giờ dùng trên máy chủ thật.
import { bamMatKhau } from '../src/infrastructure/auth/matKhau.js';
import { taoKhoPrisma, taoPrisma } from '../src/infrastructure/repository/prisma/khoPrisma.js';

const TAI_KHOAN_MAU = [
  { tenDangNhap: 'ngan', bietDanh: 'Ngân', matKhau: 'langtrang1', laQuanTri: false },
  { tenDangNhap: 'khoa', bietDanh: 'Khoa', matKhau: 'langtrang1', laQuanTri: false },
  { tenDangNhap: 'linh', bietDanh: 'Linh', matKhau: 'langtrang1', laQuanTri: false },
  { tenDangNhap: 'quantri', bietDanh: 'Quản trò', matKhau: 'quantri123', laQuanTri: true },
];

const db = taoPrisma(
  process.env.DATABASE_URL ?? 'postgresql://moonvillage:moonvillage@localhost:5433/moonvillage',
);
const kho = taoKhoPrisma(db);

for (const t of TAI_KHOAN_MAU) {
  if (await kho.taiKhoan.timTheoTen(t.tenDangNhap)) {
    console.log(`Đã có: ${t.tenDangNhap}`);
    continue;
  }
  await kho.taiKhoan.tao({
    tenDangNhap: t.tenDangNhap,
    bietDanh: t.bietDanh,
    matKhauBam: await bamMatKhau(t.matKhau),
    laQuanTri: t.laQuanTri,
  });
  console.log(`Tạo: ${t.tenDangNhap}${t.laQuanTri ? ' (quản trị)' : ''}`);
}
const mua = await kho.xepHang.muaHienTai();
console.log(`Mùa giải hiện tại: ${mua.ten}`);
await db.$disconnect();
