// Chạy hàng loạt ván toàn người chơi ảo — hạng mục ROADMAP 2.9.
//
//   npm run mo-phong                                   một ván 8 người, in nhật ký
//   npm run mo-phong -- --so-nguoi 6-12 --so-van 1000  thống kê 1 000 ván, 6–12 người xoay vòng
//   npm run mo-phong -- --hat-giong 42 --tat BR11      tắt quy tắc tùy biến (lặp được)
//
// Thoát với mã 1 nếu có ván ném lỗi hoặc không kết thúc.
import { parseArgs } from 'node:util';
import { MaQuyTac } from '../apps/server/src/domain/chung/MaQuyTac.js';
import { BoLuatChoi, type CauHinhBoLuat } from '../apps/server/src/domain/luat/BoLuatChoi.js';
import type { SuKien } from '../apps/server/src/domain/van/NhatKyVan.js';
import {
  moPhongMotVan,
  type KetQuaMoPhong,
} from '../apps/server/src/infrastructure/bot/moPhong.js';

const { values } = parseArgs({
  options: {
    'so-nguoi': { type: 'string', default: '8' },
    'hat-giong': { type: 'string', default: '1' },
    'so-van': { type: 'string', default: '1' },
    tat: { type: 'string', multiple: true, default: [] },
  },
});

const [tu, den] = values['so-nguoi'].split('-').map(Number) as [number, number?];
const cacSoNguoi = Array.from({ length: (den ?? tu) - tu + 1 }, (_, i) => tu + i);
const hatGiongDau = Number(values['hat-giong']);
const soVan = Number(values['so-van']);

// --tat BR11 --tat BR04 → tắt các quy tắc tùy biến đó.
const luat: Partial<CauHinhBoLuat> = {};
const tam = new BoLuatChoi();
for (const ma of values.tat) {
  if (!(ma in MaQuyTac)) throw new Error(`Không có quy tắc ${ma}`);
  tam.datQuyTac(MaQuyTac[ma as keyof typeof MaQuyTac], false);
}
Object.assign(luat, tam.layGiaTri());

const phut = (ms: number) =>
  `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

/** Một dòng nhật ký thành câu tiếng Việt dễ đọc. */
function moTa(sk: SuKien): string {
  const d = sk.duLieu as Record<string, unknown>;
  switch (sk.loai) {
    case 'CHIA_VAI':
      return `Chia vai: ${Object.entries(d.vai as Record<string, string>)
        .map(([id, v]) => `${id}=${v}`)
        .join(', ')}`;
    case 'CHUYEN_PHA':
      return `── ${d.trangThai} (lượt ${d.luot})`;
    case 'Y_DINH':
      return `   ${d.nguoiThucHienId} ${d.loaiHanhDong} → ${d.mucTieuId}`;
    case 'KET_QUA_SOI':
      return `   ${d.tienTriId} soi ${d.mucTieuId}: phe ${d.phe}`;
    case 'KET_QUA_DEM':
      return `   Kết quả đêm: ${(d.nguoiChet as unknown[]).length} người chết`;
    case 'PHIEU_BAU':
      return `   ${d.nguoiBauId} bầu ${d.nguoiBiBauId ?? '(trắng)'}${d.vongBauLai ? ' [bầu lại]' : ''}`;
    case 'KET_QUA_BO_PHIEU': {
      const kq = d.ketQuaPhien as { loai: string; nguoiBiTreoId?: string };
      return `   Kết quả bỏ phiếu: ${kq.loai}${kq.nguoiBiTreoId ? ` ${kq.nguoiBiTreoId}` : ''}`;
    }
    case 'NGUOI_CHET':
      return `   ✝ ${d.nguoiChoiId} — ${d.nguyenNhan}${d.nguoiBanId ? ` (bởi ${d.nguoiBanId})` : ''}`;
    case 'KET_THUC':
      return `══ Phe ${d.pheThang} thắng`;
  }
}

async function main(): Promise<number> {
  if (soVan === 1) {
    const soNguoi = cacSoNguoi[0]!;
    const kq = await moPhongMotVan({ soNguoi, hatGiong: hatGiongDau, luat });
    console.log(`Ván ${soNguoi} người, hạt giống ${hatGiongDau}\n`);
    for (const sk of kq.nhatKy) console.log(`[${phut(sk.thoiDiem).padStart(5)}] ${moTa(sk)}`);
    console.log(`\n${kq.soLuot} lượt, ${phut(kq.thoiGianGiaLap)} giả lập.`);
    return 0;
  }

  const batDau = performance.now();
  const ketQua: (KetQuaMoPhong & { soNguoi: number })[] = [];
  const loi: string[] = [];
  for (let i = 0; i < soVan; i++) {
    const soNguoi = cacSoNguoi[i % cacSoNguoi.length]!;
    const hatGiong = hatGiongDau + i;
    try {
      ketQua.push({ ...(await moPhongMotVan({ soNguoi, hatGiong, luat })), soNguoi });
    } catch (e) {
      loi.push(
        `hạt giống ${hatGiong}, ${soNguoi} người: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const tb = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)).toFixed(1);
  console.log(`${soVan} ván, ${(performance.now() - batDau).toFixed(0)} ms thật\n`);
  console.log('Số người | Ván | Dân thắng | Sói thắng | Lượt TB | Lượt min–max | Phút giả lập TB');
  for (const n of cacSoNguoi) {
    const nhom = ketQua.filter((k) => k.soNguoi === n);
    if (nhom.length === 0) continue;
    const dan = nhom.filter((k) => k.pheThang === 'DAN').length;
    const luot = nhom.map((k) => k.soLuot);
    console.log(
      [
        String(n).padStart(8),
        String(nhom.length).padStart(3),
        `${String(dan).padStart(4)} (${((100 * dan) / nhom.length).toFixed(0)}%)`.padStart(9),
        `${String(nhom.length - dan).padStart(4)} (${((100 * (nhom.length - dan)) / nhom.length).toFixed(0)}%)`.padStart(
          9,
        ),
        tb(luot).padStart(7),
        `${Math.min(...luot)}–${Math.max(...luot)}`.padStart(12),
        tb(nhom.map((k) => k.thoiGianGiaLap / 60_000)).padStart(15),
      ].join(' | '),
    );
  }
  console.log(`\nKết thúc: ${ketQua.length}/${soVan}. Lỗi: ${loi.length}.`);
  for (const l of loi) console.log(`  ✗ ${l}`);
  return loi.length === 0 ? 0 : 1;
}

process.exitCode = await main();
