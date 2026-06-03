"use client";

import { Canvas } from "@react-three/fiber";
import { NeuralNetwork } from "./neural-network";

interface NeuralNetworkCanvasProps {
  state?: "idle" | "streaming" | "complete" | "error";
}

export function NeuralNetworkCanvas({ state = "idle" }: NeuralNetworkCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: "#18181B" }}
    >
      <NeuralNetwork state={state} />
    </Canvas>
  );
}
