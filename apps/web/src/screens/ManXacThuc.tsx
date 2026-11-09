import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { GodRays } from '@paper-design/shaders-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MagicCard } from '@/components/ui/magic-card';
import { TextEffect } from '@/components/ui/text-effect';
import { ANH_TRANG, ANH_VAI } from '@/game/anhVai';
import { TEN_VAI } from '@/game/hienThi';

export type CheDo = 'dang-nhap' | 'dang-ky';

/*
 * Ràng buộc hiển thị phía trình duyệt — chỉ để báo lỗi sớm. Máy chủ (ROADMAP 4.2) mới là nơi
 * quyết định; các giới hạn này là đề xuất, cần nhóm xác nhận khi làm 4.2.
 */
const TEN_DANG_NHAP = /^[a-z0-9_]{3,20}$/;
const MAT_KHAU_TOI_THIEU = 8;

interface Loi {
  tenDangNhap?: string;
  tenHienThi?: string;
  matKhau?: string;
  nhapLai?: string;
}

function kiemTra(cheDo: CheDo, du: Record<string, string>): Loi {
  const loi: Loi = {};
  if (!TEN_DANG_NHAP.test(du.tenDangNhap ?? '')) {
    loi.tenDangNhap = '3–20 ký tự: chữ thường không dấu, số, gạch dưới.';
  }
  if ((du.matKhau ?? '').length < MAT_KHAU_TOI_THIEU) {
    loi.matKhau = `Ít nhất ${MAT_KHAU_TOI_THIEU} ký tự.`;
  }
  if (cheDo === 'dang-ky') {
    const ten = (du.tenHienThi ?? '').trim();
    if (ten.length < 2 || ten.length > 24) loi.tenHienThi = 'Tên ở làng dài 2–24 ký tự.';
    if (du.nhapLai !== du.matKhau) loi.nhapLai = 'Hai mật khẩu chưa khớp.';
  }
  return loi;
}

const QUAT: LoaiVaiCongKhai[] = ['DanLang', 'BaoVe', 'TienTri', 'Soi', 'PhuThuy', 'ThoSan'];

/** Sáu lá thẻ xòe ra như bài trên tay — rê chuột thì quạt bung, lá đang trỏ nhấc lên. */
function QuatThe() {
  const giam = useReducedMotion();
  const [dangTro, setDangTro] = useState<number | null>(null);
  const [bung, setBung] = useState(false);
  return (
    <div
      className="quat-the"
      onPointerEnter={() => setBung(true)}
      onPointerLeave={() => {
        setBung(false);
        setDangTro(null);
      }}
    >
      {QUAT.map((vai, i) => {
        const giua = i - (QUAT.length - 1) / 2;
        const goc = giua * (bung ? 9 : 6);
        return (
          <motion.figure
            key={vai}
            className="quat-la"
            style={{ ['--mau-vai' as string]: `var(--vai-${vai})`, zIndex: dangTro === i ? 10 : i }}
            initial={giam ? false : { y: 260, rotate: 0, opacity: 0 }}
            animate={{
              y: dangTro === i ? -46 : Math.abs(giua) * (bung ? 14 : 8),
              x: giua * (bung ? 58 : 36),
              rotate: goc,
              opacity: 1,
              scale: dangTro === i ? 1.06 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 170,
              damping: 20,
              delay: giam ? 0 : bung || dangTro !== null ? 0 : 0.35 + i * 0.08,
            }}
            onPointerEnter={() => setDangTro(i)}
          >
            <img src={ANH_VAI[vai]} alt="" draggable={false} />
            <figcaption className={dangTro === i ? 'quat-ten-hien' : ''}>{TEN_VAI[vai]}</figcaption>
          </motion.figure>
        );
      })}
    </div>
  );
}

function O({
  id,
  nhan,
  loi,
  ...input
}: { id: string; nhan: string; loi: string | undefined } & React.ComponentProps<typeof Input>) {
  return (
    <div className="o-nhap">
      <Label htmlFor={id}>{nhan}</Label>
      <Input
        id={id}
        aria-invalid={loi ? true : undefined}
        aria-describedby={loi ? `${id}-loi` : undefined}
        {...input}
      />
      {loi && (
        <p id={`${id}-loi`} className="o-loi" role="alert">
          {loi}
        </p>
      )}
    </div>
  );
}

/**
 * MH01 — đăng nhập (UC02) và đăng ký (UC01). Chỉ là giao diện: máy chủ tài khoản thuộc Giai
 * đoạn 4 (4.1–4.2), nên gửi biểu mẫu chỉ kiểm dữ liệu nhập rồi dẫn vào ván mẫu.
 */
