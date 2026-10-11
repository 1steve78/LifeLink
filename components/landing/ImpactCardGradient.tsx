"use client";

import { useEffect, useRef } from "react";
import { registerLandingGradientMirror } from "@/lib/landing-gradient";

export function ImpactCardGradient({ palette = 0 }: { palette?: 0 | 1 | 2 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return registerLandingGradientMirror(canvas);
  }, []);

  const paletteFilters = ["none", "hue-rotate(12deg)", "hue-rotate(-12deg)"];
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-45"
      style={{ filter: paletteFilters[palette] }}
    />
  );
}
