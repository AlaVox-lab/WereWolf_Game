import type { HoSoCongKhai, LoaiVaiCongKhai } from '@moonvillage/shared';
import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ANH_VAI, NGUON_VAI } from '@/game/anhVai';
import { TEN_VAI } from '@/game/hienThi';
import { goiApi } from '@/lib/api';
import { useKho } from '@/realtime/kho';

const CAC_ANH: LoaiVaiCongKhai[] = ['DanLang', 'BaoVe', 'TienTri', 'PhuThuy', 'ThoSan', 'Soi'];

/**
 * MH09 — hồ sơ (UC03): đổi biệt danh và ảnh đại diện (một trong sáu tranh thẻ vai), xem số ván
 * và tỉ lệ thắng. Máy chủ kiểm lại biệt danh (2–24 ký tự) và mã tranh.
 */
export function HoSo() {
  const giam = useReducedMotion();
  const idGoc = useId();
  const phien = useKho((s) => s.phien)!;
  const datPhien = useKho((s) => s.datPhien);
  const [hoSo, setHoSo] = useState<HoSoCongKhai | null>(null);
  const [bietDanh, setBietDanh] = useState('');
  const [anh, setAnh] = useState<LoaiVaiCongKhai>('DanLang');
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    goiApi<HoSoCongKhai>('/tai-khoan/ho-so').then(
      (hs) => {
        setHoSo(hs);
        setBietDanh(hs.bietDanh);
        setAnh(hs.anhDaiDien as LoaiVaiCongKhai);
      },
      (e: Error) => setLoi(e.message),
    );
  }, []);

  const doi = hoSo !== null && (bietDanh.trim() !== hoSo.bietDanh || anh !== hoSo.anhDaiDien);

  const luu = async (e: FormEvent) => {
    e.preventDefault();
    const ten = bietDanh.trim();
    if (ten.length < 2 || ten.length > 24) {
      setLoi('Tên trong làng dài 2–24 ký tự.');
      return;
    }
    setDangLuu(true);
    setLoi(null);
    try {
      const hs = await goiApi<HoSoCongKhai>('/tai-khoan/ho-so', 'PATCH', {
        bietDanh: ten,
        anhDaiDien: anh,
      });
      setHoSo(hs);
      setBietDanh(hs.bietDanh);
      datPhien({ ...phien, bietDanh: hs.bietDanh, anhDaiDien: hs.anhDaiDien });
      setDaLuu(true);
      setTimeout(() => setDaLuu(false), 2000);
    } catch (loiLuu) {
      setLoi(loiLuu instanceof Error ? loiLuu.message : 'Không lưu được hồ sơ.');
    } finally {
      setDangLuu(false);
    }
  };

  if (!hoSo) {
    return (
      <main className="trang-chu">
        <p className={loi ? 'o-loi' : 'phu'}>{loi ?? 'Đang mở sổ hộ tịch của làng…'}</p>
      </main>
    );
  }

  const tiLe = hoSo.soVanDaChoi > 0 ? Math.round((100 * hoSo.soVanThang) / hoSo.soVanDaChoi) : 0;

  return (
    <main className="trang-chu ho-so">
      <header className="hs-dau">
        <motion.img
          key={anh}
          src={ANH_VAI[anh]}
          alt=""
          className="hs-anh-lon"
          style={{ ['--mau-vai' as string]: `var(--vai-${anh})` }}
          initial={giam ? false : { rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          draggable={false}
        />
        <div className="hs-ten-khoi">
          <p className="tc-loi-chao">@{phien.tenDangNhap}</p>
          <h1 className="tc-tieu-de">{hoSo.bietDanh}</h1>
          <p className="ghi-chu">Ảnh đại diện: {NGUON_VAI[anh]}</p>
        </div>
      </header>

      <section className="hs-so-lieu" aria-label="Thống kê">
        <div className="hs-o-so">
          <NumberTicker value={hoSo.soVanDaChoi} className="hs-so" />
          <span className="phu">ván đã chơi</span>
        </div>
        <div className="hs-o-so">
          <NumberTicker value={hoSo.soVanThang} className="hs-so" />
          <span className="phu">ván thắng</span>
        </div>
        <div className="hs-o-so hs-o-ti-le">
          <AnimatedCircularProgressBar
            value={tiLe}
            gaugePrimaryColor="#e6a646"
            gaugeSecondaryColor="rgba(255,255,255,0.08)"
            className="hs-vong"
          />
          <span className="phu">tỉ lệ thắng</span>
        </div>
      </section>

      <form className="hs-form" onSubmit={luu}>
        <div className="o-nhap">
          <Label htmlFor={`${idGoc}-ten`}>Tên trong làng</Label>
          <Input
            id={`${idGoc}-ten`}
            value={bietDanh}
            maxLength={24}
            onChange={(e) => setBietDanh(e.target.value)}
            autoComplete="nickname"
          />
        </div>

        <fieldset className="hs-chon-anh">
          <legend>Ảnh đại diện</legend>
          {CAC_ANH.map((v) => (
            <label
              key={v}
              className={`hs-anh ${anh === v ? 'hs-anh-chon' : ''}`}
              style={{ ['--mau-vai' as string]: `var(--vai-${v})` }}
            >
              <input
                type="radio"
                name="anhDaiDien"
                value={v}
                checked={anh === v}
                onChange={() => setAnh(v)}
                className="sr-only"
              />
              <img src={ANH_VAI[v]} alt="" draggable={false} />
              <span>{TEN_VAI[v]}</span>
              {anh === v && <Check className="hs-dau-chon" aria-hidden />}
            </label>
          ))}
        </fieldset>

        <div className="hs-luu">
          <Button type="submit" size="lg" disabled={!doi || dangLuu}>
            {dangLuu ? 'Đang ghi vào sổ…' : 'Lưu hồ sơ'}
          </Button>
          {daLuu && (
            <span className="pc-san-sang" role="status">
              Đã lưu.
            </span>
          )}
          {loi && (
            <p className="o-loi" role="alert">
              {loi}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
