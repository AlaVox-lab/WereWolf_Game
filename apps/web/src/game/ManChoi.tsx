import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import { AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BangViec, type LoaiThuoc } from './BangViec';
import { CanhBaChieu } from './canh3d/CanhBaChieu';
import { dungGhe } from './ghe';
import { thoiCua } from './hienThi';
import type { KhoanhKhac } from './khoanhKhac';
import { LopKhoanhKhac } from './LopKhoanhKhac';
import { ManKetThuc } from './ManKetThuc';
import { ThanhTrangThai } from './ThanhTrangThai';

interface Props {
  g: GocNhinNguoiChoi;
  /** Đồng hồ máy chủ lúc này, mili giây — chỉ dùng để đếm ngược. */
  bayGio: number;
  /** Lúc việc đang làm được mời — để vẽ vòng đồng hồ đầy đủ. */
  batDauViec: number;
  tienDoThienThe: number;
  ten: (id: string, ghe: number) => string;
  khoanhKhac: KhoanhKhac | null;
  thoiLuongKhoanhKhac: number;
  onXongKhoanhKhac: () => void;
  /** Người xem vừa trả lời việc đang mở (xác nhận hoặc bỏ trắng). */
  onDaTraLoi?: () => void;
  /** Lớp phủ riêng của nơi dùng màn này (thẻ vai, bảng điều khiển xem trước…). */
  children?: ReactNode;
}

/**
 * Màn trong ván (MH05–MH08) — chỉ vẽ lại GocNhinNguoiChoi, không biết dữ liệu đến từ máy chủ
 * thật hay từ bản phát lại. Cảnh 3D ở dưới, các lớp chữ DOM ở trên. Giai đoạn 5 thay nguồn dữ
 * liệu bằng Socket.IO, màn này giữ nguyên.
 */
export function ManChoi(p: Props) {
  const { g, bayGio } = p;
  const thoi = thoiCua(g.trangThai);
  const tenTheoId = useMemo(() => {
    const ghe = new Map(g.nguoiChoi.map((n) => [n.id, n.thuTuGhe]));
    return (id: string) => p.ten(id, ghe.get(id) ?? 0);
  }, [g.nguoiChoi, p.ten]);

  // Lựa chọn tại chỗ cho việc đang mở — đổi việc là xóa.
  const viec = g.viecCanLam;
  const khoaViec = `${g.toi.id}-${viec?.viec}-${viec?.hetHanLuc}`;
  const [daChon, setDaChon] = useState<string | null>(null);
  const [nhom, setNhom] = useState<LoaiThuoc | null>(null);
  const [daGui, setDaGui] = useState(false);
  useEffect(() => {
    setDaChon(null);
    setNhom(null);
    setDaGui(false);
  }, [khoaViec]);

  const chonDuoc = useMemo(() => {
    if (!viec || daGui) return new Set<string>();
    const coHaiLo = viec.luaChon.some((n) => n.loai);
    const nhomMo = coHaiLo ? viec.luaChon.find((n) => n.loai === nhom) : viec.luaChon[0];
    return new Set(nhomMo?.mucTieu ?? []);
  }, [viec, nhom, daGui]);

  const conLai = viec
    ? viec.hetHanLuc - bayGio
    : g.hetHanPha !== null
      ? g.hetHanPha - bayGio
      : null;
  const kk = p.khoanhKhac;
  const hetVan = g.trangThai === 'KET_THUC' && g.ketThuc !== null && !kk;
  const ghe = useMemo(() => dungGhe(g, p.ten), [g, p.ten]);

  return (
    <main className="san-khau" data-thoi={thoi} data-trang-thai={g.trangThai}>
      <CanhBaChieu
        thoi={thoi}
        tienDoThienThe={p.tienDoThienThe}
        ghe={ghe}
        chonDuoc={chonDuoc}
        daChon={daChon}
        onChon={setDaChon}
        khoanhKhac={kk}
        latHet={g.trangThai === 'KET_THUC'}
      />
      <div className="man-dem" aria-hidden="true" />

      <ThanhTrangThai g={g} conLai={kk ? null : conLai} />

      <AnimatePresence>
        {viec && !kk && !hetVan && (
          <BangViec
            key={khoaViec}
            g={g}
            ten={tenTheoId}
            conLai={Math.max(0, viec.hetHanLuc - bayGio)}
            tong={viec.hetHanLuc - p.batDauViec}
            nhom={nhom}
            onDoiNhom={(n) => {
              setNhom(n);
              setDaChon(null);
            }}
            chonDuoc={chonDuoc}
            daChon={daChon}
            onChon={setDaChon}
            daGui={daGui}
            onGui={() => {
              setDaGui(true);
              p.onDaTraLoi?.();
            }}
            onBoTrang={() => {
              setDaChon(null);
              setDaGui(true);
              p.onDaTraLoi?.();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {kk && (
          <LopKhoanhKhac
            key={JSON.stringify(kk)}
            kk={kk}
            thoiLuong={p.thoiLuongKhoanhKhac}
            onXong={p.onXongKhoanhKhac}
            ten={tenTheoId}
            vaiToi={g.toi.loaiVai}
            luot={g.luot}
          />
        )}
      </AnimatePresence>

      {hetVan && (
        <ManKetThuc
          ketThuc={g.ketThuc!}
          ten={tenTheoId}
          conSong={new Set(g.nguoiChoi.filter((n) => n.conSong).map((n) => n.id))}
        />
      )}

      {p.children}
    </main>
  );
}
