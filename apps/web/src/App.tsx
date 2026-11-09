import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { ManXacThuc } from './screens/ManXacThuc';

// Ván mẫu kéo theo cả three.js — tải riêng khi vào, màn đăng nhập mở nhẹ.
const TrangVanMau = lazy(() =>
  import('./xem-truoc/TrangVanMau').then((m) => ({ default: m.TrangVanMau })),
);

/**
 * Đường dẫn của web. Giai đoạn 3: MH01 đăng nhập/đăng ký (chỉ giao diện) và ván mẫu phát lại;
 * trang chủ, phòng chờ, phòng chơi thật thêm ở Giai đoạn 5.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dang-nhap" replace />} />
        <Route path="/dang-nhap" element={<ManXacThuc cheDo="dang-nhap" />} />
        <Route path="/dang-ky" element={<ManXacThuc cheDo="dang-ky" />} />
        <Route
          path="/van-mau"
          element={
            <Suspense
              fallback={
                <main className="san-khau man-cho" data-thoi="dem">
                  <p className="ten-lang">Làng Trăng Mờ</p>
                  <p className="phu">Trăng đang lên…</p>
                </main>
              }
            >
              <TrangVanMau />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
