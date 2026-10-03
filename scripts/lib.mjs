// Shared helpers for the verification scripts (check-links, check-launch, shots, visual-diff, smoke).
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// VERIFY_DIST points the scripts at another build output (used to test the scripts against fixtures).
export const DIST = process.env.VERIFY_DIST ? path.resolve(process.env.VERIFY_DIST) : path.join(ROOT, 'dist');

/** Minimal `--flag value` / `--flag` parser. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`Unexpected argument "${a}"`);
    const [k, inline] = a.slice(2).split('=', 2);
    if (inline !== undefined) out[k] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
    else out[k] = true;
  }
  return out;
}

/** `base` from astro.config.mjs, normalised to "/" or "/x/". */
export async function getBase(root = ROOT) {
  const cfgPath = path.join(root, 'astro.config.mjs');
  if (!existsSync(cfgPath)) return '/';
  const mod = await import(pathToFileURL(cfgPath).href);
  const base = mod.default?.base ?? '/';
  return ('/' + base + '/').replace(/\/+/g, '/');
}

export function requireDist(dist = DIST) {
  if (!existsSync(dist) || !statSync(dist).isDirectory()) {
    console.error(`dist/ not found at ${dist}. Run \`bun run build\` first.`);
    process.exit(1);
  }
}

export function walk(dir, filter = () => true) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

/** Every `index.html` in dist as a route relative to the base: "/" , "/skins/0003/". */
export function listRoutes(dist = DIST) {
  return walk(dist, (p) => path.basename(p) === 'index.html')
    .map((p) => '/' + path.relative(dist, path.dirname(p)).split(path.sep).filter(Boolean).map((s) => s + '/').join(''))
    .sort();
}

/** "/skins/0003/" -> "skins-0003", "/" -> "index". */
export function routeSlug(route) {
  const s = route.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  return s || 'index';
}

/** Absolute URL of a route on a server whose root is `origin`, honouring the base. */
export function routeUrl(origin, base, route) {
  return new URL((base + route.replace(/^\//, '')).replace(/\/+/g, '/'), origin).href;
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Starts `astro preview` on a free port. Returns { origin, stop }. Fails fast if it does not come up. */
export async function startPreview({ base = '/', timeoutMs = 30000 } = {}) {
  requireDist();
  const port = await freePort();
  const bin = path.join(ROOT, 'node_modules', '.bin', 'astro');
  const child = spawn(bin, ['preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  let exited = null;
  child.on('exit', (code) => (exited = code));
  const kill = () => {
    if (exited === null) child.kill('SIGTERM');
  };
  process.on('exit', kill);

  const origin = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (exited !== null) throw new Error(`astro preview exited with code ${exited}:\n${log}`);
    try {
      await fetch(origin + base);
      break;
    } catch {
      if (Date.now() > deadline) {
        kill();
        throw new Error(`astro preview did not answer on ${origin}${base} within ${timeoutMs} ms:\n${log}`);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  const stop = () =>
    new Promise((resolve) => {
      if (exited !== null) return resolve();
      child.once('exit', () => resolve());
      child.kill('SIGTERM');
    });
  return { origin, stop };
}

/** Uses `--url` when given (server must already run), otherwise starts its own preview. */
export async function getServer(args, base, { defaultUrl } = {}) {
  const url = args.url ?? (args.serve ? undefined : defaultUrl);
  if (url) {
    const origin = new URL(url).origin;
    try {
      await fetch(origin + base);
    } catch (e) {
      console.error(`No server answers at ${origin}${base} (${e.cause?.code ?? e.message}).`);
      console.error('Start one with `bun run build && bun run preview`, or pass --serve to let this script start it.');
      process.exit(1);
    }
    return { origin, stop: async () => {} };
  }
  return startPreview({ base });
}

/**
 * Brings a page into a deterministic state: fonts ready, lazy media loaded, network idle,
 * videos paused, CSS animations and transitions off.
 */
export async function settlePage(page) {
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
  await page.evaluate(() => document.fonts.ready);
  // Scroll through the page so loading="lazy" images load before a full-page screenshot.
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight / 2);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images]
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((r) => {
              img.addEventListener('load', r, { once: true });
              img.addEventListener('error', r, { once: true });
            }),
        ),
    );
    for (const v of document.querySelectorAll('video')) v.pause();
    await document.fonts.ready;
  });
}
