"use client";

import dynamic from "next/dynamic";

const NeuralNetworkCanvas = dynamic(
  () =>
    import("@/components/neural-network-canvas").then((m) => ({
      default: m.NeuralNetworkCanvas,
    })),
  { ssr: false }
);

export function NeuralBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <NeuralNetworkCanvas state="idle" />
    </div>
  );
}
