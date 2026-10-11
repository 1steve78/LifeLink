"use client";

import { useEffect, useRef } from "react";
import { NeatGradient } from "@firecms/neat";

const PALETTES = [
  ["#D82C4B", "#F3E3DA", "#9634A4", "#DA9761"],
  ["#E23B42", "#F3E3DA", "#DA9761", "#B37D99"],
  ["#D82C4B", "#F3E3DA", "#B37D99", "#DA9761"],
] as const;

export function ImpactCardGradient({ palette = 0 }: { palette?: 0 | 1 | 2 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let gradient: NeatGradient | null = null;
    try {
      gradient = new NeatGradient({
        ref: canvas,
        colors: PALETTES[palette].map((color) => ({ color, enabled: true })),
        speed: 2,
        horizontalPressure: 4,
        verticalPressure: 3,
        waveAmplitude: 4,
        secondaryWaveEnabled: false,
        shadows: 2,
        highlights: 5,
        colorBrightness: 1,
        colorSaturation: 6,
        backgroundColor: "#FFFFFF",
        backgroundAlpha: 0,
        resolution: 0.5,
        iridescenceEnabled: true,
        iridescenceIntensity: 0.25,
        iridescenceSpeed: 0.6,
        cameraLock: true,
      });
    } catch {
      // Keep the card's static background if WebGL is unavailable.
    }

    return () => gradient?.destroy();
  }, [palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-45"
    />
  );
}
