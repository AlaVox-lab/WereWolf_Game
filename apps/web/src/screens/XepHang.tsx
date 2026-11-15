import type { BangXepHangCongKhai, LoaiVaiCongKhai } from '@moonvillage/shared';
import { Crown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ANH_VAI } from '@/game/anhVai';
import { goiApi } from '@/lib/api';
import { useKho } from '@/realtime/kho';

const NGAY = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' });
const tiLe = (thang: number, van: number) => (van ? Math.round((100 * thang) / van) : 0);

/**
 * MH10 — bảng xếp hạng mùa hiện tại (UC05). Ba người đầu đứng trên bục, còn lại là bảng. Điểm:
 * thắng +3, thua +1 (Q14); máy chủ đã sắp và đánh hạng.
 */
export function XepHang() {
  const giam = useReducedMotion();
  const toiId = useKho((s) => s.phien?.id);
  const [bang, setBang] = useState<BangXepHangCongKhai | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => {
    goiApi<BangXepHangCongKhai>('/xep-hang').then(setBang, (e: Error) => setLoi(e.message));
  }, []);

  if (!bang) {
    return (
      <main className="trang-chu">
        <p className={loi ? 'o-loi' : 'phu'}>{loi ?? 'Đang đếm điểm của làng…'}</p>
      </main>
    );
  }

  // Bục: hạng 2 – hạng 1 – hạng 3, người hạng nhất đứng giữa và cao nhất.
  const dau = bang.dong.slice(0, 3);
  const buc = [dau[1], dau[0], dau[2]].filter(Boolean);

  return (
    <main className="trang-chu">
      <header className="tc-chao">
        <p className="tc-loi-chao">
          {bang.mua.ten} · từ {NGAY.format(bang.mua.batDau)}
        </p>
        <h1 className="tc-tieu-de">Bảng vàng của làng</h1>
        <p className="ghi-chu">Mỗi ván thắng +3 điểm, thua +1. Ván bị hủy không tính.</p>
      </header>

      {bang.dong.length === 0 ? (
        <p className="tc-trong">Mùa này chưa ai ghi điểm. Chơi trọn một ván để lên bảng.</p>
      ) : (
        <>
          <ol className="xh-buc" aria-label="Ba người dẫn đầu">
            {buc.map((d, i) => (
              <motion.li
                key={d!.taiKhoanId}
                className={`xh-bac xh-hang-${d!.hang} ${d!.taiKhoanId === toiId ? 'xh-la-toi' : ''}`}
                initial={giam ? false : { opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 140,
                  damping: 18,
                  delay: giam ? 0 : 0.15 * i,
                }}
              >
                {d!.hang === 1 && <Crown className="xh-vuong-mien" aria-hidden />}
                <img
                  src={ANH_VAI[d!.anhDaiDien as LoaiVaiCongKhai] ?? ANH_VAI.DanLang}
                  alt=""
                  className="xh-anh"
                  draggable={false}
                />
                <span className="xh-ten">{d!.bietDanh}</span>
                <span className="xh-diem">{d!.diem} điểm</span>
                <span className="xh-be" aria-label={`Hạng ${d!.hang}`}>
                  {d!.hang}
                </span>
              </motion.li>
            ))}
          </ol>

          <table className="xh-bang">
            <thead>
              <tr>
                <th scope="col">Hạng</th>
                <th scope="col">Người chơi</th>
                <th scope="col">Điểm</th>
                <th scope="col">Ván</th>
                <th scope="col">Thắng</th>
                <th scope="col">Tỉ lệ thắng</th>
              </tr>
            </thead>
            <tbody>
              {bang.dong.map((d) => (
                <tr key={d.taiKhoanId} className={d.taiKhoanId === toiId ? 'xh-la-toi' : ''}>
                  <td>{d.hang}</td>
                  <td>
                    <span className="xh-o-ten">
                      <img
                        src={ANH_VAI[d.anhDaiDien as LoaiVaiCongKhai] ?? ANH_VAI.DanLang}
                        alt=""
                        draggable={false}
                      />
                      {d.bietDanh}
                      {d.taiKhoanId === toiId && <span className="pc-ban"> (bạn)</span>}
                    </span>
                  </td>
                  <td className="xh-so">{d.diem}</td>
                  <td className="xh-so">{d.soVan}</td>
                  <td className="xh-so">{d.soThang}</td>
                  <td className="xh-so">{tiLe(d.soThang, d.soVan)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
