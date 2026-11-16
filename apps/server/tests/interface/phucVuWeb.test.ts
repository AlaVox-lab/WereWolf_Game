// Máy chủ phục vụ luôn bản build của web khi có thuMucWeb (đóng gói Docker — ROADMAP 6.4).
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { taoMayChuThu } from './mayChuThu.js';

let thuMuc: string;
let may: Awaited<ReturnType<typeof taoMayChuThu>>;

beforeAll(async () => {
  thuMuc = mkdtempSync(join(tmpdir(), 'web-'));
  writeFileSync(join(thuMuc, 'index.html'), '<!doctype html><title>Làng Trăng Mờ</title>');
  mkdirSync(join(thuMuc, 'assets'));
  writeFileSync(join(thuMuc, 'assets', 'app.js'), 'console.log("lang")');
  may = await taoMayChuThu({ thuMucWeb: thuMuc });
});
afterAll(async () => {
  await may.dong();
  rmSync(thuMuc, { recursive: true, force: true });
});

describe('Phục vụ web đã build', () => {
  it('trả tệp tĩnh đúng nội dung', async () => {
    const r = await fetch(`${may.url}/assets/app.js`);
    expect(r.status).toBe(200);
    expect(await r.text()).toContain('lang');
  });

  it('đường dẫn của ứng dụng một trang (/phong/ABC123, /lich-su/2) trả index.html', async () => {
    for (const duongDan of ['/', '/phong/ABC123', '/lich-su/2', '/dang-nhap?tiep=%2F']) {
      const r = await fetch(`${may.url}${duongDan}`);
      expect(r.status).toBe(200);
      expect(await r.text()).toContain('Làng Trăng Mờ');
    }
  });

  it('/api vẫn là API — đường dẫn API không có thì 404, không trả trang web', async () => {
    expect((await fetch(`${may.url}/api/health`)).status).toBe(200);
    const r = await fetch(`${may.url}/api/khong-co`);
    expect(r.status).toBe(404);
    expect(await r.text()).not.toContain('Làng Trăng Mờ');
  });
});
