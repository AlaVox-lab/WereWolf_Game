import type { PhongCongKhai, TomTatPhong } from '@moonvillage/shared';
import { DoorOpen, RefreshCw, Users } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { BorderBeam } from '@/components/ui/border-beam';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { MagicCard } from '@/components/ui/magic-card';
import { ANH_VAI } from '@/game/anhVai';
import { goiApi } from '@/lib/api';
import { useKho } from '@/realtime/kho';

/** Độ dài mã phòng và bộ chữ máy chủ dùng (không có I, L, O, 0, 1 để khỏi đọc nhầm). */
const DO_DAI_MA = 6;
const MAU_MA = '^[a-hjkmnp-zA-HJKMNP-Z2-9]*$';
const NHIP_LAM_MOI = 5000;

/** Hàng ghế nhỏ: chấm sáng là ghế đã có người. */
function HangGhe({ co, toiDa }: { co: number; toiDa: number }) {
  return (
    <span className="tc-hang-ghe" aria-label={`${co} trên ${toiDa} người`}>
      {Array.from({ length: toiDa }, (_, i) => (
        <span key={i} className={i < co ? 'tc-ghe tc-ghe-co' : 'tc-ghe'} />
      ))}
    </span>
  );
}

/**
 * MH02 — trang chủ. Dựng phòng mới (UC06), vào phòng bằng mã sáu ký tự (UC07), danh sách phòng
 * công khai đang chờ. Mọi kiểm tra (mã có thật, phòng đầy, đã bắt đầu) do máy chủ trả lời.
 */
