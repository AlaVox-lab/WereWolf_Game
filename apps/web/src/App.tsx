import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CanDangNhap, KhungUngDung, useNapPhien } from './screens/KhungUngDung';
import { HoSo } from './screens/HoSo';
import { ChiTietVanCu, LichSu } from './screens/LichSu';
import { ManXacThuc } from './screens/ManXacThuc';
import { PhongCho } from './screens/PhongCho';
import { QuanTri } from './screens/QuanTri';
import { TrangChu } from './screens/TrangChu';
import { XepHang } from './screens/XepHang';

// Ván mẫu kéo theo cả three.js — tải riêng khi vào, màn đăng nhập mở nhẹ.
const TrangVanMau = lazy(() =>
  import('./xem-truoc/TrangVanMau').then((m) => ({ default: m.TrangVanMau })),
);

const vanMau = (
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
);

function DuongDan() {
  useNapPhien();
  return (
    <Routes>
      <Route path="/dang-nhap" element={<ManXacThuc cheDo="dang-nhap" />} />
      <Route path="/dang-ky" element={<ManXacThuc cheDo="dang-ky" />} />
      <Route path="/van-mau" element={vanMau} />
      <Route element={<CanDangNhap />}>
        <Route element={<KhungUngDung />}>
          <Route index element={<TrangChu />} />
          <Route path="/ho-so" element={<HoSo />} />
          <Route path="/lich-su" element={<LichSu />} />
          <Route path="/lich-su/:vanId" element={<ChiTietVanCu />} />
          <Route path="/xep-hang" element={<XepHang />} />
          <Route path="/quan-tri" element={<QuanTri />} />
        </Route>
        {/* Phòng tự bọc khung khi chờ; trong ván màn chơi chiếm trọn màn hình. */}
        <Route path="/phong/:ma" element={<PhongCho />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Đường dẫn của web. Ngoài ván: MH01 đăng nhập/đăng ký, MH02 trang chủ, MH03 phòng chờ (cần đăng
 * nhập, nằm trong khung có thanh điều hướng); ván mẫu phát lại mở tự do để xem thử.
 */
function AppDayDu() {
  return (
    <BrowserRouter>
      <DuongDan />
    </BrowserRouter>
  );
}

/**
 * Bản GitHub Pages (`vite build --mode pages`): không có máy chủ nên chỉ phát lại ván mẫu — mọi đường
 * dẫn đều mở ván mẫu, không gọi API, không mở Socket.IO.
 */
function AppVanMau() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="*" element={vanMau} />
      </Routes>
    </BrowserRouter>
  );
}

// MODE được thay bằng hằng lúc build nên bản Pages bỏ hẳn các màn cần máy chủ khỏi gói.
export const App = import.meta.env.MODE === 'pages' ? AppVanMau : AppDayDu;
