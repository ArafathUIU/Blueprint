"use client";

import { Canvas } from "@react-three/fiber";
import { ParticleRing } from "./particle-ring";

interface ParticleRingCanvasProps {
  state?: "idle" | "streaming" | "complete" | "error";
}

export function ParticleRingCanvas({ state = "idle" }: ParticleRingCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 4.5], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: "#18181B" }}
    >
      <ParticleRing state={state} />
    </Canvas>
  );
}
