import { describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/interface/api/app.js';

describe('GET /api/health', () => {
  it('trả về trạng thái ok và tên ứng dụng', async () => {
    const server = createApp().listen(0);
    try {
      const { port } = server.address() as AddressInfo;
      const res = await fetch(`http://localhost:${port}/api/health`);
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toMatchObject({ trangThai: 'ok', ungDung: 'Làng Trăng Mờ' });
    } finally {
      server.close();
    }
  });
});
