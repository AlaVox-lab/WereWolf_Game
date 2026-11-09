import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { thoiCua } from './game/hienThi';
import { khoanhKhacCaVan, THOI_LUONG, type KhoanhKhac } from './game/khoanhKhac';
import { ManChoi } from './game/ManChoi';
import { TheVai } from './game/TheVai';
import { taiVanMau, tenNguoiChoi, type VanMau } from './xem-truoc/duLieu';
import { ThanhXemTruoc } from './xem-truoc/ThanhXemTruoc';
import { usePhatLai } from './xem-truoc/usePhatLai';

/** Độ dài danh nghĩa của một đêm cho mặt trăng đi hết vòng cung — chỉ để vẽ. */
const DEM_DANH_NGHIA = 150_000;

/**
 * Mặt trăng hoặc mặt trời trên vòng cung trời là đồng hồ của pha. Ban ngày chia vòng cung theo
 * ba chặng có hạn công khai (công bố, thảo luận, bỏ phiếu); ban đêm không có hạn công khai (Q05)
 * nên mặt trăng trôi theo thời gian đã qua của đêm.
 */
function tienDoThienThe(g: GocNhinNguoiChoi, bayGio: number, batDauPha: number, batDauDem: number) {
  const phan =
    g.hetHanPha !== null && g.hetHanPha > batDauPha
      ? Math.min(1, Math.max(0, (bayGio - batDauPha) / (g.hetHanPha - batDauPha)))
      : 1;
  switch (g.trangThai) {
    case 'PHA_DEM':
    case 'GIAI_QUYET_DEM':
      return 0.06 + 0.88 * Math.min(1, (bayGio - batDauDem) / DEM_DANH_NGHIA);
    case 'PHA_CONG_BO':
      return 0.06 + 0.08 * phan;
    case 'PHA_THAO_LUAN':
      return 0.14 + 0.56 * phan;
    case 'PHA_BO_PHIEU':
      return 0.7 + 0.2 * phan;
    case 'GIAI_QUYET_PHIEU':
      return 0.92;
    default:
      return 0.5;
  }
}

