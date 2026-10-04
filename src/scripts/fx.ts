/**
 * Canvas effects, started by motion.ts only when the visitor allows motion.
 * - canvas[data-fx="lightning"]: bolts flash across the canvas; the element's
 *   CSS mask limits them to the skin area of the mouse.
 * An effect only runs while its element is on screen.
 */

/** Calls `frame(seconds)` on every animation frame while `el` is on screen. */
function whileVisible(el: Element, frame: (t: number) => void) {
  let raf = 0;
  const loop = (ms: number) => {
    frame(ms / 1000);
    raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry!.isIntersecting) raf = requestAnimationFrame(loop);
  }).observe(el);
}

// ---------------------------------------------------------------- lightning

type Bolt = { points: [number, number][]; width: number };

/** A jagged line from a to b (midpoint displacement), with optional forks. */
function bolt(a: [number, number], b: [number, number], sway: number, out: Bolt[], width: number) {
  let points: [number, number][] = [a, b];
  for (let pass = 0; pass < 5; pass++) {
    const next: [number, number][] = [points[0]!];
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1]!;
      const [x1, y1] = points[i]!;
      const nx = -(y1 - y0);
      const ny = x1 - x0;
      const k = (Math.random() - 0.5) * sway;
      next.push([(x0 + x1) / 2 + nx * k, (y0 + y1) / 2 + ny * k], [x1, y1]);
    }
    points = next;
  }
  out.push({ points, width });
  if (width > 1 && Math.random() < 0.8) {
    const from = points[Math.floor(points.length * (0.25 + Math.random() * 0.4))]!;
    const reach = Math.hypot(b[0] - a[0], b[1] - a[1]) * (0.3 + Math.random() * 0.3);
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) + (Math.random() - 0.5) * 1.6;
    bolt(from, [from[0] + Math.cos(angle) * reach, from[1] + Math.sin(angle) * reach], sway, out, width * 0.55);
  }
}

function startLightning(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('fx: 2D canvas context is not available');
  const SIZE = 360; // drawing resolution; CSS scales it to the image box
  canvas.width = SIZE;
  canvas.height = SIZE;

  let bolts: Bolt[] = [];
  let struckAt = -Infinity;
  let nextStrike = 0;
  const STRIKE_MS = 420;

  whileVisible(canvas, (t) => {
    const now = t * 1000;
    if (now >= nextStrike) {
      bolts = [];
      const edge = () => Math.random() * SIZE;
      // across the mouse, roughly along its length (top right to bottom left)
      bolt([SIZE * (0.55 + Math.random() * 0.4), edge() * 0.5], [SIZE * Math.random() * 0.45, SIZE * (0.5 + Math.random() * 0.5)], 0.55, bolts, 3);
      struckAt = now;
      nextStrike = now + 700 + Math.random() * 2400;
    }
    ctx.clearRect(0, 0, SIZE, SIZE);
    const age = (now - struckAt) / STRIKE_MS;
    if (age >= 1) return;
    // two quick flickers, then fade
    const flicker = age < 0.12 ? 1 : age < 0.2 ? 0.25 : age < 0.3 ? 0.9 : 1 - age;
    ctx.globalAlpha = Math.max(0, flicker);
    ctx.fillStyle = 'rgba(190, 170, 255, 0.22)'; // the whole skin lights up
    ctx.fillRect(4, 4, SIZE - 8, SIZE - 8);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgb(170, 140, 255)';
    ctx.strokeStyle = 'rgb(245, 240, 255)';
    for (const b of bolts) {
      ctx.shadowBlur = b.width * 5;
      ctx.lineWidth = b.width;
      ctx.beginPath();
      b.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

export function startEffects() {
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>('canvas[data-fx="lightning"]')) {
    startLightning(canvas);
  }
}
