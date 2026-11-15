import { GodRays } from '@paper-design/shaders-react';
import { useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { ANH_TRANG, AnhVai } from '@/game/anhVai';
import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { goiApi } from '@/lib/api';
import { dongKetNoi, moKetNoi } from '@/realtime/ketNoi';
import { useKho } from '@/realtime/kho';

/** Hỏi máy chủ phiên hiện tại một lần lúc mở ứng dụng. */
export function useNapPhien() {
  const datPhien = useKho((s) => s.datPhien);
  useEffect(() => {
    goiApi<Parameters<typeof datPhien>[0]>('/tai-khoan/toi').then(datPhien, () => datPhien(null));
  }, [datPhien]);
}

/** Chặn trang cần đăng nhập; đã đăng nhập thì mở kết nối thời gian thực. */
export function CanDangNhap({ children }: { children?: ReactNode }) {
  const phien = useKho((s) => s.phien);
  const viTri = useLocation();
  useEffect(() => {
    if (phien) moKetNoi();
  }, [phien]);
  if (phien === undefined) {
    return (
      <main className="trang-cho" data-thoi="dem">
        <p className="ten-lang">Làng Trăng Mờ</p>
        <p className="phu">Đang mở cổng làng…</p>
      </main>
    );
  }
  if (phien === null) {
    return <Navigate to={`/dang-nhap?tiep=${encodeURIComponent(viTri.pathname)}`} replace />;
  }
  return <>{children ?? <Outlet />}</>;
}

/** Khung các trang ngoài ván: thanh trên có tên làng, các mục, người đang đăng nhập. */
export function KhungUngDung({ children }: { children?: ReactNode }) {
  const phien = useKho((s) => s.phien)!;
  const ketNoi = useKho((s) => s.ketNoi);
  const di = useNavigate();
  const giam = useReducedMotion();
  const dangXuat = async () => {
    await goiApi('/tai-khoan/dang-xuat', 'POST').catch(() => undefined);
    dongKetNoi();
    useKho.getState().datPhien(null);
    di('/dang-nhap');
  };
  // Mục nào có trang thì mới hiện — lịch sử, xếp hạng, quản trị thêm dần ở Giai đoạn 7.
  const muc: { den: string; ten: string; quanTri?: boolean }[] = [
    { den: '/', ten: 'Trang chủ' },
    { den: '/ho-so', ten: 'Hồ sơ' },
  ];
  return (
    <div className="khung-ung-dung" data-thoi="dem">
      <GodRays
        className="nen-tia-trang"
        colorBack="#060a14"
        colorBloom="#2c3a58"
        colors={['#4a5b7c', '#8ea3c6', '#7a6c50']}
        density={0.25}
        spotty={0.3}
        midSize={0.2}
        midIntensity={0.35}
        intensity={0.24}
        bloom={0.16}
        speed={giam ? 0 : 0.25}
        offsetX={0.4}
        offsetY={-0.6}
      />
      <img className="trang-khung" src={ANH_TRANG} alt="" draggable={false} />
      <header className="thanh-dieu-huong">
        <Link to="/" className="ten-lang">
          Làng Trăng Mờ
        </Link>
        <nav aria-label="Mục chính" className="dieu-huong-muc">
          {muc
            .filter((m) => !m.quanTri || phien.laQuanTri)
            .map((m) => (
              <NavLink key={m.den} to={m.den} end className="dieu-huong-lien-ket">
                {m.ten}
              </NavLink>
            ))}
        </nav>
        <div className="dieu-huong-toi">
          <span
            className={`cham-ket-noi cham-${ketNoi}`}
            title={ketNoi === 'da-noi' ? 'Đã nối máy chủ' : 'Chưa nối máy chủ'}
          />
          <AnhVai vai={phien.anhDaiDien as LoaiVaiCongKhai} rong={28} />
          <span className="dieu-huong-ten">{phien.bietDanh}</span>
          <Button variant="secondary" size="sm" onClick={dangXuat}>
            Đăng xuất
          </Button>
        </div>
      </header>
      <div className="khung-noi-dung">{children ?? <Outlet />}</div>
    </div>
  );
}
