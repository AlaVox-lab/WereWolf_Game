import { useEffect, useMemo, useRef, useState } from 'react';
import type { Khung } from './duLieu';

export type TocDo = 1 | 2 | 4;

/** Thời gian giả lập chạy nhanh gấp bao nhiêu lần thời gian thật ở tốc độ 1×. */
const NEN_NEN = 12;
const GIU_IT_NHAT = 700;
const GIU_NHIEU_NHAT = 6_000;

/**
 * Phát lại chuỗi khung như một ván đang diễn ra: mỗi khung được giữ một khoảng tùy theo khoảng
 * thời gian giả lập tới khung sau (nén lại) và tùy khoảnh khắc nó mang (`giuThem`). Đồng hồ giả
 * lập chạy liên tục trong lúc giữ, nên đồng hồ đếm ngược trên màn hình trôi thật.
 */
export function usePhatLai(khung: Khung[], giuThem: (i: number) => number) {
  const [chiSo, setChiSo] = useState(0);
  const [dangChay, setDangChay] = useState(false);
  const [tocDo, setTocDo] = useState<TocDo>(1);
  const [tienTrinh, setTienTrinh] = useState(0); // 0..1 trong khung hiện tại

  const giu = useMemo(
    () =>
      khung.map((k, i) => {
        const sau = khung[i + 1];
        if (!sau) return Infinity;
        const nen = Math.min(GIU_NHIEU_NHAT, Math.max(GIU_IT_NHAT, (sau.t - k.t) / NEN_NEN));
        return Math.max(nen, giuThem(i));
      }),
    [khung, giuThem],
  );

  // Tiến trình trong khung giữ ở ref để vòng chạy đọc đúng giá trị mới nhất; state chỉ để vẽ.
  const tienTrinhRef = useRef(0);
  const doiKhung = (i: number) => {
    tienTrinhRef.current = 0;
    setTienTrinh(0);
    setChiSo(Math.max(0, Math.min(khung.length - 1, i)));
  };

  useEffect(() => {
    if (!dangChay) return;
    let raf = 0;
    let lanCuoi = 0;
    // Tiếp tục từ đúng chỗ đã dừng trong khung.
    const batDau = performance.now() - (tienTrinhRef.current * giu[chiSo]!) / tocDo;
    const buoc = (bayGio: number) => {
      const daQua = ((bayGio - batDau) * tocDo) / giu[chiSo]!;
      if (daQua >= 1) {
        if (chiSo < khung.length - 1) {
          tienTrinhRef.current = 0;
          setTienTrinh(0);
          setChiSo(chiSo + 1);
        } else setDangChay(false);
        return;
      }
      tienTrinhRef.current = daQua;
      if (bayGio - lanCuoi > 90) {
        lanCuoi = bayGio;
        setTienTrinh(daQua);
      }
      raf = requestAnimationFrame(buoc);
    };
    raf = requestAnimationFrame(buoc);
    return () => cancelAnimationFrame(raf);
  }, [dangChay, chiSo, tocDo, giu, khung.length]);

  const hienTai = khung[chiSo]!;
  const sau = khung[chiSo + 1];
  /** Đồng hồ giả lập lúc này — nội suy giữa khung hiện tại và khung sau. */
  const bayGioGiaLap = sau ? hienTai.t + (sau.t - hienTai.t) * tienTrinh : hienTai.t;

  return {
    chiSo,
    khungHienTai: hienTai,
    bayGioGiaLap,
    dangChay,
    tocDo,
    choChay: () => setDangChay(true),
    tamDung: () => setDangChay(false),
    doiTocDo: setTocDo,
    toi: doiKhung,
  };
}
