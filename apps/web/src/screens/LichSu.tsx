import type { ChiTietVanCongKhai, TomTatVanCongKhai } from '@moonvillage/shared';
import { ArrowLeft, ChevronRight, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
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
