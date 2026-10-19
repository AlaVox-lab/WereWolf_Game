// Xuất bảy sơ đồ PlantUML trong docs/diagrams/ ra docs/diagrams/out/ (SVG và PNG).
// Chạy PlantUML trong Docker trên máy — không gửi sơ đồ ra dịch vụ bên ngoài, không cần cài Java.
// Dùng: npm run so-do
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const thuMuc = resolve('docs/diagrams').replaceAll('\\', '/');
mkdirSync(`${thuMuc}/out`, { recursive: true });

for (const dinhDang of ['svg', 'png']) {
  const ketQua = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-v',
      `${thuMuc}:/data`,
      'plantuml/plantuml',
      `-t${dinhDang}`,
      '-charset',
      'UTF-8',
      '-o',
      '/data/out',
      '/data/*.puml',
    ],
    { stdio: 'inherit', env: { ...process.env, MSYS_NO_PATHCONV: '1' } },
  );
  if (ketQua.status !== 0) {
    console.error('Xuất sơ đồ thất bại — Docker Desktop đã bật chưa?');
    process.exit(ketQua.status ?? 1);
  }
}
console.log(`Đã xuất sơ đồ vào ${thuMuc}/out`);