export function ManXacThuc({ cheDo }: { cheDo: CheDo }) {
  const di = useNavigate();
  const giam = useReducedMotion();
  const idGoc = useId();
  const [loi, setLoi] = useState<Loi>({});
  const [dangGui, setDangGui] = useState(false);
  const dangKy = cheDo === 'dang-ky';

  const gui = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const du = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const l = kiemTra(cheDo, du);
    setLoi(l);
    if (Object.keys(l).length) return;
    setDangGui(true);
    setTimeout(() => di('/van-mau'), 900);
  };

  return (
    <main className="man-xac-thuc" data-thoi="dem">
      <GodRays
        className="nen-tia-trang"
        colorBack="#060a14"
        colorBloom="#3a4a6e"
        colors={['#5d7096', '#9fb4d8', '#8a7a5a']}
        density={0.3}
        spotty={0.3}
        midSize={0.22}
        midIntensity={0.45}
        intensity={0.32}
        bloom={0.2}
        speed={giam ? 0 : 0.35}
        offsetX={-0.35}
        offsetY={-0.55}
      />
      <img className="trang-xt" src={ANH_TRANG} alt="" draggable={false} />

      <section className="xt-trai" aria-label="Giới thiệu">
        <TextEffect as="h1" per="char" preset="blur" className="xt-ten">
          Làng Trăng Mờ
        </TextEffect>
        <TextEffect as="p" per="word" preset="fade" delay={0.6} className="xt-mo-ta">
          Ma Sói trên web — máy làm quản trò, bạn chỉ việc nghi ngờ.
        </TextEffect>
        <QuatThe />
      </section>

      <motion.section
        className="xt-phai"
        initial={giam ? false : { opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 22, delay: giam ? 0 : 0.2 }}
      >
        <MagicCard
          className="the-xac-thuc"
          gradientFrom="#e6a646"
          gradientTo="#9fb4d8"
          gradientColor="#1d2638"
        >
          <div className="xt-noi-dung">
            <LayoutGroup>
              <nav className="xt-tab" aria-label="Đăng nhập hoặc đăng ký">
                {(['dang-nhap', 'dang-ky'] as const).map((c) => (
                  <Link
                    key={c}
                    to={`/${c}`}
                    className="xt-tab-nut"
                    aria-current={cheDo === c ? 'page' : undefined}
                  >
                    {c === 'dang-nhap' ? 'Đăng nhập' : 'Đăng ký'}
                    {cheDo === c && <motion.span layoutId="gach-tab" className="xt-tab-gach" />}
                  </Link>
                ))}
              </nav>
            </LayoutGroup>

            <h2 className="xt-tieu-de">{dangKy ? 'Dọn về làng' : 'Trở lại làng'}</h2>
            <p className="phu">
              {dangKy ? 'Tạo tài khoản để vào phòng cùng bạn bè.' : 'Đăng nhập để vào phòng chơi.'}
            </p>

            <form className="xt-form" onSubmit={gui} noValidate key={cheDo}>
              <O
                id={`${idGoc}-ten`}
                name="tenDangNhap"
                nhan="Tên đăng nhập"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                loi={loi.tenDangNhap}
                placeholder="vd. ngan_trang"
              />
              {dangKy && (
                <O
                  id={`${idGoc}-hien-thi`}
                  name="tenHienThi"
                  nhan="Tên trong làng"
                  autoComplete="nickname"
                  loi={loi.tenHienThi}
                  placeholder="Tên người khác nhìn thấy"
                />
              )}
              <O
                id={`${idGoc}-mk`}
                name="matKhau"
                type="password"
                nhan="Mật khẩu"
                autoComplete={dangKy ? 'new-password' : 'current-password'}
                loi={loi.matKhau}
              />
              {dangKy && (
                <O
                  id={`${idGoc}-nhap-lai`}
                  name="nhapLai"
                  type="password"
                  nhan="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  loi={loi.nhapLai}
                />
              )}
              <Button type="submit" size="lg" className="xt-gui" disabled={dangGui}>
                {dangGui ? 'Đang mở cổng làng…' : dangKy ? 'Tạo tài khoản' : 'Vào làng'}
              </Button>
            </form>

            <p className="ghi-chu">
              Bản giao diện: máy chủ tài khoản làm ở Giai đoạn 4, nên lúc này chỉ kiểm dữ liệu nhập
              rồi mở ván mẫu.
            </p>
          </div>
        </MagicCard>
      </motion.section>
    </main>
  );
}
