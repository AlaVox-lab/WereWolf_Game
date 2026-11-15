import type { GocNhinNguoiChoi, LoaiKenhCongKhai } from '@moonvillage/shared';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { thoiCua } from '@/game/hienThi';
import { KhungChat } from '@/game/KhungChat';
import { THOI_LUONG, timKhoanhKhac, type KhoanhKhac } from '@/game/khoanhKhac';
import { ManChoi } from '@/game/ManChoi';
import { TheVai } from '@/game/TheVai';
import { tienDoThienThe } from '@/game/thienThe';
import { guiLenh } from '@/realtime/ketNoi';
import { bayGioMayChu, useKho } from '@/realtime/kho';

/** Ván đã lật thẻ trong phiên này — nối lại giữa chừng không bắt xem thẻ lần nữa. */
const daXemThe = new Set<string>();
/** Hàng khoảnh khắc chờ chiếu tối đa — máy chủ không đợi hoạt cảnh, bớt cảnh cũ cho kịp. */
const HANG_TOI_DA = 4;
const NHIP_DONG_HO = 250;

/** Đồng hồ máy chủ ước tính, cập nhật vài lần mỗi giây — chỉ để đếm ngược và vẽ trời. */
function useDongHoMayChu(): number {
  const [bayGio, setBayGio] = useState(bayGioMayChu);
  useEffect(() => {
    const hen = setInterval(() => setBayGio(bayGioMayChu()), NHIP_DONG_HO);
    return () => clearInterval(hen);
  }, []);
  return bayGio;
}

/**
 * Phòng chơi thật (MH04–MH08, ROADMAP 5.5–5.10). Đổ `GocNhinNguoiChoi` mới nhất từ kho vào
 * `ManChoi` — cùng màn với bản xem trước — và gửi lựa chọn, tin nhắn qua Socket.IO. Không tính
 * luật: khoảnh khắc chỉ là so hai góc nhìn liền nhau để biết lúc nào chiếu cảnh nào.
 */
