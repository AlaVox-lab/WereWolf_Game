import type { ChiTietVanCongKhai, TomTatVanCongKhai } from '@moonvillage/shared';
import { ArrowLeft, ChevronRight, Flag, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AnhVai } from '@/game/anhVai';
import { TEN_VAI } from '@/game/hienThi';
import { NhatKyVan } from '@/game/NhatKyVan';
import { goiApi } from '@/lib/api';
import { useKho } from '@/realtime/kho';

const NGAY = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

function KetQua({ v }: { v: Pick<TomTatVanCongKhai, 'trangThai' | 'thang'> }) {
  if (v.trangThai === 'HUY_VAN') return <span className="ls-nhan ls-huy">Ván hủy</span>;
  return v.thang ? (
    <span className="ls-nhan ls-thang">Thắng</span>
  ) : (
    <span className="ls-nhan ls-thua">Thua</span>
  );
}

const PHE_THANG = (phe: string | null) =>
  phe === 'SOI' ? 'Bầy Sói thắng' : phe === 'DAN' ? 'Dân làng thắng' : 'Không phe nào thắng';

/** UC04 — danh sách ván đã chơi, ván mới nhất trước. */
export function LichSu() {
  const giam = useReducedMotion();
  const [ds, setDs] = useState<TomTatVanCongKhai[] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => {
    goiApi<TomTatVanCongKhai[]>('/lich-su').then(setDs, (e: Error) => setLoi(e.message));
  }, []);

  return (
    <main className="trang-chu">
      <header className="tc-chao">
        <p className="tc-loi-chao">Sổ ghi chép của làng</p>
        <h1 className="tc-tieu-de">Những đêm đã qua</h1>
      </header>

      {loi ? (
        <p className="o-loi" role="alert">
          {loi}
        </p>
      ) : ds === null ? (
        <p className="phu">Đang lật sổ…</p>
      ) : ds.length === 0 ? (
        <p className="tc-trong">
          Bạn chưa chơi ván nào. <Link to="/">Dựng một phòng</Link> rồi thêm người chơi ảo để thử.
        </p>
      ) : (
        <ul className="ls-ds">
          {ds.map((v, i) => (
            <motion.li
              key={v.vanId}
              initial={giam ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: giam ? 0 : Math.min(i, 10) * 0.04 }}
            >
              <Link to={`/lich-su/${v.vanId}`} className="ls-dong">
                <AnhVai vai={v.loaiVai} rong={40} />
                <span className="ls-dong-chu">
                  <span className="ls-dong-dau">
                    Bạn là <b>{TEN_VAI[v.loaiVai]}</b> · {PHE_THANG(v.pheThang)}
                  </span>
                  <span className="phu">
                    {NGAY.format(v.ketThucLuc)} · {v.soLuot} lượt
                  </span>
                </span>
                <span className="tc-so-nguoi">
                  <Users aria-hidden size={16} />
                  {v.soNguoi}
                </span>
                <KetQua v={v} />
                <ChevronRight aria-hidden className="ls-mui-ten" />
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </main>
  );
}

/**
 * UC21 — báo cáo vi phạm từ ván cũ. Chỉ liệt kê người thật khác trong ván; mã ván đi kèm nên
 * quản trị viên mở lại được cả nhật ký. Máy chủ kiểm lại mọi điều kiện.
 */
function NutBaoCao({ van, toiId }: { van: ChiTietVanCongKhai; toiId: string }) {
  const coTheBaoCao = van.nguoiChoi.filter((n) => n.id !== toiId && !n.laNguoiChoiAo);
  const [mo, setMo] = useState(false);
  const [ai, setAi] = useState<string | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [daGui, setDaGui] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  if (coTheBaoCao.length === 0) return null;

  const gui = async (e: FormEvent) => {
    e.preventDefault();
    if (!ai) return;
    setDangGui(true);
    setLoi(null);
    try {
      await goiApi('/bao-cao', 'POST', { vanId: van.vanId, nguoiBiBaoCaoId: ai, lyDo });
      setDaGui(true);
    } catch (loiGui) {
      setLoi(loiGui instanceof Error ? loiGui.message : 'Không gửi được báo cáo.');
    } finally {
      setDangGui(false);
    }
  };

  return (
    <Dialog
      open={mo}
      onOpenChange={(m) => {
        setMo(m);
        if (!m) {
          setDaGui(false);
          setLoi(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="ls-nut-bao-cao">
          <Flag aria-hidden />
          Báo cáo vi phạm
        </Button>
      </DialogTrigger>
      <DialogContent data-thoi="dem" className="so-tay">
        <DialogHeader>
          <DialogTitle className="so-tay-tieu-de">Báo cáo vi phạm</DialogTitle>
          <DialogDescription>
            Quản trị viên sẽ xem lại nhật ký của ván này cùng lý do bạn đưa ra.
          </DialogDescription>
        </DialogHeader>
        {daGui ? (
          <p className="pc-san-sang" role="status">
            Đã gửi báo cáo. Cảm ơn bạn giữ làng trong sạch.
          </p>
        ) : (
          <form className="ls-form-bao-cao" onSubmit={gui}>
            <fieldset className="ls-chon-nguoi">
              <legend>Người vi phạm</legend>
              {coTheBaoCao.map((n) => (
                <label key={n.id} className={`muc-tieu-nut ${ai === n.id ? 'muc-tieu-chon' : ''}`}>
                  <input
                    type="radio"
                    name="nguoiBiBaoCao"
                    className="sr-only"
                    checked={ai === n.id}
                    onChange={() => setAi(n.id)}
                  />
                  {n.ten}
                </label>
              ))}
            </fieldset>
            <label className="o-nhap">
              <span className="text-sm font-semibold">Lý do (5–500 ký tự)</span>
              <textarea
                className="qt-ghi-chu"
                value={lyDo}
                maxLength={500}
                onChange={(e) => setLyDo(e.target.value)}
                placeholder="Ví dụ: chửi bới trong kênh chung, cố tình lộ vai…"
              />
            </label>
            <Button type="submit" disabled={!ai || lyDo.trim().length < 5 || dangGui}>
              {dangGui ? 'Đang gửi…' : 'Gửi báo cáo'}
            </Button>
            {loi && (
              <p className="o-loi" role="alert">
                {loi}
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** UC04 — mở lại một ván cũ: vai của cả làng và bản ghi diễn tiến từng lượt. */
export function ChiTietVanCu() {
  const { vanId = '' } = useParams();
  const giam = useReducedMotion();
  const toiId = useKho((s) => s.phien?.id);
  const [van, setVan] = useState<ChiTietVanCongKhai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => {
    goiApi<ChiTietVanCongKhai>(`/lich-su/${encodeURIComponent(vanId)}`).then(setVan, (e: Error) =>
      setLoi(e.message),
    );
  }, [vanId]);

  if (loi || !van) {
    return (
      <main className="trang-chu">
        <Link to="/lich-su" className="ls-quay-lai">
          <ArrowLeft aria-hidden size={16} /> Lịch sử
        </Link>
        <p className={loi ? 'o-loi' : 'phu'} role={loi ? 'alert' : undefined}>
          {loi ?? 'Đang lật sổ…'}
        </p>
      </main>
    );
  }

  const ten = (id: string) => van.nguoiChoi.find((n) => n.id === id)?.ten ?? `#${id}`;
  const toi = van.nguoiChoi.find((n) => n.id === toiId);

  return (
    <main className="trang-chu">
      <Link to="/lich-su" className="ls-quay-lai">
        <ArrowLeft aria-hidden size={16} /> Lịch sử
      </Link>
      <header className="tc-chao">
        <p className="tc-loi-chao">{NGAY.format(van.ketThucLuc)}</p>
        <h1 className={`tc-tieu-de ls-tieu-de-${van.pheThang ?? 'HUY'}`}>
          {van.trangThai === 'HUY_VAN' ? 'Ván bị hủy' : PHE_THANG(van.pheThang)}
        </h1>
        {toi && (
          <p className="ghi-chu">
            Bạn là {TEN_VAI[toi.loaiVai]}
            {toi.conSong ? ', sống tới cuối ván.' : ', đã ngã xuống.'}
          </p>
        )}
        {toi && toiId && <NutBaoCao van={van} toiId={toiId} />}
      </header>

      <ul className="lat-vai ls-lat-vai">
        {van.nguoiChoi.map((n, i) => (
          <motion.li
            key={n.id}
            className={`lat-vai-o ${n.conSong ? '' : 'lat-vai-chet'} ${n.id === toiId ? 'ls-la-toi' : ''}`}
            initial={giam ? false : { opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ delay: giam ? 0 : 0.1 + i * 0.06, duration: 0.5 }}
          >
            <AnhVai vai={n.loaiVai} rong={72} />
            <span className="lat-vai-ten">{n.ten}</span>
            <span className="phu">
              {TEN_VAI[n.loaiVai]}
              {n.conSong ? '' : ' · đã chết'}
            </span>
          </motion.li>
        ))}
      </ul>

      <section className="ls-nhat-ky" aria-labelledby="ls-nhat-ky-tieu-de">
        <h2 id="ls-nhat-ky-tieu-de">Diễn biến</h2>
        <NhatKyVan nhatKy={van.nhatKy} ten={ten} />
      </section>
    </main>
  );
}