function XemTruoc({ van }: { van: VanMau }) {
  const [gheXem, setGheXem] = useState(0);
  const [daVao, setDaVao] = useState(false);
  const cacGocNhin = useMemo(() => van.khung.map((k) => k.gocNhin[gheXem]!), [van, gheXem]);
  const khoanhKhac = useMemo(() => khoanhKhacCaVan(cacGocNhin), [cacGocNhin]);

  // Mốc thời gian để vẽ đồng hồ: lúc pha hiện tại bắt đầu, lúc đêm bắt đầu, lúc việc được mời.
  const moc = useMemo(() => {
    let pha = 0;
    let dem = 0;
    let viec = 0;
    return cacGocNhin.map((g, i) => {
      const truoc = cacGocNhin[i - 1];
      const t = van.khung[i]!.t;
      if (!truoc || truoc.trangThai !== g.trangThai || truoc.luot !== g.luot) pha = t;
      if (!truoc || thoiCua(truoc.trangThai) !== thoiCua(g.trangThai)) dem = t;
      if (g.viecCanLam && g.viecCanLam.hetHanLuc !== truoc?.viecCanLam?.hetHanLuc) viec = t;
      return { pha, dem, viec };
    });
  }, [cacGocNhin, van]);

  const giuThem = useCallback(
    (i: number) => (khoanhKhac[i] ?? []).reduce((s, k) => s + THOI_LUONG[k.loai], 0),
    [khoanhKhac],
  );
  const phat = usePhatLai(van.khung, giuThem);

  // Hàng khoảnh khắc: chỉ chiếu khi ván trôi tới khung kế tiếp, không chiếu khi tua.
  const [hang, setHang] = useState<KhoanhKhac[]>([]);
  const chiSoTruoc = useRef(phat.chiSo);
  useEffect(() => {
    const laBuocToi = phat.chiSo === chiSoTruoc.current + 1;
    chiSoTruoc.current = phat.chiSo;
    setHang(laBuocToi ? (khoanhKhac[phat.chiSo] ?? []).filter((k) => k.loai !== 'KET_THUC') : []);
  }, [phat.chiSo, khoanhKhac]);
  const xongKhoanhKhac = useCallback(() => setHang((h) => h.slice(1)), []);

  // Mở màn chiếu xong mới cho ván trôi tiếp.
  const [choMoMan, setChoMoMan] = useState(false);
  useEffect(() => {
    if (choMoMan && hang.length === 0) {
      setChoMoMan(false);
      phat.choChay();
    }
  }, [choMoMan, hang.length, phat]);

  const g = cacGocNhin[phat.chiSo]!;
  const m = moc[phat.chiSo]!;
  const kk = hang[0] ?? null;

  // Tới lượt người xem: bản xem trước dừng lại chờ họ chọn, trả lời xong mới trôi tiếp.
  const khoaViec = g.viecCanLam ? `${gheXem}-${g.viecCanLam.hetHanLuc}` : null;
  const [choTraLoi, setChoTraLoi] = useState(false);
  const { tamDung, choChay } = phat;
  useEffect(() => {
    if (!khoaViec || !daVao || !phat.dangChay) return;
    tamDung();
    setChoTraLoi(true);
    // Chỉ phản ứng khi một việc mới xuất hiện, không theo dõi trạng thái phát.
  }, [khoaViec]);

  return (
    <ManChoi
      g={g}
      bayGio={phat.bayGioGiaLap}
      batDauViec={m.viec}
      tienDoThienThe={tienDoThienThe(g, phat.bayGioGiaLap, m.pha, m.dem)}
      ten={tenNguoiChoi}
      khoanhKhac={kk}
      thoiLuongKhoanhKhac={kk ? THOI_LUONG[kk.loai] / phat.tocDo : 0}
      onXongKhoanhKhac={xongKhoanhKhac}
      onDaTraLoi={() => {
        if (choTraLoi) {
          setChoTraLoi(false);
          choChay();
        }
      }}
    >
      <AnimatePresence>
        {!daVao && (
          <TheVai
            key={gheXem}
            toi={g.toi}
            ten={(id) => tenNguoiChoi(id, g.nguoiChoi.find((n) => n.id === id)?.thuTuGhe ?? 0)}
            onVao={() => {
              setDaVao(true);
              // Mở màn: đêm buông, rồi gọi vai đang tới lượt — như một ván vừa bắt đầu.
              setHang([
                { loai: 'DOI_THOI', thoi: thoiCua(g.trangThai) },
                ...(g.buocDem ? [{ loai: 'GOI_VAI' as const, vai: g.buocDem }] : []),
              ]);
              setChoMoMan(true);
            }}
          />
        )}
      </AnimatePresence>
      {daVao && (
        <ThanhXemTruoc
          hatGiong={van.hatGiong}
          chiSo={phat.chiSo}
          soKhung={van.khung.length}
          dangChay={phat.dangChay}
          tocDo={phat.tocDo}
          cacGhe={van.khung[0]!.gocNhin}
          gheXem={gheXem}
          ten={tenNguoiChoi}
          onChay={phat.choChay}
          onDung={phat.tamDung}
          onToi={phat.toi}
          onTocDo={phat.doiTocDo}
          onDoiGhe={(i) => {
            setGheXem(i);
            setDaVao(false);
            phat.tamDung();
          }}
        />
      )}
    </ManChoi>
  );
}

/**
 * Giai đoạn 3: chưa có máy chủ thời gian thực, nên trang mở bản xem trước — phát lại một ván do
 * bộ mô phỏng sinh ra (`npm run xuat-xem-truoc`). Giai đoạn 5 thay bằng phòng chơi thật.
 */
export function App() {
  const [van, setVan] = useState<VanMau | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  useEffect(() => {
    taiVanMau().then(setVan, () =>
      setLoi('Không tải được ván mẫu. Chạy npm run xuat-xem-truoc rồi tải lại.'),
    );
  }, []);

  if (!van) {
    return (
      <main className="san-khau man-cho" data-thoi="dem">
        <p className="ten-lang">Làng Trăng Mờ</p>
        <p className="phu">{loi ?? 'Trăng đang lên…'}</p>
      </main>
    );
  }
  return <XemTruoc van={van} />;
}
