import type {
  BaoCaoCongKhai,
  LoaiVaiCongKhai,
  TaiKhoanQuanTri,
  TongQuanCongKhai,
  YeuCauXuLyBaoCao,
} from '@moonvillage/shared';
import { ExternalLink, Lock, LockOpen } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ANH_VAI } from '@/game/anhVai';
import { goiApi } from '@/lib/api';
import { useKho } from '@/realtime/kho';

const NGAY = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

const TRANG_THAI: Record<BaoCaoCongKhai['trangThai'], string> = {
  CHO_XU_LY: 'Chờ xử lý',
  CANH_CAO: 'Đã cảnh cáo',
  KHOA_TAI_KHOAN: 'Đã khóa tài khoản',
  BAC_BO: 'Đã bác bỏ',
};

/** UC24 — ván thắng theo phe: một thanh ghép, nhãn chữ trên từng phần, chú giải, bảng số. */
function ThanhPheThang({ dan, soi }: { dan: number; soi: number }) {
  const tong = dan + soi;
  const phan = (n: number) => (tong ? Math.round((100 * n) / tong) : 0);
  const phe = [
    { ten: 'Dân làng thắng', so: dan, lop: 'qt-dan' },
    { ten: 'Bầy Sói thắng', so: soi, lop: 'qt-soi' },
  ];
  return (
    <figure className="qt-bieu-do">
      <figcaption className="qt-bd-tieu-de">Ván thắng theo phe</figcaption>
      <ul className="qt-chu-giai" aria-hidden>
        {phe.map((p) => (
          <li key={p.lop}>
            <span className={`qt-o-mau ${p.lop}`} />
            {p.ten}
          </li>
        ))}
      </ul>
      {tong === 0 ? (
        <p className="phu">Chưa có ván nào kết thúc.</p>
      ) : (
        <div className="qt-thanh" role="img" aria-label={`Dân ${dan} ván, Sói ${soi} ván`}>
          {phe
            .filter((p) => p.so > 0)
            .map((p) => (
              <div
                key={p.lop}
                className={`qt-phan ${p.lop}`}
                style={{ flexGrow: p.so }}
                title={`${p.ten}: ${p.so} ván (${phan(p.so)}%)`}
              >
                <span className="qt-nhan-phan">
                  {p.so} · {phan(p.so)}%
                </span>
              </div>
            ))}
        </div>
      )}
      <table className="sr-only">
        <caption>Ván thắng theo phe</caption>
        <tbody>
          {phe.map((p) => (
            <tr key={p.lop}>
              <th scope="row">{p.ten}</th>
              <td>{p.so}</td>
              <td>{phan(p.so)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function TongQuan({ tq }: { tq: TongQuanCongKhai }) {
  const o = [
    { nhan: 'Ván đã kết thúc', so: tq.soVan },
    { nhan: 'Người chơi', so: tq.soNguoiChoi },
    { nhan: 'Báo cáo chờ xử lý', so: tq.soBaoCaoChoXuLy, nhanManh: tq.soBaoCaoChoXuLy > 0 },
    { nhan: 'Tài khoản bị khóa', so: tq.soTaiKhoanBiKhoa },
  ];
  return (
    <div className="qt-tong-quan">
      <div className="qt-o-luoi">
        {o.map((x) => (
          <div key={x.nhan} className={`hs-o-so ${x.nhanManh ? 'qt-nhan-manh' : ''}`}>
            <span className="hs-so">{x.so}</span>
            <span className="phu">{x.nhan}</span>
          </div>
        ))}
      </div>
      <ThanhPheThang dan={tq.soVanDanThang} soi={tq.soVanSoiThang} />
    </div>
  );
}

function TheBaoCao({
  bc,
  onXuLy,
}: {
  bc: BaoCaoCongKhai;
  onXuLy: (id: string, du: YeuCauXuLyBaoCao) => Promise<void>;
}) {
  const [ghiChu, setGhiChu] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const xuLy = async (quyetDinh: YeuCauXuLyBaoCao['quyetDinh']) => {
    setDangGui(true);
    setLoi(null);
    try {
      await onXuLy(bc.id, { quyetDinh, ghiChu });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không xử lý được.');
      setDangGui(false);
    }
  };
  return (
    <li className={`qt-bao-cao qt-bc-${bc.trangThai}`}>
      <div className="qt-bc-dau">
        <span>
          <b>{bc.nguoiBaoCao.ten}</b> báo cáo <b>{bc.nguoiBiBaoCao.ten}</b>
          {bc.nguoiBiBaoCao.biKhoa && <span className="ls-nhan ls-thua"> đang bị khóa</span>}
        </span>
        <span className={`ls-nhan qt-nhan-${bc.trangThai}`}>{TRANG_THAI[bc.trangThai]}</span>
      </div>
      <p className="qt-ly-do">“{bc.lyDo}”</p>
      <p className="phu">
        {NGAY.format(bc.ngayTao)} ·{' '}
        <Link to={`/lich-su/${bc.vanId}`} className="qt-lien-ket">
          Xem nhật ký ván <ExternalLink aria-hidden size={13} />
        </Link>
      </p>
      {bc.trangThai === 'CHO_XU_LY' ? (
        <div className="qt-quyet-dinh">
          <textarea
            className="qt-ghi-chu"
            placeholder="Ghi chú xử lý (tùy chọn)"
            value={ghiChu}
            maxLength={1000}
            onChange={(e) => setGhiChu(e.target.value)}
            aria-label={`Ghi chú xử lý báo cáo về ${bc.nguoiBiBaoCao.ten}`}
          />
          <div className="qt-nut">
            <Button variant="secondary" size="sm" disabled={dangGui} onClick={() => xuLy('BAC_BO')}>
              Bác bỏ
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={dangGui}
              onClick={() => xuLy('CANH_CAO')}
            >
              Cảnh cáo
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={dangGui}
              onClick={() => xuLy('KHOA_TAI_KHOAN')}
            >
              <Lock aria-hidden />
              Khóa tài khoản
            </Button>
          </div>
          {loi && (
            <p className="o-loi" role="alert">
              {loi}
            </p>
          )}
        </div>
      ) : (
        bc.ghiChuXuLy && <p className="ghi-chu">Ghi chú: {bc.ghiChuXuLy}</p>
      )}
    </li>
  );
}

function BangTaiKhoan({
  ds,
  toiId,
  onKhoa,
}: {
  ds: TaiKhoanQuanTri[];
  toiId: string;
  onKhoa: (id: string, biKhoa: boolean) => Promise<void>;
}) {
  const [loi, setLoi] = useState<string | null>(null);
  return (
    <>
      {loi && (
        <p className="o-loi" role="alert">
          {loi}
        </p>
      )}
      <table className="xh-bang">
        <thead>
          <tr>
            <th scope="col">Người chơi</th>
            <th scope="col">Tên đăng nhập</th>
            <th scope="col">Ván</th>
            <th scope="col">Trạng thái</th>
            <th scope="col">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ds.map((t) => (
            <tr key={t.id} className={t.biKhoa ? 'qt-bi-khoa' : ''}>
              <td>
                <span className="xh-o-ten">
                  <img
                    src={ANH_VAI[t.anhDaiDien as LoaiVaiCongKhai] ?? ANH_VAI.DanLang}
                    alt=""
                    draggable={false}
                  />
                  {t.bietDanh}
                </span>
              </td>
              <td className="phu">@{t.tenDangNhap}</td>
              <td className="xh-so">{t.soVanDaChoi}</td>
              <td>
                {t.laQuanTri ? (
                  <span className="ls-nhan ls-huy">Quản trị viên</span>
                ) : t.biKhoa ? (
                  <span className="ls-nhan ls-thua">Bị khóa</span>
                ) : (
                  <span className="ls-nhan ls-thang">Hoạt động</span>
                )}
              </td>
              <td>
                {!t.laQuanTri && t.id !== toiId && (
                  <Button
                    variant={t.biKhoa ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setLoi(null);
                      onKhoa(t.id, !t.biKhoa).catch((e: Error) => setLoi(e.message));
                    }}
                  >
                    {t.biKhoa ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
                    {t.biKhoa ? 'Mở khóa' : 'Khóa'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * MH11 — quản trị (AC03): bảng điều khiển (UC24), xem xét báo cáo (UC22), khóa / mở khóa tài
 * khoản (UC23). Máy chủ kiểm quyền ở từng lời gọi; giao diện chỉ ẩn trang với người thường.
 */
export function QuanTri() {
  const phien = useKho((s) => s.phien)!;
  const [tq, setTq] = useState<TongQuanCongKhai | null>(null);
  const [baoCao, setBaoCao] = useState<BaoCaoCongKhai[]>([]);
  const [taiKhoan, setTaiKhoan] = useState<TaiKhoanQuanTri[]>([]);
  const [chiCho, setChiCho] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        goiApi<TongQuanCongKhai>('/quan-tri/tong-quan'),
        goiApi<BaoCaoCongKhai[]>('/quan-tri/bao-cao'),
        goiApi<TaiKhoanQuanTri[]>('/quan-tri/tai-khoan'),
      ]);
      setTq(a);
      setBaoCao(b);
      setTaiKhoan(c);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không tải được dữ liệu quản trị.');
    }
  }, []);
  useEffect(() => {
    if (phien.laQuanTri) void tai();
  }, [phien.laQuanTri, tai]);

  if (!phien.laQuanTri) return <Navigate to="/" replace />;

  const xuLy = async (id: string, du: YeuCauXuLyBaoCao) => {
    await goiApi(`/quan-tri/bao-cao/${id}`, 'POST', du);
    await tai();
  };
  const khoa = async (id: string, biKhoa: boolean) => {
    await goiApi(`/quan-tri/tai-khoan/${id}/khoa`, 'POST', { biKhoa });
    await tai();
  };
  const dsBaoCao = chiCho ? baoCao.filter((b) => b.trangThai === 'CHO_XU_LY') : baoCao;

  return (
    <main className="trang-chu">
      <header className="tc-chao">
        <p className="tc-loi-chao">Nhà trưởng làng</p>
        <h1 className="tc-tieu-de">Quản trị</h1>
      </header>
      {loi && (
        <p className="o-loi" role="alert">
          {loi}
        </p>
      )}
      {!tq ? (
        !loi && <p className="phu">Đang mở sổ của trưởng làng…</p>
      ) : (
        <Tabs defaultValue="tong-quan" className="qt-tabs">
          <TabsList>
            <TabsTrigger value="tong-quan">Tổng quan</TabsTrigger>
            <TabsTrigger value="bao-cao">
              Báo cáo{tq.soBaoCaoChoXuLy > 0 ? ` (${tq.soBaoCaoChoXuLy})` : ''}
            </TabsTrigger>
            <TabsTrigger value="tai-khoan">Tài khoản</TabsTrigger>
          </TabsList>

          <TabsContent value="tong-quan" className="pc-noi-tab">
            <TongQuan tq={tq} />
          </TabsContent>

          <TabsContent value="bao-cao" className="pc-noi-tab">
            <label className="pc-cong-khai">
              <input
                type="checkbox"
                checked={chiCho}
                onChange={(e) => setChiCho(e.target.checked)}
              />
              Chỉ hiện báo cáo chờ xử lý
            </label>
            {dsBaoCao.length === 0 ? (
              <p className="tc-trong">Không có báo cáo nào {chiCho ? 'đang chờ' : ''}.</p>
            ) : (
              <ul className="qt-ds-bao-cao">
                {dsBaoCao.map((b) => (
                  <TheBaoCao key={b.id} bc={b} onXuLy={xuLy} />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="tai-khoan" className="pc-noi-tab">
            <BangTaiKhoan ds={taiKhoan} toiId={phien.id} onKhoa={khoa} />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
