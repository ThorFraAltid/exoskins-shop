/**
 * Canvas effects, started by motion.ts only when the visitor allows motion.
 * - [data-fx="flow"]: the image's texture glides around a centre in an endless
 *   loop (WebGL), used on the dragon card so the body moves through its coil.
 * - canvas[data-fx="lightning"]: bolts flash across the canvas; the element's
 *   CSS mask limits them to the skin area of the mouse.
 * Every effect only runs while its element is on screen.
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

// ---------------------------------------------------------------- flow (dragon)

const FLOW_VERTEX = `
attribute vec2 pos;
varying vec2 uv;
void main() {
  uv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

/**
 * Two copies of the texture are rotated around the coil centre, half a cycle
 * apart, and cross-faded so each copy resets while it is invisible: the scales
 * travel along the body forever without the picture ever turning.
 */
const FLOW_FRAGMENT = `
precision mediump float;
varying vec2 uv;
uniform sampler2D tex;
uniform float time;
uniform vec2 boxSize;
uniform vec2 imgSize;

const vec2 CENTRE = vec2(0.47, 0.50);   // coil centre in the image
const float CYCLE = 3.2;                // seconds per cross-fade cycle
const float SWEEP = 0.16;               // radians travelled per cycle (more = ghosting)
const float ZOOM = 1.10;                // keeps rotated samples inside the image

vec2 coverUv(vec2 p) {
  // object-fit: cover
  float box = boxSize.x / boxSize.y;
  float img = imgSize.x / imgSize.y;
  vec2 scale = box > img ? vec2(1.0, img / box) : vec2(box / img, 1.0);
  return (p - 0.5) * scale / ZOOM + 0.5;
}

vec4 sampleRotated(vec2 p, float angle) {
  float aspect = imgSize.x / imgSize.y;
  vec2 d = p - CENTRE;
  d.x *= aspect;
  // the body undulates a little as it moves
  float r = length(d);
  angle += 0.035 * sin(3.0 * atan(d.y, d.x) + 9.0 * r - time * 1.3);
  float c = cos(angle);
  float s = sin(angle);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  d.x /= aspect;
  return texture2D(tex, clamp(CENTRE + d, 0.0, 1.0));
}

void main() {
  vec2 p = coverUv(vec2(uv.x, 1.0 - uv.y));
  float phaseA = fract(time / CYCLE);
  float phaseB = fract(time / CYCLE + 0.5);
  vec4 a = sampleRotated(p, (phaseA - 0.5) * SWEEP);
  vec4 b = sampleRotated(p, (phaseB - 0.5) * SWEEP);
  gl_FragColor = mix(a, b, abs(1.0 - 2.0 * phaseA));
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`fx: shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

async function startFlow(media: HTMLElement) {
  const img = media.querySelector('img');
  if (!img) throw new Error('fx: [data-fx="flow"] has no <img>');
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
  // No WebGL on this device: the still image stays, which is the designed card.
  if (!gl) return;

  await img.decode();

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, FLOW_VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FLOW_FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`fx: program failed to link: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const uTime = gl.getUniformLocation(program, 'time');
  const uBox = gl.getUniformLocation(program, 'boxSize');
  gl.uniform2f(gl.getUniformLocation(program, 'imgSize'), img.naturalWidth, img.naturalHeight);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.round(media.clientWidth * dpr);
    canvas.height = Math.round(media.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uBox, canvas.width, canvas.height);
  };
  resize();
  new ResizeObserver(resize).observe(media);

  media.append(canvas);
  whileVisible(media, (t) => {
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });
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
  for (const media of document.querySelectorAll<HTMLElement>('[data-fx="flow"]')) void startFlow(media);
  for (const canvas of document.querySelectorAll<HTMLCanvasElement>('canvas[data-fx="lightning"]')) {
    startLightning(canvas);
  }
}
