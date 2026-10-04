// Per-section geometry gate + pixel diff against the Figma renders at 1440.
//
// Usage: node scripts/visual-diff.mjs [--url http://localhost:4321] [--serve] [--page home|item]
//   --url    origin of a running `astro preview` (default http://localhost:4321); the astro `base` is appended.
//   --serve  start `astro preview` on a free port instead (needs dist/).
//
// For every section in design-source/figma/sections.json it finds `[data-figma="<node>"]`, compares the
// element's page box with the Figma box (dx, dy, dw, dh) and writes to visual-diff/<page>/:
//   <Section>.png       Figma crop left, site crop right
//   <Section>-diff.png  pixelmatch diff (threshold 0.1, includeAA false) over the Figma box size
//   full.png            full-page screenshot of the site
// Exit 1 if a section is missing, |dx| > 2, |dw| > 2, |dh| > 2, or dy jumps by more than 2 against the
// previous found section (one early vertical offset is reported but does not fail every later section).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { getBase, getServer, parseArgs, ROOT, routeUrl, settlePage } from './lib.mjs';

const TOL = 2;
const PAGES = { home: '/', item: '/skins/0003/' };

const args = parseArgs();
const base = await getBase();
const sections = JSON.parse(readFileSync(path.join(ROOT, 'design-source/figma/sections.json'), 'utf8'));
const pageNames = args.page ? [args.page] : Object.keys(PAGES);
for (const p of pageNames) if (!PAGES[p]) throw new Error(`Unknown --page "${p}" (expected ${Object.keys(PAGES).join(', ')})`);

/** Copies a w x h region at (x, y) out of src; pixels outside src stay transparent. */
function crop(src, x, y, w, h) {
  const out = new PNG({ width: Math.max(1, w), height: Math.max(1, h) });
  for (let row = 0; row < h; row++) {
    const sy = y + row;
    if (sy < 0 || sy >= src.height) continue;
    for (let col = 0; col < w; col++) {
      const sx = x + col;
      if (sx < 0 || sx >= src.width) continue;
      const si = (sy * src.width + sx) * 4;
      const di = (row * w + col) * 4;
      src.data.copy(out.data, di, si, si + 4);
    }
  }
  return out;
}

function sideBySide(a, b, gap = 16) {
  const out = new PNG({ width: a.width + gap + b.width, height: Math.max(a.height, b.height) });
  out.data.fill(0);
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255; // opaque black background and gap
  PNG.bitblt(a, out, 0, 0, a.width, a.height, 0, 0);
  PNG.bitblt(b, out, 0, 0, b.width, b.height, a.width + gap, 0);
  return out;
}

const fmt = (n) => (n === null ? '-' : (n > 0 ? '+' : '') + n);
const server = await getServer(args, base, { defaultUrl: 'http://localhost:4321' });
const browser = await chromium.launch();
let failed = false;

try {
  for (const pageName of pageNames) {
    const spec = sections[pageName];
    const outDir = path.join(ROOT, 'visual-diff', pageName);
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const url = routeUrl(server.origin, base, PAGES[pageName]);
    const res = await page.goto(url, { waitUntil: 'networkidle' });
    console.log(`\n${pageName}  ${url}  (HTTP ${res?.status()})`);
    if (!res || res.status() !== 200) {
      console.log(`  FAIL: page did not return 200, no sections can be measured.`);
      failed = true;
      await context.close();
      continue;
    }
    await settlePage(page);

    const fullPath = path.join(outDir, 'full.png');
    const shot = PNG.sync.read(await page.screenshot({ fullPage: true, path: fullPath }));
    const figma = PNG.sync.read(readFileSync(path.join(ROOT, 'design-source/figma', spec.render)));

    const rows = [];
    let prevDy = null;
    for (const [name, f] of Object.entries(spec.sections)) {
      const els = await page.$$(`[data-figma="${f.node}"]`);
      const row = { name, node: f.node, found: els.length > 0, dx: null, dy: null, dw: null, dh: null, diff: null, notes: [], warn: [] };
      if (els.length > 1) row.warn.push(`${els.length} elements match, used the first`);
      if (!row.found) {
        row.notes.push('missing');
        failed = true;
        rows.push(row);
        continue;
      }
      const box = await els[0].evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
      });
      row.dx = Math.round(box.x - f.x);
      row.dy = Math.round(box.y - f.y);
      row.dw = Math.round(box.w - f.w);
      row.dh = Math.round(box.h - f.h);
      // dxFree / dyFree in sections.json: a documented, intended offset from Figma (reported, not gated).
      if (f.dyFree) row.warn.push(`dy not gated: ${f.dyFree}`);
      if (Math.abs(row.dx) > TOL && !f.dxFree) row.notes.push('dx');
      if (Math.abs(row.dw) > TOL) row.notes.push('dw');
      if (Math.abs(row.dh) > TOL) row.notes.push('dh');
      if (!f.dyFree && prevDy !== null && Math.abs(row.dy - prevDy) > TOL) row.notes.push(`dy jumps ${fmt(row.dy - prevDy)} vs previous`);
      prevDy = row.dy;
      if (row.notes.length) failed = true;

      const fCrop = crop(figma, f.x, f.y, f.w, f.h);
      const sCrop = crop(shot, Math.round(box.x), Math.round(box.y), Math.round(box.w), Math.round(box.h));
      writeFileSync(path.join(outDir, `${name}.png`), PNG.sync.write(sideBySide(fCrop, sCrop)));

      // Diff over the Figma box size, both crops anchored at their own top-left corner.
      const sSame = crop(shot, Math.round(box.x), Math.round(box.y), f.w, f.h);
      const diff = new PNG({ width: f.w, height: f.h });
      const mismatched = pixelmatch(fCrop.data, sSame.data, diff.data, f.w, f.h, { threshold: 0.1, includeAA: false });
      writeFileSync(path.join(outDir, `${name}-diff.png`), PNG.sync.write(diff));
      row.diff = ((mismatched / (f.w * f.h)) * 100).toFixed(1);
      rows.push(row);
    }

    const header = ['section', 'node', 'found', 'dx', 'dy', 'dw', 'dh', 'diff %', 'fails', 'warnings'];
    const table = rows.map((r) => [r.name, r.node, r.found ? 'yes' : 'NO', fmt(r.dx), fmt(r.dy), fmt(r.dw), fmt(r.dh), r.diff ?? '-', r.notes.join(', '), r.warn.join(', ')]);
    const widths = header.map((h, i) => Math.max(h.length, ...table.map((t) => String(t[i]).length)));
    const line = (cells) => '  ' + cells.map((c, i) => String(c).padEnd(widths[i])).join('  ');
    console.log(line(header));
    console.log(line(widths.map((w) => '-'.repeat(w))));
    table.forEach((t) => console.log(line(t)));
    console.log(`  full page: ${path.relative(ROOT, fullPath)} (${shot.width}x${shot.height}, Figma ${figma.width}x${figma.height})`);
    await context.close();
  }
} finally {
  await browser.close();
  await server.stop();
}

console.log(failed ? '\nvisual-diff: FAIL' : '\nvisual-diff: PASS');
process.exit(failed ? 1 : 0);
