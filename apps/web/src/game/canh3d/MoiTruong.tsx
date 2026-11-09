import { Billboard, Sky, Sparkles, Stars, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react';
import * as THREE from 'three';
import { ANH_TRANG } from '../anhVai';
import { taoNgauNhien, useCanh } from './dungChung';
import { useTexQuang } from './useTexQuang';

const MAU = {
  troiDem: new THREE.Color('#111b2e'),
  troiNgay: new THREE.Color('#c9d6d4'),
  datDem: new THREE.Color('#1a2433'),
  datNgay: new THREE.Color('#56653d'),
  rungDem: new THREE.Color('#152131'),
  rungNgay: new THREE.Color('#2f4430'),
  trang: new THREE.Color('#9fb4d8'),
  nang: new THREE.Color('#ffe2b0'),
};

/** Vị trí trên vòng cung trời theo tiến độ 0..1; ngoài khoảng đó là đã lặn sau rặng núi. */
function viTriCung(p: number, dich = new THREE.Vector3()) {
  return dich.set(-26 + 52 * p, -2 + Math.sin(Math.PI * Math.min(1, Math.max(0, p))) * 22, -48);
}

/** Đĩa trăng cắt tròn từ tranh khắc "Full Moon" của Mellan — cũng là mặt sau thẻ vai. */
function useTexTrang() {
  const goc = useTexture(ANH_TRANG);
  return useMemo(() => {
    const anh = goc.image as HTMLImageElement;
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    const r = anh.width * 0.44;
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(anh, anh.width * 0.5 - r, anh.height * 0.45 - r, r * 2, r * 2, 0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [goc]);
}

function ThienThe() {
  const { dem, tienDo } = useCanh();
  const texTrang = useTexTrang();
  const quang = useTexQuang();
  const trang = useRef<THREE.Group>(null);
  const troi = useRef<THREE.Group>(null);
  const tam = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    // Cùng một tiến độ: ban đêm trăng đi trên cung, mặt trời ở dưới chân núi — và ngược lại.
    const d = dem.current;
    viTriCung(tienDo.current * d + 1.15 * (1 - d), tam);
    trang.current?.position.copy(tam);
    viTriCung(tienDo.current * (1 - d) - 0.15 * d, tam);
    troi.current?.position.copy(tam);
  });

  return (
    <>
      <Billboard ref={trang}>
        <mesh scale={22}>
          <planeGeometry />
          <meshBasicMaterial
            map={quang}
            color="#b9c8e6"
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
        <mesh scale={6.4}>
          <circleGeometry args={[0.5, 64]} />
          <meshBasicMaterial map={texTrang} color="#f3eee0" toneMapped={false} fog={false} />
        </mesh>
      </Billboard>
      <Billboard ref={troi}>
        <mesh scale={26}>
          <planeGeometry />
          <meshBasicMaterial
            map={quang}
            color="#ffd48a"
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
        <mesh scale={5}>
          <circleGeometry args={[0.5, 48]} />
          <meshBasicMaterial color="#fff1c9" toneMapped={false} fog={false} />
        </mesh>
      </Billboard>
    </>
  );
}

/** Rừng thông thấp đa giác quanh bãi đất trống — chừa một khe phía trước cho camera. */
function Rung() {
  const than = useRef<THREE.InstancedMesh>(null);
  const tan = useRef<THREE.InstancedMesh>(null);
  const cay = useMemo(() => {
    const r = taoNgauNhien(11);
    const kq: { x: number; z: number; cao: number }[] = [];
    while (kq.length < 170) {
      const goc = r() * Math.PI * 2;
      const bk = 9 + r() * 22;
      const x = Math.cos(goc) * bk;
      const z = Math.sin(goc) * bk;
      if (z > 3 && Math.abs(x) < 9) continue; // khe nhìn của camera
      kq.push({ x, z, cao: 2.4 + r() * 3.6 });
    }
    return kq;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    cay.forEach((c, i) => {
      m.compose(
        new THREE.Vector3(c.x, c.cao * 0.5 + 0.6, c.z),
        new THREE.Quaternion(),
        new THREE.Vector3(c.cao * 0.32, c.cao, c.cao * 0.32),
      );
      tan.current?.setMatrixAt(i, m);
      m.compose(
        new THREE.Vector3(c.x, 0.35, c.z),
        new THREE.Quaternion(),
        new THREE.Vector3(0.18, 0.7, 0.18),
      );
      than.current?.setMatrixAt(i, m);
    });
    if (tan.current) tan.current.instanceMatrix.needsUpdate = true;
    if (than.current) than.current.instanceMatrix.needsUpdate = true;
  }, [cay]);

  const vatLieu = useRef<THREE.MeshStandardMaterial>(null);
  const { dem } = useCanh();
  useFrame(() => vatLieu.current?.color.lerpColors(MAU.rungNgay, MAU.rungDem, dem.current));

  return (
    <>
      <instancedMesh ref={tan} args={[undefined, undefined, cay.length]} castShadow>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial ref={vatLieu} flatShading roughness={1} />
      </instancedMesh>
      <instancedMesh ref={than} args={[undefined, undefined, cay.length]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#2b1d14" roughness={1} />
      </instancedMesh>
    </>
  );
}

/** Mái nhà trong làng — ban đêm cửa sổ sáng đèn. */
function Lang() {
  const nha = useMemo(() => {
    const r = taoNgauNhien(23);
    return Array.from({ length: 9 }, (_, i) => {
      const goc = -Math.PI * 0.85 + (i / 8) * Math.PI * 0.7 + (r() - 0.5) * 0.12;
      const bk = 15 + r() * 6;
      return {
        x: Math.cos(goc) * bk,
        z: Math.sin(goc) * bk,
        quay: -goc + Math.PI / 2,
        rong: 1.6 + r() * 1.2,
        cao: 1.2 + r() * 0.8,
      };
    });
  }, []);
  // Một vật liệu cho mọi cửa sổ — đổi độ sáng một chỗ là cả làng lên đèn.
  const cuaSo = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2a1f15', emissive: '#ffb24a' }),
    [],
  );
  const { dem } = useCanh();
  useFrame(() => {
    cuaSo.emissiveIntensity = 0.1 + dem.current * 2.4;
  });

  return (
    <>
      {nha.map((n, i) => (
        <group key={i} position={[n.x, 0, n.z]} rotation={[0, n.quay, 0]}>
          <mesh position={[0, n.cao / 2, 0]} castShadow>
            <boxGeometry args={[n.rong, n.cao, n.rong * 0.8]} />
            <meshStandardMaterial color="#5b4636" roughness={1} />
          </mesh>
          <mesh position={[0, n.cao + n.rong * 0.32, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[n.rong * 0.78, n.rong * 0.65, 4]} />
            <meshStandardMaterial color="#3a2a20" flatShading roughness={1} />
          </mesh>
          <mesh position={[0, n.cao * 0.5, n.rong * 0.41]} material={cuaSo}>
            <planeGeometry args={[0.32, 0.4]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Trời, đèn, sương, mặt đất — đọc độ đêm mỗi khung hình và pha trộn hai không khí. */
export function MoiTruong() {
  const { dem, tienDo } = useCanh();
  const { scene } = useThree();
  const mat = useRef<THREE.DirectionalLight>(null);
  const moiTruong = useRef<THREE.HemisphereLight>(null);
  const dat = useRef<THREE.MeshStandardMaterial>(null);
  const sao = useRef<THREE.Group>(null);
  const domDom = useRef<THREE.Group>(null);
  const sky = useRef<ComponentRef<typeof Sky>>(null);
  const tam = useMemo(() => new THREE.Vector3(), []);
  const mauSuong = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog('#070b16', 14, 52);
  }, [scene]);

  useFrame(() => {
    const d = dem.current;
    // Nguồn sáng chính đi theo trăng ban đêm, theo mặt trời ban ngày.
    viTriCung(tienDo.current, tam);
    if (mat.current) {
      mat.current.position.set(tam.x * 0.4, Math.max(6, tam.y), 10 - d * 16);
      mat.current.color.lerpColors(MAU.nang, MAU.trang, d);
      mat.current.intensity = 2.6 * (1 - d) + 1.25 * d;
    }
    if (moiTruong.current) moiTruong.current.intensity = 1.1 * (1 - d) + 0.55 * d;
    dat.current?.color.lerpColors(MAU.datNgay, MAU.datDem, d);
    if (scene.fog instanceof THREE.Fog)
      scene.fog.color.copy(mauSuong.lerpColors(MAU.troiNgay, MAU.troiDem, d));
    if (sao.current) sao.current.visible = d > 0.35;
    if (domDom.current) domDom.current.visible = d > 0.5;
    // Bầu trời Rayleigh: đưa mặt trời xuống dưới chân trời khi đêm, trời tự tối dần.
    const u = (sky.current?.material as THREE.ShaderMaterial | undefined)?.uniforms;
    u?.sunPosition?.value.set(tam.x, tam.y * (1 - d) - 8 * d, -48);
  });

  return (
    <>
      <Sky
        ref={sky}
        distance={4000}
        turbidity={7}
        rayleigh={1.6}
        mieCoefficient={0.006}
        mieDirectionalG={0.86}
      />
      <group ref={sao}>
        <Stars radius={90} depth={40} count={2200} factor={3.2} saturation={0} fade speed={0.4} />
      </group>
      <hemisphereLight ref={moiTruong} args={['#dfe8ff', '#3b2d22', 1]} />
      <directionalLight
        ref={mat}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <ThienThe />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[70, 64]} />
        <meshStandardMaterial ref={dat} roughness={1} />
      </mesh>
      <Rung />
      <Lang />
      <group ref={domDom}>
        <Sparkles
          count={70}
          scale={[18, 3, 18]}
          position={[0, 1.6, -2]}
          size={3.2}
          speed={0.35}
          color="#ffcf73"
        />
      </group>
    </>
  );
}
