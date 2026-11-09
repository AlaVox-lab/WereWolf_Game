import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { useTexture } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { ANH_TRANG, ANH_VAI } from '../anhVai';
import { tienToi } from './dungChung';

export const RONG_THE = 0.56;
export const CAO_THE = RONG_THE * 1.5;

const DANH_SACH_VAI = Object.keys(ANH_VAI) as LoaiVaiCongKhai[];

/** Nạp một lần cả bảy tranh (sáu mặt trước + mặt sau) làm texture. */
export function useTranhThe() {
  const tex = useTexture([...DANH_SACH_VAI.map((v) => ANH_VAI[v]), ANH_TRANG]);
  tex.forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });
  const truoc = Object.fromEntries(DANH_SACH_VAI.map((v, i) => [v, tex[i]!])) as Record<
    LoaiVaiCongKhai,
    THREE.Texture
  >;
  return { truoc, sau: tex[DANH_SACH_VAI.length]! };
}

type Props = ThreeElements['group'] & {
  /** Vai in ở mặt trước; `null` khi người xem chưa được biết — mặt trước cũng là mặt trăng. */
  vai: LoaiVaiCongKhai | null;
  /** Ngửa (thấy tranh vai) hay úp (thấy mặt trăng). Đổi giá trị là thẻ lật trong không gian. */
  ngua: boolean;
  /** Màu viền — trạng thái của ghế (bạn, đồng đội, đang chọn…). */
  mauVien?: string;
  toi?: boolean;
};

/**
 * Một lá thẻ vai: hai mặt tranh khắc dán lưng vào nhau trên tấm bìa tối. Lật quanh trục dọc của
 * chính nó, nhấc lên một chút giữa chừng như tay người lật thật.
 */
export function TheBai({ vai, ngua, mauVien = '#1b140e', toi = false, ...nhom }: Props) {
  const { truoc, sau } = useTranhThe();
  const lat = useRef<THREE.Group>(null);
  const goc = useRef(ngua ? 0 : Math.PI);
  const mauToi = toi ? '#5c5a55' : '#efe4c9';

  useFrame((_, dt) => {
    const g = lat.current;
    if (!g) return;
    goc.current = tienToi(goc.current, ngua ? 0 : Math.PI, 5, dt);
    g.rotation.y = goc.current;
    // Nhấc lên giữa lúc lật: cao nhất khi thẻ dựng đứng (goc = π/2).
    g.position.z = Math.sin(goc.current) * 0.22;
  });

  return (
    <group {...nhom}>
      <group ref={lat}>
        <mesh position={[0, 0, -0.004]}>
          <planeGeometry args={[RONG_THE + 0.05, CAO_THE + 0.05]} />
          <meshStandardMaterial color={mauVien} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <planeGeometry args={[RONG_THE, CAO_THE]} />
          <meshStandardMaterial map={vai ? truoc[vai] : sau} color={mauToi} roughness={0.92} />
        </mesh>
        <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.008]}>
          <planeGeometry args={[RONG_THE, CAO_THE]} />
          <meshStandardMaterial map={sau} color={mauToi} roughness={0.92} />
        </mesh>
      </group>
    </group>
  );
}
