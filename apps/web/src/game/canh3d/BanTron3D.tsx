import { Billboard, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ThongTinGhe } from '../ghe';
import {
  BAN_KINH_BAN,
  BAN_KINH_GHE,
  BAN_KINH_THE,
  CAO_BAN,
  diemTrenVong,
  gocGhe,
  tienToi,
  useCanh,
} from './dungChung';
import { useTexQuang } from './useTexQuang';
import { TheBai } from './TheBai';

/** Mặt gỗ vẽ trên canvas: vân vòng đồng tâm, hơi lệch tâm như gỗ thật. */
function useTexGo() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#6e4a2c';
    ctx.fillRect(0, 0, 512, 512);
    for (let r = 4; r < 360; r += 5 + (r % 7)) {
      ctx.strokeStyle = `rgba(${r % 3 ? 40 : 120},${r % 3 ? 24 : 80},${r % 3 ? 12 : 44},0.35)`;
      ctx.lineWidth = 1 + (r % 4);
      ctx.beginPath();
      ctx.ellipse(250 + Math.sin(r) * 3, 262, r, r * 0.97, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

/** Ba ngọn nến giữa bàn — ánh sáng ấm duy nhất của đêm, lung linh theo nhịp ngẫu nhiên. */
function Nen() {
  const { dem } = useCanh();
  const den = useRef<THREE.PointLight>(null);
  const lua = useRef<THREE.Group>(null);
  const quang = useTexQuang();
  const quangVl = useRef<THREE.MeshBasicMaterial>(null);
  const NEN: [number, number, number][] = [
    [0, 0.34, 0],
    [0.22, 0.24, 0.12],
    [-0.2, 0.2, 0.14],
  ];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const lungLinh =
      0.85 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23.7) * 0.05 + Math.sin(t * 5.3) * 0.04;
    if (den.current) den.current.intensity = (1.2 + dem.current * 9) * lungLinh;
    lua.current?.children.forEach((f, i) => {
      f.scale.set(1, 1 + Math.sin(t * 13 + i * 2) * 0.12, 1);
      f.rotation.z = Math.sin(t * 7 + i) * 0.08;
    });
    if (quangVl.current) quangVl.current.opacity = (0.15 + dem.current * 0.55) * lungLinh;
  });

  return (
    <group position={[0, CAO_BAN + 0.08, 0]}>
      {NEN.map(([x, cao, z], i) => (
        <mesh key={i} position={[x, cao / 2, z]} castShadow>
          <cylinderGeometry args={[0.07, 0.075, cao, 16]} />
          <meshStandardMaterial
            color="#efe4c8"
            emissive="#ffb35c"
            emissiveIntensity={0.35}
            roughness={0.6}
          />
        </mesh>
      ))}
      <group ref={lua}>
        {NEN.map(([x, cao, z], i) => (
          <mesh key={i} position={[x, cao + 0.07, z]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight ref={den} position={[0, 0.75, 0]} color="#ffb35c" distance={10} decay={1.4} />
      <Billboard position={[0, 0.45, 0]}>
        <mesh scale={2.6}>
          <planeGeometry />
          <meshBasicMaterial
            ref={quangVl}
            map={quang}
            color="#ffb85c"
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

const MAU_QUAN = {
  thuong: new THREE.Color('#d8c7a4'),
  toi: new THREE.Color('#e6a646'),
  chet: new THREE.Color('#4a4d52'),
  daChon: new THREE.Color('#ffcf6e'),
};

/** Một quân người chơi đứng ở ghế: đế, thân, đầu — như quân cờ gỗ. Chết thì ngã ra sau. */
function QuanNguoi({
  g,
  goc,
  coTheChon,
  daChon,
  an,
  onChon,
}: {
  g: ThongTinGhe;
  goc: number;
  coTheChon: boolean;
  daChon: boolean;
  an: boolean;
  onChon: () => void;
}) {
  const nhom = useRef<THREE.Group>(null);
  const vl = useRef<THREE.MeshStandardMaterial>(null);
  const vong = useRef<THREE.Mesh>(null);
  const [dangTro, setDangTro] = useState(false);
  const vt = diemTrenVong(goc, BAN_KINH_GHE, 0);
  const nga = useRef(g.conSong ? 0 : 1.25);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    nga.current = tienToi(nga.current, g.conSong ? 0 : 1.25, 3, dt);
    if (nhom.current) {
      // Ngã về phía sau, ra khỏi bàn.
      nhom.current.rotation.set(0, -goc + Math.PI / 2, 0);
      nhom.current.children[0]!.rotation.x = nga.current;
      const nhun = coTheChon ? Math.abs(Math.sin(t * 3)) * 0.08 : 0;
      nhom.current.position.y = tienToi(
        nhom.current.position.y,
        (dangTro && coTheChon ? 0.18 : 0) + nhun,
        8,
        dt,
      );
    }
    if (vl.current) {
      const dich = !g.conSong
        ? MAU_QUAN.chet
        : daChon
          ? MAU_QUAN.daChon
          : g.laToi
            ? MAU_QUAN.toi
            : MAU_QUAN.thuong;
      vl.current.color.lerp(dich, 1 - Math.exp(-6 * dt));
      vl.current.emissiveIntensity = daChon ? 0.6 : coTheChon && dangTro ? 0.35 : 0;
    }
    if (vong.current) {
      const m = vong.current.material as THREE.MeshBasicMaterial;
      m.opacity = coTheChon ? 0.45 + Math.sin(t * 4) * 0.25 : daChon ? 0.9 : 0;
    }
  });

  return (
    <group position={vt} visible={!an}>
      <mesh ref={vong} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.42, 0.56, 48]} />
        <meshBasicMaterial color={g.laDongDoi ? '#e0533a' : '#ffc560'} transparent opacity={0} />
      </mesh>
      {/* Người xem ngồi ở chỗ máy quay: không vẽ quân của chính mình, chỉ giữ vòng và nhãn. */}
      <group ref={nhom} visible={!g.laToi}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            if (coTheChon) onChon();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setDangTro(true);
            if (coTheChon) document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setDangTro(false);
            document.body.style.cursor = '';
          }}
        >
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.34, 0.12, 32]} />
            <meshStandardMaterial ref={vl} emissive="#ffb24a" roughness={0.55} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.26, 0.86, 32]} />
            <meshStandardMaterial color={g.laDongDoi ? '#9a3a28' : '#7a5a40'} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.12, 0]} castShadow>
            <sphereGeometry args={[0.19, 32, 24]} />
            <meshStandardMaterial color={g.conSong ? '#8a6848' : '#3a3a3e'} roughness={0.7} />
          </mesh>
        </group>
      </group>
      <Html
        position={g.laToi ? [0, 1.02, -1.0] : [0, 1.62, 0]}
        center
        distanceFactor={5}
        zIndexRange={[20, 0]}
        pointerEvents="none"
      >
        <div className={`nhan-ghe ${g.laToi ? 'nhan-toi' : ''} ${g.conSong ? '' : 'nhan-chet'}`}>
          {g.ten}
          {g.laToi && <span className="nhan-ban"> · bạn</span>}
          {g.pheDaSoi && (
            <span className={`nhan-soi nhan-soi-${g.pheDaSoi}`}>
              {g.pheDaSoi === 'SOI' ? 'Sói' : 'Dân'}
            </span>
          )}
          {g.laDongDoi && <span className="nhan-soi nhan-soi-SOI">Đồng đội</span>}
        </div>
      </Html>
    </group>
  );
}

