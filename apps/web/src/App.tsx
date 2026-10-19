import { useEffect, useState } from 'react';
import { TEN_UNG_DUNG, type PhanHoiSucKhoe } from '@moonvillage/shared';

// Trang tạm của Giai đoạn 0: chỉ để kiểm chứng web gọi được máy chủ qua proxy.
// Giao diện thật chờ thiết kế ở Giai đoạn 3 — không trang trí ở đây.
export function App() {
  const [health, setHealth] = useState<PhanHoiSucKhoe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json() as Promise<PhanHoiSucKhoe>)
      .then(setHealth)
      .catch(() => setError('Không gọi được máy chủ'));
  }, []);

  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-bold">{TEN_UNG_DUNG}</h1>
      <p className="mt-2">
        Máy chủ: {health ? `${health.trangThai} (${health.thoiDiem})` : (error ?? 'đang kiểm tra…')}
      </p>
    </main>
  );
}
