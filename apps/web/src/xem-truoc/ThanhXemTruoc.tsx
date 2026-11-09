import type { GocNhinNguoiChoi } from '@moonvillage/shared';
import { TEN_VAI } from '../game/hienThi';
import type { TocDo } from './usePhatLai';

interface Props {
  hatGiong: number;
  chiSo: number;
  soKhung: number;
  dangChay: boolean;
  tocDo: TocDo;
  /** Góc nhìn đầu ván của từng ghế — để đặt tên lựa chọn "xem từ ghế". */
  cacGhe: GocNhinNguoiChoi[];
  gheXem: number;
  ten: (id: string, ghe: number) => string;
  onChay: () => void;
  onDung: () => void;
  onToi: (i: number) => void;
  onTocDo: (t: TocDo) => void;
  onDoiGhe: (i: number) => void;
}

/**
 * Bảng điều khiển của bản xem trước — chỉ có khi phát lại ván mô phỏng; ván thật (Giai đoạn 5)
 * không có thanh này. Đổi ghế là xem cùng một ván bằng mắt người khác.
 */
export function ThanhXemTruoc(p: Props) {
  return (
    <div className="tam tam-nho thanh-xem-truoc" role="group" aria-label="Điều khiển bản xem trước">
      <p className="phu">Xem trước · ván mô phỏng, hạt giống {p.hatGiong}</p>
      <div className="xt-hang">
        <button
          type="button"
          className="nut-tron"
          onClick={() => p.onToi(p.chiSo - 1)}
          aria-label="Khung trước"
        >
          ‹
        </button>
        {p.dangChay ? (
          <button
            type="button"
            className="nut-tron nut-tron-chinh"
            onClick={p.onDung}
            aria-label="Tạm dừng"
          >
            ❚❚
          </button>
        ) : (
          <button
            type="button"
            className="nut-tron nut-tron-chinh"
            onClick={p.onChay}
            aria-label="Phát"
          >
            ▶
          </button>
        )}
        <button
          type="button"
          className="nut-tron"
          onClick={() => p.onToi(p.chiSo + 1)}
          aria-label="Khung sau"
        >
          ›
        </button>
        <div className="xt-toc-do" role="radiogroup" aria-label="Tốc độ">
          {([1, 2, 4] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={p.tocDo === t}
              className={p.tocDo === t ? 'xt-dang-chon' : ''}
              onClick={() => p.onTocDo(t)}
            >
              {t}×
            </button>
          ))}
        </div>
      </div>
      <input
        type="range"
        className="xt-thanh-truot"
        min={0}
        max={p.soKhung - 1}
        value={p.chiSo}
        onChange={(e) => p.onToi(Number(e.target.value))}
        aria-label="Vị trí trong ván"
      />
      <label className="xt-ghe">
        <span className="phu">Xem bằng mắt</span>
        <select value={p.gheXem} onChange={(e) => p.onDoiGhe(Number(e.target.value))}>
          {p.cacGhe.map((g, i) => (
            <option key={g.toi.id} value={i}>
              {p.ten(g.toi.id, i + 1)} — {TEN_VAI[g.toi.loaiVai]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
