"use client";

import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  CRITICAL_POINTS,
  DOMAIN,
  T,
  T_MID,
  Tx,
  Ty,
  clampToDomain,
  contourSegments,
  tempToRgb,
  type CriticalPoint,
} from "@/lib/plate";

export type ViewName = "top" | "angled" | "side";

/** Vertical exaggeration: 46–54 °C maps to −0.8 … +0.8 scene units on a 3-unit-wide plate. */
const HEIGHT_SCALE = 0.2;
const SEGMENTS = 120;
const h = (t: number) => (t - T_MID) * HEIGHT_SCALE;

const VIEW_POSITIONS: Record<ViewName, [number, number, number]> = {
  top: [0, 6, 0.001],
  angled: [3.6, 3.4, 4.2],
  side: [0, 0.4, 6],
};

/* ---------- surface ---------- */

function Surface({ onProbe }: { onProbe: (x: number, y: number) => void }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(3, 3, SEGMENTS, SEGMENTS);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const t = T(x, y);
      pos.setZ(i, h(t));
      const [r, gr, b] = tempToRgb(t);
      c.setRGB(r / 255, gr / 255, b / 255, THREE.SRGBColorSpace);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // The surface lives in a group rotated −90° about X, so world (x, h, −y) ↔ plate (x, y).
  const handle = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onProbe(clampToDomain(e.point.x), clampToDomain(-e.point.z));
  };

  return (
    <mesh geometry={geometry} onPointerMove={handle} onPointerDown={handle}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.85} metalness={0} />
    </mesh>
  );
}

/* ---------- contour lines ---------- */

function Contours() {
  const geometry = useMemo(() => {
    const segs = contourSegments(SEGMENTS);
    const arr = new Float32Array(segs.length);
    for (let i = 0; i < segs.length; i += 3) {
      arr[i] = segs[i];
      arr[i + 1] = segs[i + 1];
      arr[i + 2] = h(segs[i + 2]) + 0.006;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry} raycast={() => null}>
      <lineBasicMaterial color="#111111" transparent opacity={0.45} />
    </lineSegments>
  );
}

/* ---------- gradient arrows on a 9×9 grid ---------- */

function GradientArrows() {
  const group = useMemo(() => {
    const g = new THREE.Group();
    const n = 9;
    const step = (DOMAIN.max - DOMAIN.min) / (n - 1);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = DOMAIN.min + i * step;
        const y = DOMAIN.min + j * step;
        const gx = Tx(x);
        const gy = Ty(y);
        const mag = Math.hypot(gx, gy);
        if (mag < 1e-6) continue;
        const dir = new THREE.Vector3(gx / mag, gy / mag, 0);
        const len = 0.1 + 0.045 * mag; // 0.1 … ~0.34
        const origin = new THREE.Vector3(x, y, h(T(x, y)) + 0.03);
        const arrow = new THREE.ArrowHelper(dir, origin, len, 0x111111, 0.07, 0.05);
        arrow.traverse((o) => {
          o.raycast = () => {};
        });
        g.add(arrow);
      }
    }
    return g;
  }, []);
  useEffect(
    () => () => {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    },
    [group],
  );
  return <primitive object={group} />;
}

/* ---------- critical points ---------- */

const MARKER: Record<CriticalPoint["kind"], { color: string; label: (p: CriticalPoint) => string }> = {
  max: { color: "#D7263D", label: (p) => `MAX ${p.T}°` },
  min: { color: "#1F4EA8", label: (p) => `MIN ${p.T}°` },
  saddle: { color: "#8A8A8A", label: () => "saddle" },
};

function CriticalMarkers({ portal }: { portal: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      {CRITICAL_POINTS.map((p) => {
        const m = MARKER[p.kind];
        const z = h(p.T);
        return (
          <group key={`${p.x},${p.y}`} position={[p.x, p.y, z]}>
            <mesh raycast={() => null}>
              <sphereGeometry args={[0.065, 24, 24]} />
              <meshStandardMaterial color={m.color} roughness={0.4} />
            </mesh>
            <Html portal={portal as RefObject<HTMLElement>} position={[0, 0, 0.22]} center style={{ pointerEvents: "none" }}>
              <span
                className="whitespace-nowrap px-1.5 py-0.5 font-mono text-xs font-bold text-white"
                style={{ background: m.color }}
              >
                {m.label(p)}
              </span>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function ProbeMarker({ x, y }: { x: number; y: number }) {
  const z = h(T(x, y));
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0, z + 0.04]} raycast={() => null}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* vertical drop line to the floor grid */}
      <mesh position={[0, 0, (z + 1.05) / 2 - 1.05]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.006, 0.006, z + 1.05, 6]} />
        <meshBasicMaterial color="#111111" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* ---------- camera views ---------- */

function CameraRig({ view }: { view: { name: ViewName; n: number } }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const get = useThree((s) => s.get);
  useEffect(() => {
    const [x, y, z] = VIEW_POSITIONS[view.name];
    // Portrait screens: step back so the whole plate fits horizontally.
    const { width, height } = get().size;
    const k = Math.max(1, 1.4 / (width / Math.max(height, 1)));
    camera.position.set(x * k, y * k, z * k);
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [view, camera, controls, get]);
  return null;
}

/* ---------- scene ---------- */

export default function PlateScene({
  probeX,
  probeY,
  showContours,
  showArrows,
  view,
  onProbe,
}: {
  probeX: number;
  probeY: number;
  showContours: boolean;
  showArrows: boolean;
  view: { name: ViewName; n: number };
  onProbe: (x: number, y: number) => void;
}) {
  // drei <Html> labels mount into this layer. Giving them a fixed target avoids a race
  // where the first label's root is recreated when R3F connects events and never re-renders.
  const labels = useRef<HTMLDivElement>(null);
  return (
    <div className="relative h-full w-full">
    <Canvas
      camera={{ position: VIEW_POSITIONS.angled, fov: 40, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      className="touch-none"
    >
      <color attach="background" args={["#ffffff"]} />
      <hemisphereLight args={["#ffffff", "#bbbbbb", 1.6]} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />

      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Surface onProbe={onProbe} />
        {showContours && <Contours />}
        {showArrows && <GradientArrows />}
        <CriticalMarkers portal={labels} />
        <ProbeMarker x={probeX} y={probeY} />
        <Html portal={labels as RefObject<HTMLElement>} position={[1.85, 0, -1.05]} center style={{ pointerEvents: "none" }}>
          <span className="font-mono text-xs font-bold text-ink">+x</span>
        </Html>
        <Html portal={labels as RefObject<HTMLElement>} position={[0, 1.85, -1.05]} center style={{ pointerEvents: "none" }}>
          <span className="font-mono text-xs font-bold text-ink">+y</span>
        </Html>
      </group>

      <gridHelper args={[4, 16, "#c8c8c8", "#e3e3e3"]} position={[0, -1.05, 0]} />

      <OrbitControls makeDefault enableDamping minDistance={2.5} maxDistance={14} target={[0, 0, 0]} />
      <CameraRig view={view} />
    </Canvas>
    <div ref={labels} className="pointer-events-none absolute inset-0 overflow-hidden" />
    </div>
  );
}
