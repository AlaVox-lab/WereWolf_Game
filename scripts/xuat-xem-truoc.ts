// Xuất một ván mô phỏng thành chuỗi góc nhìn để giao diện phát lại khi chưa có máy chủ thời gian
// thực (Giai đoạn 3). Mỗi khung là `GocNhinNguoiChoi` của **từng** người chơi — đúng dữ liệu
// máy chủ sẽ gửi, nên trình duyệt không cần biết luật nào (nguyên tắc 1).
//
//   npm run xuat-xem-truoc                               ván 8 người, hạt giống 1 (ván ST02)
//   npm run xuat-xem-truoc -- --so-nguoi 6 --hat-giong 1
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import type { GocNhinNguoiChoi } from '../packages/shared/src/gocNhin.js';
import { taoGocNhin } from '../apps/server/src/application/taoGocNhin.js';
import type { BoDieuPhoiVan } from '../apps/server/src/application/BoDieuPhoiVan.js';
import { moPhongMotVan } from '../apps/server/src/infrastructure/bot/moPhong.js';

const { values } = parseArgs({
  options: {
    'so-nguoi': { type: 'string', default: '8' },
    'hat-giong': { type: 'string', default: '1' },
    ra: { type: 'string', default: 'apps/web/public/xem-truoc/van-mau.json' },
  },
});

/**
 * Một khung: thời điểm giả lập, điều vừa xảy ra, và góc nhìn của từng người theo thứ tự ghế —
 * `null` khi góc nhìn người đó y hệt khung trước (đỡ nặng tệp gấp nhiều lần).
 */
interface Khung {
  t: number;
  su: string;
  gocNhin: (GocNhinNguoiChoi | null)[];
}

const NHIP_LAY_MAU = 1_000;
const khung: Khung[] = [];
let dieuPhoi: BoDieuPhoiVan | undefined;
let dongHoBayGio = () => 0;
let truoc: string[] = [];

function chup(su: string) {
  if (!dieuPhoi) return;
  const gocNhin = dieuPhoi.van
    .layDanhSachNguoiChoi()
    .map((n) => taoGocNhin(dieuPhoi!, n.id) as GocNhinNguoiChoi);
  const json = gocNhin.map((g) => JSON.stringify(g));
  if (json.every((j, i) => j === truoc[i])) return; // không ai thấy gì đổi — bỏ khung
  khung.push({
    t: dongHoBayGio(),
    su,
    gocNhin: gocNhin.map((g, i) => (json[i] === truoc[i] ? null : g)),
  });
  truoc = json;
}

const kq = await moPhongMotVan({
  soNguoi: Number(values['so-nguoi']),
  hatGiong: Number(values['hat-giong']),
  quanSat: (d, dongHo) => {
    dieuPhoi = d;
    dongHoBayGio = () => dongHo.bayGio();
    d.suKien.dangKy((sk) => chup(sk.loai));
    // Phiếu bầu không phát sự kiện — lấy mẫu mỗi giây giả lập để thấy tiến độ bỏ phiếu.
    const layMau = () => {
      chup('NHIP');
      if (d.van.trangThai !== 'KET_THUC') dongHo.datHen(NHIP_LAY_MAU, layMau);
    };
    dongHo.datHen(0, layMau);
  },
});
chup('KET_THUC');

writeFileSync(
  values.ra,
  JSON.stringify({
    soNguoi: Number(values['so-nguoi']),
    hatGiong: Number(values['hat-giong']),
    pheThang: kq.pheThang,
    soLuot: kq.soLuot,
    khung,
  }),
);
console.log(
  `${khung.length} khung, ${kq.soLuot} lượt, phe ${kq.pheThang} thắng → ${values.ra} (${Math.round(
    JSON.stringify(khung).length / 1024,
  )} KB)`,
);