export function ManVan({ g, onVePhongCho }: { g: GocNhinNguoiChoi; onVePhongCho: () => void }) {
  const bayGio = useDongHoMayChu();
  const phong = useKho((s) => s.phong);
  const tinNhan = useKho((s) => s.tinNhan);

  // Tên theo mã — gộp dần từ ảnh chụp phòng, người rời phòng giữa chừng vẫn giữ được tên.
  const tenDaBiet = useRef(new Map<string, string>());
  for (const t of phong?.thanhVien ?? []) tenDaBiet.current.set(t.id, t.ten);
  const ten = useCallback(
    (id: string, ghe: number) => tenDaBiet.current.get(id) ?? `Ghế ${ghe}`,
    [],
  );
  const tenTheoId = useCallback(
    (id: string) => ten(id, g.nguoiChoi.find((n) => n.id === id)?.thuTuGhe ?? 0),
    [ten, g.nguoiChoi],
  );

  const [daVao, setDaVao] = useState(() => daXemThe.has(g.vanId));
  const [hang, setHang] = useState<KhoanhKhac[]>([]);
  const [moc, setMoc] = useState(() => {
    const t = bayGioMayChu();
    return { pha: t, dem: t, viec: t };
  });

  // So góc nhìn mới với góc nhìn trước: mốc đồng hồ và khoảnh khắc cần chiếu.
  const truoc = useRef<GocNhinNguoiChoi | null>(null);
  const daTreo = useRef(false);
  useEffect(() => {
    const t = truoc.current;
    truoc.current = g;
    if (!t) return;
    const nay = bayGioMayChu();
    setMoc((m) => ({
      pha: t.trangThai !== g.trangThai || t.luot !== g.luot ? nay : m.pha,
      dem: thoiCua(t.trangThai) !== thoiCua(g.trangThai) ? nay : m.dem,
      viec: g.viecCanLam && g.viecCanLam.hetHanLuc !== t.viecCanLam?.hetHanLuc ? nay : m.viec,
    }));
    if (g.luot !== t.luot || g.trangThai !== 'GIAI_QUYET_PHIEU') daTreo.current = false;
    const kk = timKhoanhKhac(t, g, daTreo.current).filter((k) => k.loai !== 'KET_THUC');
    if (kk.some((k) => k.loai === 'TREO_CO')) daTreo.current = true;
    // Tab đang ẩn thì không xếp cảnh: hẹn giờ bị trình duyệt hãm, quay lại sẽ phải xem cảnh cũ.
    if (kk.length && daXemThe.has(g.vanId) && document.visibilityState === 'visible') {
      setHang((h) => [...h, ...kk].slice(-HANG_TOI_DA));
    }
  }, [g]);

  useEffect(() => {
    const khiDoi = () => {
      if (document.visibilityState === 'hidden') setHang([]);
    };
    document.addEventListener('visibilitychange', khiDoi);
    return () => document.removeEventListener('visibilitychange', khiDoi);
  }, []);

  const xongKhoanhKhac = useCallback(() => setHang((h) => h.slice(1)), []);
  const kk = hang[0] ?? null;

  const guiLuaChon = useCallback(
    async (mucTieuId: string | null, loai: 'CUU' | 'DOC' | null) => {
      const viec = g.viecCanLam;
      if (!viec) return;
      if (viec.viec === 'BO_PHIEU') {
        await guiLenh('van:bo-phieu', { mucTieuId });
      } else if (mucTieuId) {
        await guiLenh('van:hanh-dong', { mucTieuId, ...(loai ? { loai } : {}) });
      }
    },
    [g.viecCanLam],
  );
  const guiTin = useCallback(
    (kenh: LoaiKenhCongKhai, noiDung: string) => guiLenh('kenh:gui', { kenh, noiDung }),
    [],
  );

  const vao = () => {
    daXemThe.add(g.vanId);
    setDaVao(true);
    // Mở màn: đêm buông, rồi gọi vai đang tới lượt — như lúc ván vừa bắt đầu.
    setHang([
      { loai: 'DOI_THOI', thoi: thoiCua(g.trangThai) },
      ...(g.buocDem ? [{ loai: 'GOI_VAI' as const, vai: g.buocDem }] : []),
    ]);
  };

  const huy = g.trangThai === 'HUY_VAN';
  const xemThe = !daVao && !huy && g.trangThai !== 'KET_THUC';

  return (
    <ManChoi
      g={g}
      bayGio={bayGio}
      batDauViec={moc.viec}
      tienDoThienThe={tienDoThienThe(g, bayGio, moc.pha, moc.dem)}
      ten={ten}
      khoanhKhac={xemThe ? null : kk}
      thoiLuongKhoanhKhac={kk ? THOI_LUONG[kk.loai] : 0}
      onXongKhoanhKhac={xongKhoanhKhac}
      onGuiLuaChon={guiLuaChon}
      onVePhongCho={onVePhongCho}
    >
      {!xemThe && !huy && (
        <KhungChat
          tinNhan={tinNhan}
          kenhXemDuoc={g.kenhXemDuoc}
          kenhGuiDuoc={g.kenhGuiDuoc}
          toiId={g.toi.id}
          ten={tenTheoId}
          onGui={guiTin}
        />
      )}

      <AnimatePresence>
        {xemThe && <TheVai key={g.vanId} toi={g.toi} ten={tenTheoId} onVao={vao} />}
      </AnimatePresence>

      {huy && (
        <motion.section
          className="man-ket-thuc"
          aria-label="Ván bị hủy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="kk-chu-lon">Ván bị hủy</h2>
          <p className="kk-chu-phu">
            Quá nửa số người còn sống mất kết nối hơn hai phút, ván không thể tiếp tục. Ván hủy
            không tính điểm.
          </p>
          <Button size="lg" onClick={onVePhongCho}>
            Về phòng chờ
          </Button>
        </motion.section>
      )}
    </ManChoi>
  );
}
