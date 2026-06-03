"use client";

import { useRef, useEffect } from "react";

interface WaveformProps {
  className?: string;
  state?: "idle" | "streaming" | "complete" | "error";
}

export function AudioWaveform({ className = "", state = "idle" }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 60;
    const heights = Array.from({ length: barCount }, () => 2 + Math.random() * 10);
    barsRef.current = heights;

    function draw() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const barW = (w / barCount) * 0.7;
      const gap = (w / barCount) * 0.3;

      const isActive = state === "streaming" || state === "complete";
      const speed = state === "streaming" ? 0.15 : state === "complete" ? 0.05 : 0.02;

      ctx!.clearRect(0, 0, w, h);

      for (let i = 0; i < barCount; i++) {
        const phase = performance.now() * 0.001 * (1 + i * 0.1) * speed * 20;
        const noise = Math.sin(phase) * 0.5 + 0.5;

        let height: number;
        if (isActive) {
          height = barsRef.current[i] + noise * 12;
          // Occasional spikes
          if (Math.sin(phase * 3.7) > 0.95) height += Math.random() * 8;
        } else {
          height = barsRef.current[i] + noise * 3;
        }

        const x = i * (barW + gap);
        const y = h / 2 - height / 2;
        const alpha = isActive ? 0.6 + noise * 0.3 : 0.1 + noise * 0.1;

        // Gradient from red at base to white at peak
        const gradient = ctx!.createLinearGradient(0, h / 2 + height / 2, 0, h / 2 - height / 2);
        gradient.addColorStop(0, `rgba(220, 38, 38, ${alpha * 0.3})`);
        gradient.addColorStop(0.5, `rgba(220, 38, 38, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.6})`);

        ctx!.fillStyle = gradient;

        // Rounded bar
        const radius = Math.min(barW / 2, 2);
        roundRect(ctx!, x, y, barW, height, radius);
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
