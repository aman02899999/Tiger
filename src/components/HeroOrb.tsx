import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, Ring, Torus } from "@react-three/drei";
import { AdditiveBlending, Color, MathUtils, type Group, type Mesh, type Points } from "three";

/* ═══════════════════════════════════════════════════════════════════
   THE TITAN CORE — interactive 3D hero scene
   ───────────────────────────────────────────────────────────────────
   A living "energy core": a distorting inner sphere, three orbiting
   gyroscope rings, a particle field and an orbiting solar node.
   The whole rig follows the pointer and reacts to click/drag.
   Palette follows the Aurora Performance system (teal / azure / solar).
   ═══════════════════════════════════════════════════════════════════ */

const AURORA = "#2dd4bf";
const AURORA_LIGHT = "#9df8e7";
const AZURE = "#3b9dff";
const SOLAR = "#ffb627";
const DEEP = "#0e7490";

/* ── Pointer-following rig ───────────────────────────────────────── */
function PointerRig({ children, intensity = 0.32 }: { children: React.ReactNode; intensity?: number }) {
  const group = useRef<Group>(null!);
  useFrame((state, delta) => {
    const { pointer } = state;
    // Damped follow keeps the motion silky instead of snapping.
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, pointer.x * intensity, 3, delta);
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -pointer.y * intensity, 3, delta);
  });
  return <group ref={group}>{children}</group>;
}

/* ── Pulsing energy core ─────────────────────────────────────────── */
function EnergyCore({ boost }: { boost: number }) {
  const mesh = useRef<Mesh>(null!);
  const inner = useRef<Mesh>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    mesh.current.rotation.y = t * 0.18;
    mesh.current.rotation.z = Math.sin(t * 0.3) * 0.14;
    // Breathing scale, amplified briefly after a click.
    const pulse = 1 + Math.sin(t * 1.5) * 0.035 + boost * 0.16;
    mesh.current.scale.setScalar(MathUtils.damp(mesh.current.scale.x, pulse, 6, delta));
    inner.current.rotation.y = -t * 0.42;
    inner.current.rotation.x = t * 0.25;
  });

  return (
    <group>
      <Icosahedron ref={mesh} args={[1.06, 12]}>
        <MeshDistortMaterial
          color={DEEP}
          roughness={0.14}
          metalness={0.92}
          distort={0.32}
          speed={1.6}
          emissive={new Color(AURORA)}
          emissiveIntensity={0.42 + boost * 0.5}
        />
      </Icosahedron>

      {/* Wireframe shell — gives the core visible 3D structure */}
      <Icosahedron ref={inner} args={[1.42, 1]}>
        <meshBasicMaterial color={AURORA_LIGHT} wireframe transparent opacity={0.14} />
      </Icosahedron>
    </group>
  );
}

/* ── Gyroscope rings ─────────────────────────────────────────────── */
function GyroRings({ boost }: { boost: number }) {
  const a = useRef<Mesh>(null!);
  const b = useRef<Mesh>(null!);
  const c = useRef<Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime * (1 + boost * 1.6);
    a.current.rotation.x = t * 0.55;
    a.current.rotation.y = t * 0.22;
    b.current.rotation.y = t * 0.48;
    b.current.rotation.z = t * 0.3;
    c.current.rotation.z = -t * 0.36;
    c.current.rotation.x = t * 0.2;
  });

  return (
    <group>
      <Torus ref={a} args={[1.85, 0.014, 12, 128]}>
        <meshStandardMaterial
          color={AURORA}
          emissive={new Color(AURORA)}
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </Torus>
      <Torus ref={b} args={[2.18, 0.011, 12, 128]}>
        <meshStandardMaterial
          color={AZURE}
          emissive={new Color(AZURE)}
          emissiveIntensity={2.1}
          toneMapped={false}
        />
      </Torus>
      <Torus ref={c} args={[2.52, 0.008, 12, 128]}>
        <meshStandardMaterial
          color={SOLAR}
          emissive={new Color(SOLAR)}
          emissiveIntensity={1.7}
          toneMapped={false}
        />
      </Torus>
    </group>
  );
}

/* ── Orbiting solar node ─────────────────────────────────────────── */
function OrbitNode() {
  const group = useRef<Group>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.6;
    group.current.rotation.x = Math.sin(t * 0.4) * 0.35;
  });
  return (
    <group ref={group}>
      <mesh position={[2.18, 0, 0]}>
        <sphereGeometry args={[0.075, 24, 24]} />
        <meshStandardMaterial
          color={SOLAR}
          emissive={new Color(SOLAR)}
          emissiveIntensity={3.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ── Particle field ──────────────────────────────────────────────── */
function ParticleField({ count = 340 }: { count?: number }) {
  const points = useRef<Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Spherical shell distribution so particles surround the core.
      const r = 2.9 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.62;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    points.current.rotation.y = t * 0.045;
    points.current.rotation.x = Math.sin(t * 0.12) * 0.1;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.032}
        color={AURORA_LIGHT}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ── Ground halo ─────────────────────────────────────────────────── */
function Halo() {
  const ring = useRef<Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = 1 + Math.sin(t * 0.9) * 0.05;
    ring.current.scale.set(s, s, s);
  });
  return (
    <Ring ref={ring} args={[2.72, 2.78, 96]} rotation={[-Math.PI / 2.1, 0, 0]} position={[0, -1.65, 0]}>
      <meshBasicMaterial
        color={AURORA}
        transparent
        opacity={0.3}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </Ring>
  );
}

/* ── Scene assembly ──────────────────────────────────────────────── */
function Scene({ boost }: { boost: number }) {
  const { viewport } = useThree();
  // Scale the whole rig down on narrow canvases so nothing clips.
  const scale = Math.min(1, viewport.width / 7);

  return (
    <group scale={scale}>
      <ambientLight intensity={0.55} />
      <pointLight position={[4, 4, 4]} intensity={80} color={AURORA_LIGHT} />
      <pointLight position={[-4, -2, 2]} intensity={55} color={AZURE} />
      <pointLight position={[0, -4, -2]} intensity={34} color={SOLAR} />
      <pointLight position={[0, 3, 3]} intensity={26} color="#ffffff" />

      <PointerRig>
        <Float speed={1.4} rotationIntensity={0.22} floatIntensity={0.55}>
          <EnergyCore boost={boost} />
          <GyroRings boost={boost} />
          <OrbitNode />
        </Float>
        <ParticleField />
        <Halo />
      </PointerRig>
    </group>
  );
}

export default function HeroOrb({ className = "" }: { className?: string }) {
  const [boost, setBoost] = useState(0);

  /** Click = "charge the core": a short energy surge. */
  function surge() {
    setBoost(1);
    window.setTimeout(() => setBoost(0), 620);
  }

  return (
    <div
      className={`${className} cursor-grab active:cursor-grabbing`}
      onPointerDown={surge}
      role="img"
      aria-label="Interactive 3D energy core visualisation"
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
      >
        {/* No <Environment>: it fetches an HDR from a CDN and would break
            the hero on restricted networks. Lights alone give the sheen. */}
        <Scene boost={boost} />
      </Canvas>
    </div>
  );
}
