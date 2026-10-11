type GradientInstance = {
  destroy: () => void;
};

const mirrors = new Map<HTMLCanvasElement, CanvasRenderingContext2D>();
const COLORS = ["#FD113F", "#90E0FF", "#FFC858", "#753BFF", "#f5e1e5", "#B8D4E6"];

let sourceCanvas: HTMLCanvasElement | null = null;
let gradient: GradientInstance | null = null;
let initializing = false;
let animationFrame = 0;
let lastFrameTime = 0;

function startAnimation() {
  if (animationFrame || !gradient || mirrors.size === 0) return;

  const draw = (timestamp: number) => {
    animationFrame = requestAnimationFrame(draw);
    if (timestamp - lastFrameTime < 1000 / 30) return;
    lastFrameTime = timestamp;

    if (!sourceCanvas) return;
    const source = sourceCanvas;

    mirrors.forEach((context, target) => {
      const width = target.clientWidth;
      const height = target.clientHeight;
      if (!width || !height || !source.width || !source.height) return;

      if (target.width !== width || target.height !== height) {
        target.width = width;
        target.height = height;
      }

      const aspectRatio = width / height;
      let cropWidth = source.width;
      let cropHeight = source.width / aspectRatio;
      if (cropHeight > source.height) {
        cropHeight = source.height;
        cropWidth = source.height * aspectRatio;
      }

      context.clearRect(0, 0, width, height);
      context.drawImage(
        source,
        (source.width - cropWidth) / 2,
        (source.height - cropHeight) / 2,
        cropWidth,
        cropHeight,
        0,
        0,
        width,
        height
      );
    });
  };

  animationFrame = requestAnimationFrame(draw);
}

function stopAnimation() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  lastFrameTime = 0;
}

function initializeGradient() {
  if (!sourceCanvas || gradient || initializing) return;

  const canvas = sourceCanvas;
  initializing = true;

  void import("@firecms/neat")
    .then(({ NeatGradient }) => {
      if (sourceCanvas !== canvas) return;

      gradient = new NeatGradient({
        ref: canvas,
        colors: COLORS.map((color, index) => ({ color, enabled: index < 4 })),
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
        backgroundAlpha: 0,
        grainScale: 0,
        grainSparsity: 0,
        grainIntensity: 0,
        grainSpeed: 0,
        flowEnabled: false,
        preserveDrawingBuffer: true,
      });
      startAnimation();
    })
    .catch((error: unknown) => {
      console.error("Failed to initialize the landing gradient:", error);
    })
    .finally(() => {
      initializing = false;
      if (sourceCanvas && sourceCanvas !== canvas && !gradient) initializeGradient();
    });
}

export function registerLandingGradientSource(canvas: HTMLCanvasElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  if (sourceCanvas && sourceCanvas !== canvas) {
    gradient?.destroy();
    gradient = null;
    stopAnimation();
  }
  sourceCanvas = canvas;
  initializeGradient();

  return () => {
    if (sourceCanvas !== canvas) return;
    sourceCanvas = null;
    gradient?.destroy();
    gradient = null;
    stopAnimation();
  };
}

export function registerLandingGradientMirror(canvas: HTMLCanvasElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const context = canvas.getContext("2d");
  if (!context) {
    console.error("Unable to create a 2D context for a landing gradient mirror.");
    return () => {};
  }

  mirrors.set(canvas, context);
  if (gradient) startAnimation();

  return () => {
    mirrors.delete(canvas);
    if (mirrors.size === 0 && !sourceCanvas) stopAnimation();
  };
}
