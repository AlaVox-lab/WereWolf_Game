import { Link, useParams } from 'react-router';

/** MH03 phòng chờ — khung tạm cho tới khi dựng xong ở ROADMAP 5.4. */
export function PhongCho() {
  const { ma = '' } = useParams();
  return (
    <main className="trang-chu">
      <header className="tc-chao">
        <p className="tc-loi-chao">Phòng {ma.toUpperCase()}</p>
        <h1 className="tc-tieu-de">Phòng chờ đang được dựng.</h1>
        <p className="tc-phong-cu">
          <Link to="/">Về trang chủ</Link>
        </p>
      </header>
    </main>
  );
}