export function TrangChu() {
  const di = useNavigate();
  const thongBao = (useLocation().state as { thongBao?: string } | null)?.thongBao;
  const giam = useReducedMotion();
  const phien = useKho((s) => s.phien)!;
  const [ds, setDs] = useState<TomTatPhong[] | null>(null);
  const [phongCu, setPhongCu] = useState<PhongCongKhai | null>(null);
  const [ma, setMa] = useState('');
  const [loiMa, setLoiMa] = useState<string | null>(null);
  const [loiTao, setLoiTao] = useState<string | null>(null);
  const [dangTao, setDangTao] = useState(false);
  const [dangVao, setDangVao] = useState(false);
  const [dangTai, setDangTai] = useState(false);

  const taiDanhSach = useCallback(async () => {
    setDangTai(true);
    try {
      setDs(await goiApi<TomTatPhong[]>('/phong'));
    } catch {
      // Giữ danh sách cũ; lần làm mới sau thử lại.
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    goiApi<PhongCongKhai | null>('/phong-cua-toi').then(setPhongCu, () => setPhongCu(null));
    void taiDanhSach();
    const hen = setInterval(() => {
      if (document.visibilityState === 'visible') void taiDanhSach();
    }, NHIP_LAM_MOI);
    return () => clearInterval(hen);
  }, [taiDanhSach]);

  const dungPhong = async () => {
    setDangTao(true);
    setLoiTao(null);
    try {
      const p = await goiApi<PhongCongKhai>('/phong', 'POST');
      di(`/phong/${p.maPhong}`);
    } catch (e) {
      setLoiTao(e instanceof Error ? e.message : 'Không dựng được phòng.');
      setDangTao(false);
    }
  };

  const vao = async (maPhong: string) => {
    const chuan = maPhong.toUpperCase();
    if (chuan.length !== DO_DAI_MA) {
      setLoiMa('Mã phòng có sáu ký tự.');
      return;
    }
    setDangVao(true);
    setLoiMa(null);
    try {
      // Hỏi trước để báo lỗi ngay ở đây, khỏi chuyển trang rồi mới biết mã sai.
      await goiApi<PhongCongKhai>(`/phong/${chuan}`);
      di(`/phong/${chuan}`);
    } catch (e) {
      setLoiMa(e instanceof Error ? e.message : 'Không tìm được phòng.');
      setDangVao(false);
    }
  };

  const guiMa = (e: FormEvent) => {
    e.preventDefault();
    void vao(ma);
  };

  const hienLen = (tre: number) =>
    giam
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { type: 'spring' as const, stiffness: 150, damping: 22, delay: tre },
        };

  return (
    <main className="trang-chu">
      <motion.header className="tc-chao" {...hienLen(0)}>
        <p className="tc-loi-chao">Chào {phien.bietDanh},</p>
        <h1 className="tc-tieu-de">Đêm nay làng họp ở đâu?</h1>
        {thongBao && (
          <p className="tc-phong-cu" role="status">
            {thongBao}
          </p>
        )}
        {phongCu && (
          <p className="tc-phong-cu" role="status">
            Bạn vẫn đang ngồi trong phòng <b>{phongCu.maPhong}</b>.{' '}
            <Link to={`/phong/${phongCu.maPhong}`}>Trở lại bàn</Link>
          </p>
        )}
      </motion.header>

      <div className="tc-luoi">
        <motion.div {...hienLen(0.08)}>
          <MagicCard
            className="tc-the"
            gradientFrom="#e6a646"
            gradientTo="#c4452f"
            gradientColor="#241a12"
          >
            <div className="tc-the-noi tc-tao">
              <div className="tc-xap-the" aria-hidden>
                {(['Soi', 'TienTri', 'DanLang'] as const).map((v, i) => (
                  <img
                    key={v}
                    src={ANH_VAI[v]}
                    alt=""
                    style={{
                      ['--mau-vai' as string]: `var(--vai-${v})`,
                      ['--lech' as string]: i - 1,
                    }}
                    draggable={false}
                  />
                ))}
              </div>
              <div className="tc-the-chu">
                <h2>Dựng phòng mới</h2>
                <p className="tc-mo-ta">
                  Bạn làm chủ phòng: chọn bộ vai, bật tắt luật, rồi gửi mã sáu ký tự cho bạn bè.
                </p>
                <Button size="lg" onClick={dungPhong} disabled={dangTao} className="tc-nut-chinh">
                  <DoorOpen aria-hidden />
                  {dangTao ? 'Đang kê bàn…' : 'Dựng phòng'}
                </Button>
                {loiTao && (
                  <p className="o-loi" role="alert">
                    {loiTao}
                  </p>
                )}
              </div>
            </div>
            {!giam && <BorderBeam size={120} duration={9} colorFrom="#e6a646" colorTo="#c4452f" />}
          </MagicCard>
        </motion.div>

        <motion.div {...hienLen(0.16)}>
          <MagicCard
            className="tc-the"
            gradientFrom="#9fb4d8"
            gradientTo="#e6a646"
            gradientColor="#141c2b"
          >
            <form className="tc-the-noi tc-ma" onSubmit={guiMa}>
              <h2>Vào bằng mã</h2>
              <p className="tc-mo-ta">
                Chủ phòng gửi bạn một mã như <code>K7MQ2P</code>.
              </p>
              <InputOTP
                maxLength={DO_DAI_MA}
                pattern={MAU_MA}
                value={ma}
                onChange={(v) => {
                  setMa(v.toUpperCase());
                  setLoiMa(null);
                }}
                onComplete={(v: string) => void vao(v)}
                aria-label="Mã phòng sáu ký tự"
                aria-invalid={loiMa ? true : undefined}
                containerClassName="tc-o-ma"
              >
                <InputOTPGroup>
                  {Array.from({ length: DO_DAI_MA }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="tc-o-ma-ky-tu" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                disabled={dangVao || ma.length !== DO_DAI_MA}
              >
                {dangVao ? 'Đang gõ cửa…' : 'Vào phòng'}
              </Button>
              {loiMa && (
                <p className="o-loi" role="alert">
                  {loiMa}
                </p>
              )}
            </form>
          </MagicCard>
        </motion.div>
      </div>

      <motion.section
        className="tc-cong-khai"
        aria-labelledby="tc-cong-khai-tieu-de"
        {...hienLen(0.24)}
      >
        <div className="tc-cong-khai-dau">
          <h2 id="tc-cong-khai-tieu-de">Phòng đang mở cửa</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void taiDanhSach()}
            disabled={dangTai}
            aria-label="Làm mới danh sách phòng"
          >
            <RefreshCw aria-hidden className={dangTai ? 'tc-xoay' : ''} />
            Làm mới
          </Button>
        </div>

        {ds === null ? (
          <p className="phu">Đang nhìn quanh làng…</p>
        ) : ds.length === 0 ? (
          <p className="tc-trong">
            Chưa phòng nào mở cửa. Dựng một phòng rồi bật <b>Công khai</b> trong phòng chờ để người
            khác thấy ở đây.
          </p>
        ) : (
          <ul className="tc-ds-phong">
            <AnimatePresence initial={false}>
              {ds.map((p) => (
                <motion.li
                  key={p.maPhong}
                  layout={!giam}
                  initial={giam ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={giam ? {} : { opacity: 0, x: 16 }}
                  className="tc-dong-phong"
                >
                  <div className="tc-dong-chu">
                    <span className="tc-ten-chu">Bàn của {p.tenChuPhong}</span>
                    <span className="tc-ma-nho">{p.maPhong}</span>
                  </div>
                  <span className="tc-so-nguoi">
                    <Users aria-hidden size={16} />
                    {p.soNguoi}/{p.soNguoiToiDa}
                  </span>
                  <HangGhe co={p.soNguoi} toiDa={p.soNguoiToiDa} />
                  <Button size="sm" onClick={() => void vao(p.maPhong)} disabled={dangVao}>
                    Ngồi vào
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      <p className="ghi-chu tc-chan">
        Mới tới làng? <Link to="/van-mau">Xem một ván mẫu</Link> chơi bằng người chơi ảo trước đã.
      </p>
    </main>
  );
}
