import { describe, expect, it } from 'vitest';
import { taoMayChuThu } from './interface/mayChuThu.js';

describe('GET /api/health', () => {
  it('trả về trạng thái ok và tên ứng dụng', async () => {
    const may = await taoMayChuThu();
    try {
      const res = await fetch(`${may.url}/api/health`);
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ trangThai: 'ok', ungDung: 'Làng Trăng Mờ' });
    } finally {
      await may.dong();
    }
  });
});
