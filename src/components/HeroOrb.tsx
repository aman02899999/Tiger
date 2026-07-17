import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { TorusKnot, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

function RotatingKnot() {
  const mesh = useRef<Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    mesh.current.rotation.x = t * 0.18;
    mesh.current.rotation.y = t * 0.24;
    mesh.current.position.y = Math.sin(t * 0.5) * 0.15;
  });
  return (
    <TorusKnot ref={mesh} args={[1, 0.32, 200, 24, 2, 5]}>
      <MeshDistortMaterial
        color="#7c3aed"
        roughness={0.25}
        metalness={0.7}
        distort={0.25}
        speed={1.8}
        emissive="#4c1d95"
        emissiveIntensity={0.35}
      />
    </TorusKnot>
  );
}

export default function HeroOrb({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        {/* No <Environment> — it fetches an HDR from a CDN and would crash the
            app if the network blocks it. Lights alone give the metallic look. */}
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 4, 4]} intensity={70} color="#c4b5fd" />
        <pointLight position={[-4, -2, 2]} intensity={50} color="#d8b35a" />
        <pointLight position={[0, -4, -2]} intensity={30} color="#e879f9" />
        <pointLight position={[0, 3, 3]} intensity={25} color="#ffffff" />
        <RotatingKnot />
      </Canvas>
    </div>
  );
}