export function BanTron3D({
  ghe,
  chonDuoc,
  daChon,
  onChon,
  dangDien,
  latHet,
}: {
  ghe: ThongTinGhe[];
  chonDuoc: ReadonlySet<string>;
  daChon: string | null;
  onChon: (id: string) => void;
  /** Quân đang được diễn ở giá treo cổ — tạm rời ghế. */
  dangDien: string | null;
  /** Hết ván: mọi thẻ ngửa lên. */
  latHet: boolean;
}) {
  const go = useTexGo();
  const viTriToi = Math.max(
    0,
    ghe.findIndex((g) => g.laToi),
  );
  const n = ghe.length;

  return (
    <group>
      <mesh position={[0, CAO_BAN, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[BAN_KINH_BAN, BAN_KINH_BAN * 0.97, 0.16, 96]} />
        <meshStandardMaterial attach="material-0" color="#3e2817" roughness={0.8} />
        <meshStandardMaterial attach="material-1" map={go} roughness={0.75} />
        <meshStandardMaterial attach="material-2" color="#2b1b10" roughness={0.9} />
      </mesh>
      <mesh position={[0, CAO_BAN / 2, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.6, CAO_BAN - 0.08, 24]} />
        <meshStandardMaterial color="#2e1e12" roughness={0.9} />
      </mesh>
      <Nen />
      {ghe.map((g, i) => {
        const goc = gocGhe(i, viTriToi, n);
        const theVt = diemTrenVong(goc, BAN_KINH_THE, CAO_BAN + 0.085);
        const coTheChon = chonDuoc.has(g.id);
        return (
          <group key={g.id}>
            <QuanNguoi
              g={g}
              goc={goc}
              coTheChon={coTheChon}
              daChon={daChon === g.id}
              an={dangDien === g.id}
              onChon={() => onChon(g.id)}
            />
            <TheBai
              position={theVt}
              rotation={new THREE.Euler(-Math.PI / 2, Math.PI / 2 - goc, 0, 'YXZ')}
              vai={g.vaiLo}
              ngua={latHet || g.laToi}
              toi={!g.conSong}
              mauVien={daChon === g.id ? '#ffcf6e' : g.laDongDoi ? '#7a2a1d' : '#1b140e'}
              onClick={(e) => {
                e.stopPropagation();
                if (coTheChon) onChon(g.id);
              }}
            />
          </group>
        );
      })}
    </group>
  );
}
