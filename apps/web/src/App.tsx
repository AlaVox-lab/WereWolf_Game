import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CanDangNhap, KhungUngDung, useNapPhien } from './screens/KhungUngDung';
import { ManXacThuc } from './screens/ManXacThuc';
import { PhongCho } from './screens/PhongCho';
import { TrangChu } from './screens/TrangChu';

// Ván mẫu kéo theo cả three.js — tải riêng khi vào, màn đăng nhập mở nhẹ.
const TrangVanMau = lazy(() =>
  import('./xem-truoc/TrangVanMau').then((m) => ({ default: m.TrangVanMau })),
);

function DuongDan() {
  useNapPhien();
  return (
    <Routes>
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
      <Route element={<CanDangNhap />}>
        <Route element={<KhungUngDung />}>
          <Route index element={<TrangChu />} />
          <Route path="/phong/:ma" element={<PhongCho />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Đường dẫn của web. Ngoài ván: MH01 đăng nhập/đăng ký, MH02 trang chủ, MH03 phòng chờ (cần đăng
 * nhập, nằm trong khung có thanh điều hướng); ván mẫu phát lại mở tự do để xem thử.
 */
export function App() {
  return (
    <BrowserRouter>
      <DuongDan />
    </BrowserRouter>
  );
}
