import type { LoaiVaiCongKhai } from '@moonvillage/shared';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { CAO_BAN, tienToi, VI_TRI_GIA_TREO } from './dungChung';
import { TheBai } from './TheBai';

const MAU_VAI: Record<LoaiVaiCongKhai, string> = {
  Soi: '#e0533a',
  BaoVe: '#7fb3dd',
  TienTri: '#b9a0ea',
  PhuThuy: '#6cc8a9',
  ThoSan: '#e29a52',
  DanLang: '#e0c896',
};

/** Thời gian đã trôi từ lúc khoảnh khắc bắt đầu — mỗi lần gắn lại là đếm từ đầu. */
function useDongHoRieng() {
  const batDau = useRef<number | null>(null);
  return (t: number) => {
    batDau.current ??= t;
    return t - batDau.current;
  };
}

/**
 * Gọi vai: lá thẻ của vai đó trồi lên từ ánh nến giữa bàn, xoay mặt về phía người xem rồi lật
 * ngửa — tranh khắc hiện ra trong quầng sáng màu vai. Thứ tự bước đêm vốn công khai (Q05).
 */
export function GoiVai3D({ vai }: { vai: LoaiVaiCongKhai }) {
  const nhom = useRef<THREE.Group>(null);
  const den = useRef<THREE.PointLight>(null);
  const dongHo = useDongHoRieng();
  const [ngua, setNgua] = useState(false);

  useFrame(({ clock }, dt) => {
    const t = dongHo(clock.elapsedTime);
    if (!ngua && t > 0.35) setNgua(true);
    const g = nhom.current;
    if (g) {
      g.position.y = tienToi(g.position.y, CAO_BAN + 1.75 + Math.sin(t * 1.6) * 0.06, 3.2, dt);
      const s = tienToi(g.scale.x, 2.1, 3, dt);
      g.scale.setScalar(s);
    }
    if (den.current) den.current.intensity = tienToi(den.current.intensity, 14, 2.5, dt);
  });

  return (
    <group ref={nhom} position={[0, CAO_BAN + 0.2, 0.4]} scale={0.4}>
      <Billboard>
        <TheBai vai={vai} ngua={ngua} mauVien={MAU_VAI[vai]} />
      </Billboard>
      <pointLight
        ref={den}
        color={MAU_VAI[vai]}
        intensity={0}
        distance={7}
        position={[0, 0, 0.6]}
      />
    </group>
  );
}

/**
 * Giá treo cổ dựng lên từ dưới đất sau bàn, sợi dây thả xuống, quân người bị treo rơi vào thòng
 * lọng rồi đung đưa tắt dần và xám lại. Không lộ vai — người bị treo vẫn là quân gỗ trơn.
 */
export function GiaTreo3D() {
  const khung = useRef<THREE.Group>(null);
  const day = useRef<THREE.Group>(null);
  const quan = useRef<THREE.Group>(null);
  const vlQuan = useRef<THREE.MeshStandardMaterial>(null);
  const dongHo = useDongHoRieng();
  const xam = new THREE.Color('#55585e');

  useFrame(({ clock }, dt) => {
    const t = dongHo(clock.elapsedTime);
    if (khung.current) khung.current.position.y = tienToi(khung.current.position.y, 0, 4, dt);
    if (day.current) day.current.scale.y = tienToi(day.current.scale.y, t > 0.8 ? 1 : 0.001, 6, dt);
    if (quan.current) {
      const roi = t > 1.3;
      quan.current.position.y = tienToi(quan.current.position.y, roi ? 0 : 3, roi ? 9 : 20, dt);
      // Dao động tắt dần quanh điểm buộc dây.
      const s = Math.max(0, t - 1.5);
      quan.current.rotation.z = roi ? Math.sin(s * 2.6) * 0.32 * Math.exp(-s * 0.55) : 0;
      quan.current.visible = t > 1.2;
    }
    if (vlQuan.current && t > 3.4) vlQuan.current.color.lerp(xam, 1 - Math.exp(-1.6 * dt));
  });

  const go = <meshStandardMaterial color="#3a2618" roughness={0.95} />;
  return (
    <group position={VI_TRI_GIA_TREO}>
      <group ref={khung} position={[0, -5, 0]}>
        <mesh position={[-0.9, 0.2, 0]} receiveShadow>
          <boxGeometry args={[3.4, 0.4, 1.6]} />
          {go}
        </mesh>
        <mesh position={[-1.6, 2.2, 0]} castShadow>
          <boxGeometry args={[0.24, 4.2, 0.24]} />
          {go}
        </mesh>
        <mesh position={[-0.5, 4.2, 0]} castShadow>
          <boxGeometry args={[2.5, 0.22, 0.22]} />
          {go}
        </mesh>
        <mesh position={[-1.25, 3.7, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.14, 1.1, 0.14]} />
          {go}
        </mesh>
      </group>
      {/* Sợi dây: gốc ở xà ngang, co giãn theo trục y. */}
      <group position={[0.55, 4.1, 0]}>
        <group ref={day} scale={[1, 0.001, 1]}>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.1, 8]} />
            <meshStandardMaterial color="#c9a774" roughness={0.9} />
          </mesh>
        </group>
        <group ref={quan}>
          <mesh position={[0, -1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.025, 8, 24]} />
            <meshStandardMaterial color="#c9a774" />
          </mesh>
          <mesh position={[0, -1.48, 0]} castShadow>
            <sphereGeometry args={[0.19, 24, 18]} />
            <meshStandardMaterial ref={vlQuan} color="#d8c7a4" roughness={0.6} />
          </mesh>
          <mesh position={[0, -2.1, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.26, 0.86, 24]} />
            <meshStandardMaterial color="#3b2b20" roughness={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Mũi tên cuối cùng của Thợ săn bay ngang cảnh, cắm vào người trúng — không lộ ai bắn (Q09). */
export function MuiTen3D({ dich }: { dich: [number, number, number] }) {
  const ten = useRef<THREE.Group>(null);
  const dongHo = useDongHoRieng();
  const tu = new THREE.Vector3(-12, 2.6, dich[2] + 1.5);
  const den = new THREE.Vector3(dich[0] - 0.25, 0.75, dich[2]);

  useFrame(({ clock }) => {
    const t = dongHo(clock.elapsedTime);
    const p = Math.min(1, t / 0.5);
    const e = p * p; // tăng tốc như mũi tên rời dây cung
    if (ten.current) {
      ten.current.position.lerpVectors(tu, den, e);
      ten.current.position.y += Math.sin(p * Math.PI) * 0.6;
      ten.current.lookAt(den);
    }
  });

  return (
    <group ref={ten}>
      <group rotation={[0, -Math.PI / 2, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 1.3, 8]} />
          <meshStandardMaterial color="#d6c09a" />
        </mesh>
        <mesh position={[0.68, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.05, 0.14, 8]} />
          <meshStandardMaterial color="#9aa3ad" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-0.6, 0, 0]}>
          <boxGeometry args={[0.16, 0.1, 0.01]} />
          <meshStandardMaterial color="#b0402e" />
        </mesh>
      </group>
    </group>
  );
}
