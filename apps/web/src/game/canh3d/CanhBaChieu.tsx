import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ThongTinGhe } from '../ghe';
import type { Thoi } from '../hienThi';
import type { KhoanhKhac } from '../khoanhKhac';
import { BanTron3D } from './BanTron3D';
import {
  BAN_KINH_GHE,
  diemTrenVong,
  gocGhe,
  NguCanhCanh,
  tienToi,
  useCanh,
  VI_TRI_GIA_TREO,
} from './dungChung';
import { GiaTreo3D, GoiVai3D, MuiTen3D } from './KhoanhKhac3D';
import { MoiTruong } from './MoiTruong';

interface Props {
  thoi: Thoi;
  tienDoThienThe: number;
  ghe: ThongTinGhe[];
  chonDuoc: ReadonlySet<string>;
  daChon: string | null;
  onChon: (id: string) => void;
  khoanhKhac: KhoanhKhac | null;
  latHet: boolean;
}

/**
 * Máy quay: đứng sau lưng người xem nhìn vào bàn, nghiêng theo con trỏ; đêm xuống thì sát lại,
 * lúc treo cổ thì ngẩng lên giá treo, lúc trúng tên thì quay về người trúng.
 */
function MayQuay({ diemNhin, viTri }: { diemNhin: THREE.Vector3; viTri: THREE.Vector3 }) {
  const { camera, pointer, size } = useThree();
  const nhin = useRef(diemNhin.clone());
  const giam = useReducedMotion();
  useFrame((_, dt) => {
    const k = giam ? 50 : 2.2;
    // Khung 16:9 là chuẩn; màn hẹp hơn thì lùi ra theo tỉ lệ để vòng ghế không bị cắt.
    const lui = Math.min(2.1, Math.max(1, 1.75 / (size.width / size.height)));
    const dich = viTri
      .clone()
      .sub(diemNhin)
      .multiplyScalar(lui)
      .add(diemNhin)
      .add(new THREE.Vector3(pointer.x * 0.9, pointer.y * 0.45, 0));
    camera.position.x = tienToi(camera.position.x, dich.x, k, dt);
    camera.position.y = tienToi(camera.position.y, dich.y, k, dt);
    camera.position.z = tienToi(camera.position.z, dich.z, k, dt);
    nhin.current.lerp(diemNhin, 1 - Math.exp(-k * dt));
    camera.lookAt(nhin.current);
  });
  return null;
}

/** Đẩy độ đêm và tiến độ thiên thể về đích mỗi khung hình — mọi lớp khác chỉ việc đọc. */
function NhipCanh({ thoi, tienDo }: { thoi: Thoi; tienDo: number }) {
  const canh = useCanh();
  const giam = useReducedMotion();
  useFrame((_, dt) => {
    canh.dem.current = tienToi(canh.dem.current, thoi === 'dem' ? 1 : 0, giam ? 50 : 1.1, dt);
    canh.tienDo.current = tienToi(canh.tienDo.current, tienDo, giam ? 50 : 1.5, dt);
  });
  return null;
}

export function CanhBaChieu(p: Props) {
  // Khởi tạo một lần theo trạng thái đầu; sau đó NhipCanh trôi tới giá trị mới.
  const [trangThai] = useState(() => ({
    dem: { current: p.thoi === 'dem' ? 1 : 0 },
    tienDo: { current: p.tienDoThienThe },
  }));
  const kk = p.khoanhKhac;
  const viTriToi = Math.max(
    0,
    p.ghe.findIndex((g) => g.laToi),
  );
  const viTriCua = (id: string) =>
    diemTrenVong(
      gocGhe(
        p.ghe.findIndex((g) => g.id === id),
        viTriToi,
        p.ghe.length,
      ),
      BAN_KINH_GHE,
      0,
    );

  // Góc máy theo khoảnh khắc.
  let diemNhin = new THREE.Vector3(0, 0.9, -0.4);
  let viTri = p.thoi === 'dem' ? new THREE.Vector3(0, 3.6, 7.2) : new THREE.Vector3(0, 4.3, 8.4);
  if (kk?.loai === 'TREO_CO') {
    diemNhin = new THREE.Vector3(VI_TRI_GIA_TREO[0], 2.3, VI_TRI_GIA_TREO[2]);
    viTri = new THREE.Vector3(0.6, 3.2, 6.2);
  } else if (kk?.loai === 'BI_BAN') {
    const [x, , z] = viTriCua(kk.id);
    diemNhin = new THREE.Vector3(x * 0.8, 1, z * 0.8);
    viTri = new THREE.Vector3(x * 0.4, 3.4, 7);
  } else if (kk?.loai === 'GOI_VAI') {
    diemNhin = new THREE.Vector3(0, 2.4, 0);
    viTri = new THREE.Vector3(0, 3.4, 6.6);
  }

  return (
    <div className="canh-3d" aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 42, position: [0, 4.3, 8.4], near: 0.1, far: 260 }}
        onPointerMissed={() => (document.body.style.cursor = '')}
      >
        <NguCanhCanh.Provider value={trangThai}>
          <NhipCanh thoi={p.thoi} tienDo={p.tienDoThienThe} />
          <MayQuay diemNhin={diemNhin} viTri={viTri} />
          <Suspense fallback={null}>
            <MoiTruong />
            <BanTron3D
              ghe={p.ghe}
              chonDuoc={p.chonDuoc}
              daChon={p.daChon}
              onChon={p.onChon}
              dangDien={kk?.loai === 'TREO_CO' ? kk.id : null}
              latHet={p.latHet}
            />
            {kk?.loai === 'GOI_VAI' && <GoiVai3D key={`goi-${kk.vai}`} vai={kk.vai} />}
            {kk?.loai === 'TREO_CO' && <GiaTreo3D key={`treo-${kk.id}`} />}
            {kk?.loai === 'BI_BAN' && <MuiTen3D key={`ban-${kk.id}`} dich={viTriCua(kk.id)} />}
          </Suspense>
        </NguCanhCanh.Provider>
      </Canvas>
    </div>
  );
}
