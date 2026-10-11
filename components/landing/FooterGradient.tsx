"use client";

import { useEffect, useRef } from "react";
import { NeatGradient } from "@firecms/neat";

const COLORS = ["#FD113F", "#90E0FF", "#FFC858", "#753BFF", "#f5e1e5", "#B8D4E6"];

export function FooterGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let gradient: NeatGradient | null = null;
    try {
      gradient = new NeatGradient({
        ref: canvas,
        colors: COLORS.map((color, index) => ({
          color,
          enabled: index < 4,
        })),
        speed: 2,
        horizontalPressure: 5,
        verticalPressure: 6,
        waveFrequencyX: 1,
        waveFrequencyY: 2,
        waveAmplitude: 10,
        secondaryWaveEnabled: false,
        shadows: 0,
        highlights: 7,
        colorBrightness: 1.05,
        colorSaturation: 0,
        colorBlending: 9,
        backgroundColor: "#07050e",
        backgroundAlpha: 1,
        grainScale: 0,
        grainSparsity: 0,
        grainIntensity: 0,
        grainSpeed: 0,
        flowEnabled: false,
      });
    } catch {
      // Keep the CSS gradient fallback if WebGL is unavailable.
    }

    return () => {
      gradient?.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
