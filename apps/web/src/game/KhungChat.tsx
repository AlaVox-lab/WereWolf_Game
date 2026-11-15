import type { LoaiKenhCongKhai, TinNhanCongKhai } from '@moonvillage/shared';
import { MessageCircle, Send, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TEN_KENH: Record<LoaiKenhCongKhai, string> = {
  CHUNG: 'Cả làng',
  SOI: 'Bầy Sói',
  NGUOI_CHET: 'Người đã khuất',
};

/** Câu khi kênh xem được nhưng lúc này không gửi được — quyền do máy chủ quyết (BR14). */
const IM_LANG: Record<LoaiKenhCongKhai, string> = {
  CHUNG: 'Làng đang ngủ hoặc bạn đã chết — kênh chung tạm im.',
  SOI: 'Bầy chỉ thì thầm được trong lượt Sói.',
  NGUOI_CHET: 'Kênh của những người đã khuất.',
};

const DO_DAI_TOI_DA = 500;

interface Props {
  tinNhan: TinNhanCongKhai[];
  kenhXemDuoc: LoaiKenhCongKhai[];
  kenhGuiDuoc: LoaiKenhCongKhai[];
  toiId: string;
  ten: (id: string) => string;
  onGui: (kenh: LoaiKenhCongKhai, noiDung: string) => Promise<void>;
}

/**
 * Khung trò chuyện trong ván (UC18): mỗi kênh xem được là một thẻ. Kênh nào gửi được thì có ô
 * nhập; kênh Sói tự mở khi tới lượt bầy (5.6). Chỉ hiển thị — máy chủ đã lọc tin theo quyền.
 */
export function KhungChat(p: Props) {
  const giam = useReducedMotion();
  const [mo, setMo] = useState(() => window.matchMedia('(min-width: 1000px)').matches);
  const [kenh, setKenh] = useState<LoaiKenhCongKhai>(p.kenhXemDuoc[0] ?? 'CHUNG');
  const [noiDung, setNoiDung] = useState('');
  const [loi, setLoi] = useState<string | null>(null);
  const [daDoc, setDaDoc] = useState(p.tinNhan.length);
  const cuoi = useRef<HTMLLIElement>(null);

  // Quyền xem/gửi đổi theo pha (máy chủ quyết): đứng ở kênh đang gửi được, không thì kênh đầu
  // tiên còn xem được. Lượt Sói thì mở hẳn khung ra cho bầy bàn.
  const xemDuoc = p.kenhXemDuoc.join();
  const guiDuocDs = p.kenhGuiDuoc.join();
  useEffect(() => {
    const dauTienGui = p.kenhGuiDuoc[0];
    if (dauTienGui && !p.kenhGuiDuoc.includes(kenh)) setKenh(dauTienGui);
    else if (!p.kenhXemDuoc.includes(kenh)) setKenh(p.kenhXemDuoc[0] ?? 'CHUNG');
    if (p.kenhGuiDuoc.includes('SOI')) setMo(true);
  }, [xemDuoc, guiDuocDs]);

  const ds = p.tinNhan.filter((t) => t.kenh === kenh);
  useEffect(() => {
    if (mo) {
      setDaDoc(p.tinNhan.length);
      cuoi.current?.scrollIntoView({ block: 'end', behavior: giam ? 'auto' : 'smooth' });
    }
  }, [mo, ds.length, kenh, p.tinNhan.length, giam]);

  const chuaDoc = Math.max(0, p.tinNhan.length - daDoc);
  const guiDuoc = p.kenhGuiDuoc.includes(kenh);

  const gui = async (e: FormEvent) => {
    e.preventDefault();
    const chu = noiDung.trim();
    if (!chu) return;
    setLoi(null);
    try {
      await p.onGui(kenh, chu);
      setNoiDung('');
    } catch (loiGui) {
      setLoi(loiGui instanceof Error ? loiGui.message : 'Không gửi được tin.');
    }
  };

  if (p.kenhXemDuoc.length === 0) return null;

  return (
    <div className="khung-chat">
      <AnimatePresence initial={false}>
        {mo ? (
          <motion.section
            key="mo"
            className="tam chat-bang"
            aria-label="Trò chuyện"
            initial={giam ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={giam ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div className="chat-dau">
              <Tabs value={kenh} onValueChange={(v) => setKenh(v as LoaiKenhCongKhai)}>
                <TabsList>
                  {p.kenhXemDuoc.map((k) => (
                    <TabsTrigger key={k} value={k} className={`chat-tab chat-tab-${k}`}>
                      {TEN_KENH[k]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMo(false)}
                aria-label="Thu khung trò chuyện"
              >
                <X aria-hidden />
              </Button>
            </div>

            <ol className="chat-ds" aria-live="polite">
              {ds.length === 0 && <li className="chat-trong">Chưa ai nói gì.</li>}
              {ds.map((t) => (
                <li
                  key={t.thuTu}
                  className={`chat-tin ${t.nguoiGuiId === p.toiId ? 'chat-tin-toi' : ''} chat-${t.kenh}`}
                >
                  <span className="chat-ten">
                    {t.nguoiGuiId === p.toiId ? 'Bạn' : p.ten(t.nguoiGuiId)}
                  </span>
                  <span className="chat-noi-dung">{t.noiDung}</span>
                </li>
              ))}
              <li ref={cuoi} aria-hidden className="chat-moc" />
            </ol>

            {guiDuoc ? (
              <form className="chat-nhap" onSubmit={gui}>
                <Input
                  value={noiDung}
                  onChange={(e) => setNoiDung(e.target.value)}
                  maxLength={DO_DAI_TOI_DA}
                  placeholder={kenh === 'SOI' ? 'Thì thầm với bầy…' : 'Nói với cả kênh…'}
                  aria-label={`Tin nhắn gửi kênh ${TEN_KENH[kenh]}`}
                />
                <Button type="submit" size="icon" disabled={!noiDung.trim()} aria-label="Gửi">
                  <Send aria-hidden />
                </Button>
              </form>
            ) : (
              <p className="ghi-chu chat-im">{IM_LANG[kenh]}</p>
            )}
            {loi && (
              <p className="o-loi" role="alert">
                {loi}
              </p>
            )}
          </motion.section>
        ) : (
          <motion.div
            key="dong"
            initial={giam ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button variant="secondary" className="chat-mo" onClick={() => setMo(true)}>
              <MessageCircle aria-hidden />
              Trò chuyện
              {chuaDoc > 0 && <span className="chat-dem">{chuaDoc}</span>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
