"use client";

import { useEffect, useRef } from "react";
import { registerLandingGradientMirror } from "@/lib/landing-gradient";

export function FooterGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return registerLandingGradientMirror(canvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
