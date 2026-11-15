import type { LoaiVaiCongKhai, PhongCongKhai, ThanhVienCongKhai } from '@moonvillage/shared';
import {
  Bot,
  Check,
  Copy,
  Crown,
  LogOut,
  Minus,
  Play,
  Plus,
  Sparkles,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ANH_VAI } from '@/game/anhVai';
import { TEN_VAI } from '@/game/hienThi';
import { guiLenh } from '@/realtime/ketNoi';
import { useKho } from '@/realtime/kho';

const THU_TU_VAI: LoaiVaiCongKhai[] = ['Soi', 'DanLang', 'BaoVe', 'TienTri', 'PhuThuy', 'ThoSan'];

/** Đổi mã vai nội bộ trong câu máy chủ gửi (vd. "2 ThoSan, tối đa 1") sang tên hiển thị. */
function vietLai(chiTiet: string): string {
  const cau = THU_TU_VAI.reduce((s, v) => s.replaceAll(v, TEN_VAI[v]), chiTiet);
  return cau.charAt(0).toUpperCase() + cau.slice(1);
}

/** Một ghế quanh bàn: tranh thẻ làm ảnh, vương miện cho chủ phòng, nút loại cho chủ phòng. */
function Ghe({
  tv,
  goc,
  laToi,
  coTheLoai,
  onLoai,
}: {
  tv: ThanhVienCongKhai | undefined;
  goc: number;
  laToi: boolean;
  coTheLoai: boolean;
  onLoai: () => void;
}) {
  const giam = useReducedMotion();
  return (
    <li className="pc-ghe" style={{ ['--goc' as string]: `${goc}deg` }}>
      <AnimatePresence mode="popLayout">
        {tv ? (
          <motion.div
            key={tv.id}
            className={`pc-nguoi${tv.ketNoi ? '' : ' pc-mat-ket-noi'}${laToi ? ' pc-la-toi' : ''}`}
            initial={giam ? false : { scale: 0.4, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={giam ? {} : { scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <span className="pc-anh">
              <img
                src={ANH_VAI[tv.anhDaiDien as LoaiVaiCongKhai] ?? ANH_VAI.DanLang}
                alt=""
                draggable={false}
              />
              {tv.laChuPhong && (
                <Crown className="pc-huy-hieu pc-vuong-mien" aria-label="Chủ phòng" />
              )}
              {tv.laNguoiChoiAo && (
                <Bot className="pc-huy-hieu pc-bot" aria-label="Người chơi ảo" />
              )}
              {coTheLoai && (
                <button
                  type="button"
                  className="pc-nut-loai"
                  onClick={onLoai}
                  aria-label={`Mời ${tv.ten} ra khỏi phòng`}
                >
                  <X aria-hidden size={14} />
                </button>
              )}
            </span>
            <span className="pc-ten">
              {tv.ten}
              {laToi && <span className="pc-ban"> (bạn)</span>}
            </span>
            {!tv.ketNoi && <span className="pc-trang-thai">mất kết nối</span>}
          </motion.div>
        ) : (
          <motion.span
            key="trong"
            className="pc-ghe-trong"
            initial={giam ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            aria-hidden
          />
        )}
      </AnimatePresence>
    </li>
  );
}

/** Nút sao chép liên kết mời (UC09) — mở liên kết là vào thẳng phòng sau khi đăng nhập. */
function NutMoi({ maPhong }: { maPhong: string }) {
  const [daChep, setDaChep] = useState(false);
  const chep = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/phong/${maPhong}`);
      setDaChep(true);
      setTimeout(() => setDaChep(false), 1800);
    } catch {
      // Trình duyệt chặn clipboard — mã phòng vẫn hiện to giữa bàn để đọc cho nhau.
    }
  };
  return (
    <Button variant="secondary" size="sm" onClick={chep} className="pc-nut-moi">
      {daChep ? <Check aria-hidden /> : <Copy aria-hidden />}
      {daChep ? 'Đã chép liên kết' : 'Chép liên kết mời'}
    </Button>
  );
}

/** MH03b — bộ vai và sáu quy tắc. Chủ phòng chỉnh được; người khác xem bản tóm tắt. */
function BangCauHinh({
  phong,
  laChu,
  lam,
}: {
  phong: PhongCongKhai;
  laChu: boolean;
  lam: (viec: () => Promise<void>) => void;
}) {
  // Bản nháp tại chỗ để bấm nhanh nhiều lần không bị ghi đè bởi ảnh chụp cũ; máy chủ gửi lại
  // ảnh chụp mới thì nháp theo ảnh chụp đó.
  const [nhap, setNhap] = useState(phong.cauHinhVai);
  const nhapMoiNhat = useRef(phong.cauHinhVai);
  const banMayChu = JSON.stringify(phong.cauHinhVai);
  useEffect(() => {
    const ban = JSON.parse(banMayChu) as PhongCongKhai['cauHinhVai'];
    nhapMoiNhat.current = ban;
    setNhap(ban);
  }, [banMayChu]);

  const doi = (vai: LoaiVaiCongKhai, buoc: number) => {
    const cu = nhapMoiNhat.current;
    const moi = { ...cu, [vai]: Math.max(0, (cu[vai] ?? 0) + buoc) };
    nhapMoiNhat.current = moi;
    setNhap(moi);
    lam(() => guiLenh('phong:cau-hinh-vai', { soLuong: moi }));
  };
  const tong = THU_TU_VAI.reduce((s, v) => s + (nhap[v] ?? 0), 0);
  const soNguoi = phong.thanhVien.length;

  return (
    <Tabs defaultValue="vai" className="pc-bang">
      <TabsList className="pc-tab">
        <TabsTrigger value="vai">Bộ vai</TabsTrigger>
        <TabsTrigger value="luat">Luật chơi</TabsTrigger>
      </TabsList>

      <TabsContent value="vai" className="pc-noi-tab">
        <div className="pc-tong">
          <span>
            <b className={tong === soNguoi ? 'pc-khop' : 'pc-lech'}>{tong}</b> vai cho{' '}
            <b>{soNguoi}</b> người
          </span>
          {laChu && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => lam(() => guiLenh('phong:goi-y-vai', {}))}
            >
              <Sparkles aria-hidden />
              Gợi ý theo số người
            </Button>
          )}
        </div>
        <ul className="pc-ds-vai">
          {THU_TU_VAI.map((vai) => {
            const so = nhap[vai] ?? 0;
            const loi = phong.viPham.some((v) => v.loaiVai === vai);
            return (
              <li
                key={vai}
                className={`pc-dong-vai${so === 0 ? ' pc-vai-tat' : ''}${loi ? ' pc-vai-loi' : ''}`}
                style={{ ['--mau-vai' as string]: `var(--vai-${vai})` }}
              >
                <img src={ANH_VAI[vai]} alt="" className="pc-anh-vai" draggable={false} />
                <span className="pc-ten-vai">{TEN_VAI[vai]}</span>
                {laChu ? (
                  <span className="pc-buoc" role="group" aria-label={`Số ${TEN_VAI[vai]}`}>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => doi(vai, -1)}
                      disabled={so === 0}
                      aria-label={`Bớt một ${TEN_VAI[vai]}`}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <output className="pc-so" aria-live="polite">
                      {so}
                    </output>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => doi(vai, 1)}
                      aria-label={`Thêm một ${TEN_VAI[vai]}`}
                    >
                      <Plus aria-hidden />
                    </Button>
                  </span>
                ) : (
                  <output className="pc-so">× {so}</output>
                )}
              </li>
            );
          })}
        </ul>
      </TabsContent>

      <TabsContent value="luat" className="pc-noi-tab">
        <p className="ghi-chu">
          {laChu
            ? 'Sáu luật chủ phòng được bật tắt. Tám luật còn lại cố định cho mọi ván.'
            : 'Chủ phòng đang chọn các luật này cho ván tới.'}
        </p>
        <ul className="pc-ds-luat">
          {phong.boLuat.map((q) => (
            <li key={q.ma} className="pc-dong-luat">
              <label htmlFor={`luat-${q.ma}`} className="pc-noi-dung-luat">
                <span className="pc-ma-luat">{q.ma}</span>
                {q.noiDung}
              </label>
              <Switch
                id={`luat-${q.ma}`}
                checked={q.dangBat}
                disabled={!laChu}
                onCheckedChange={(bat) =>
                  lam(() => guiLenh('phong:cau-hinh-luat', { ma: q.ma, dangBat: bat }))
                }
              />
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}

/**
 * MH03 phòng chờ (UC07–UC11, UC25). Vào phòng bằng `phong:vao` khi mở đường dẫn — nên liên kết
 * mời cũng chính là đường dẫn này. Mọi kiểm tra (đủ người, bộ vai hợp lệ, quyền chủ phòng) do
 * máy chủ làm; giao diện chỉ hiện `viPham` máy chủ gửi kèm ảnh chụp phòng.
 */
export function PhongCho() {
  const { ma = '' } = useParams();
  const maPhong = ma.toUpperCase();
  const di = useNavigate();
  const giam = useReducedMotion();
  const phien = useKho((s) => s.phien)!;
  const phong = useKho((s) => s.phong);
  const ketNoi = useKho((s) => s.ketNoi);
  const [loiVao, setLoiVao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangLam, setDangLam] = useState(false);
  const daVao = useRef(false);
  const dangRoi = useRef(false);
  const dangO = phong?.maPhong === maPhong;

  useEffect(() => {
    if (dangRoi.current) return;
    if (dangO) {
      daVao.current = true;
      return;
    }
    if (daVao.current) {
      // Đang ngồi thì bị mời ra, hoặc phòng đóng — về trang chủ kèm lời báo.
      di('/', { replace: true, state: { thongBao: `Bạn không còn ở phòng ${maPhong}.` } });
      return;
    }
    if (ketNoi !== 'da-noi' || loiVao) return;
    guiLenh('phong:vao', { maPhong }).catch((e: Error) => setLoiVao(e.message));
  }, [dangO, ketNoi, maPhong, loiVao, di]);

  const lam = (viec: () => Promise<void>) => {
    setLoi(null);
    viec().catch((e: Error) => setLoi(e.message));
  };

  const roi = async () => {
    setDangLam(true);
    dangRoi.current = true;
    await guiLenh('phong:roi', {}).catch(() => undefined);
    di('/', { replace: true });
  };

  if (loiVao) {
    return (
      <main className="trang-chu">
        <header className="tc-chao">
          <p className="tc-loi-chao">Phòng {maPhong}</p>
          <h1 className="tc-tieu-de">Cửa phòng không mở.</h1>
          <p className="o-loi xt-loi-chung" role="alert">
            {loiVao}
          </p>
          <p>
            <Link to="/">Về trang chủ</Link>
          </p>
        </header>
      </main>
    );
  }

  if (!phong || !dangO) {
    return (
      <main className="trang-chu">
        <p className="phu">Đang gõ cửa phòng {maPhong}…</p>
      </main>
    );
  }

  if (phong.vanId) {
    // Màn trong ván nối ở 5.5–5.10.
    return (
      <main className="trang-chu">
        <header className="tc-chao">
          <p className="tc-loi-chao">Phòng {maPhong}</p>
          <h1 className="tc-tieu-de">Ván đã bắt đầu.</h1>
        </header>
      </main>
    );
  }

  const laChu = phong.chuPhongId === phien.id;
  const soNguoi = phong.thanhVien.length;
  const coAo = phong.thanhVien.some((t) => t.laNguoiChoiAo);
  const ghe = Array.from({ length: phong.soNguoiToiDa }, (_, i) => phong.thanhVien[i]);
  const chuPhong = phong.thanhVien.find((t) => t.laChuPhong);

  return (
    <main className="phong-cho">
      <motion.header
        className="pc-dau"
        initial={giam ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className="tc-loi-chao">Phòng chờ</p>
          <h1 className="pc-tieu-de">Bàn của {chuPhong?.ten ?? '…'}</h1>
        </div>
        <div className="pc-dau-nut">
          {laChu && (
            <label className="pc-cong-khai">
              <Switch
                checked={phong.congKhai}
                onCheckedChange={(bat) => lam(() => guiLenh('phong:cong-khai', { congKhai: bat }))}
              />
              Công khai ở trang chủ
            </label>
          )}
          <Button variant="ghost" size="sm" onClick={roi} disabled={dangLam}>
            <LogOut aria-hidden />
            Rời phòng
          </Button>
        </div>
      </motion.header>

      <div className="pc-luoi">
        <section className="pc-ban-tron" aria-label="Thành viên quanh bàn">
          <div className="pc-mat-ban">
            <span className="pc-nhan-ma">Mã phòng</span>
            <span className="pc-ma">{phong.maPhong}</span>
            <span className="pc-dem">
              <NumberTicker value={soNguoi} startValue={0} className="pc-dem-so" />
              <span>/{phong.soNguoiToiDa} người</span>
            </span>
            <NutMoi maPhong={phong.maPhong} />
          </div>
          <ul className="pc-ds-ghe">
            {ghe.map((tv, i) => (
              <Ghe
                key={i}
                tv={tv}
                goc={(360 / phong.soNguoiToiDa) * i}
                laToi={tv?.id === phien.id}
                coTheLoai={laChu && !!tv && tv.id !== phien.id}
                onLoai={() => tv && lam(() => guiLenh('phong:loai', { taiKhoanId: tv.id }))}
              />
            ))}
          </ul>
        </section>

        <section className="pc-ben-phai">
          <BangCauHinh phong={phong} laChu={laChu} lam={lam} />

          {laChu && phong.choPhepNguoiChoiAo && (
            <div className="pc-nguoi-ao">
              <span className="ghi-chu">Thiếu người? Thêm người chơi ảo ngồi cùng bàn.</span>
              <span className="pc-nguoi-ao-nut">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => lam(() => guiLenh('phong:bot-nguoi-ao', {}))}
                  disabled={!coAo}
                >
                  <UserMinus aria-hidden />
                  Bớt
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => lam(() => guiLenh('phong:them-nguoi-ao', {}))}
                  disabled={soNguoi >= phong.soNguoiToiDa}
                >
                  <UserPlus aria-hidden />
                  Thêm người ảo
                </Button>
              </span>
            </div>
          )}

          <div className="pc-bat-dau">
            {phong.viPham.length > 0 ? (
              <ul className="pc-vi-pham" aria-label="Chưa bắt đầu được vì">
                {phong.viPham.map((v, i) => (
                  <li key={`${v.ma}-${i}`}>{vietLai(v.chiTiet)}</li>
                ))}
              </ul>
            ) : (
              <p className="pc-san-sang">
                Bàn đã đủ — {laChu ? 'bắt đầu khi bạn muốn.' : 'chờ chủ phòng bắt đầu.'}
              </p>
            )}
            {laChu ? (
              <Button
                size="lg"
                className="pc-nut-bat-dau"
                disabled={phong.viPham.length > 0}
                onClick={() => lam(() => guiLenh('phong:bat-dau', {}))}
              >
                <Play aria-hidden />
                Bắt đầu ván
              </Button>
            ) : (
              <p className="ghi-chu">Chỉ chủ phòng đổi được bộ vai, luật và bắt đầu ván.</p>
            )}
            {loi && (
              <p className="o-loi" role="alert">
                {loi}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
