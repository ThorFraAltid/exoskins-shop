// Full-page screenshots of every route in dist at 390, 768, 1024, 1440, 1920 + horizontal-overflow report.
//
// Usage: node scripts/shots.mjs [--url http://localhost:4321] [--widths 390,1440]
//   Without --url it starts `astro preview` on a free port itself (needs dist/) and stops it afterwards.
// Output: shots/<width>/<route>.png  ("/" -> index.png, "/skins/0003/" -> skins-0003.png).
// Exit 1 if any route/width has horizontal overflow (document scrollWidth > clientWidth) or does not return 200.
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { getBase, getServer, listRoutes, parseArgs, requireDist, ROOT, routeSlug, routeUrl, settlePage } from './lib.mjs';

const args = parseArgs();
const widths = args.widths ? String(args.widths).split(',').map(Number) : [390, 768, 1024, 1440, 1920];
const heightFor = (w) => (w < 768 ? 844 : w < 1240 ? 1024 : 900);

requireDist();
const routes = listRoutes();
if (!routes.length) {
  console.error('No index.html files in dist/.');
  process.exit(1);
}
const base = await getBase();
const server = await getServer(args, base);
const browser = await chromium.launch();
const outRoot = path.join(ROOT, 'shots');
rmSync(outRoot, { recursive: true, force: true });
let failed = false;

try {
  for (const width of widths) {
    mkdirSync(path.join(outRoot, String(width)), { recursive: true });
    const context = await browser.newContext({
      viewport: { width, height: heightFor(width) },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    for (const route of routes) {
      const page = await context.newPage();
      const url = routeUrl(server.origin, base, route);
      const res = await page.goto(url, { waitUntil: 'networkidle' });
      if (!res || res.status() !== 200) {
        console.log(`FAIL ${width} ${route}: HTTP ${res?.status()}`);
        failed = true;
        await page.close();
        continue;
      }
      await settlePage(page);
      const file = path.join(outRoot, String(width), `${routeSlug(route)}.png`);
      await page.screenshot({ fullPage: true, path: file });

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const vw = doc.clientWidth;
        const describe = (el) => {
          let s = el.tagName.toLowerCase();
          if (el.id) s += '#' + el.id;
          for (const a of ['data-figma', 'data-card', 'data-slider', 'data-menu']) if (el.hasAttribute(a)) s += `[${a}${el.getAttribute(a) ? `="${el.getAttribute(a)}"` : ''}]`;
          if (el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.');
          return s;
        };
        // An element clipped by an ancestor with overflow other than visible does not widen the page.
        const clipped = (el) => {
          for (let p = el.parentElement; p && p !== doc; p = p.parentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox !== 'visible' && p.getBoundingClientRect().right <= vw + 0.5) return true;
          }
          return false;
        };
        const offenders = [];
        for (const el of document.body.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.right + window.scrollX > vw + 0.5 && !clipped(el)) {
            offenders.push({ el: describe(el), right: Math.round(r.right + window.scrollX), width: Math.round(r.width) });
          }
        }
        return { scrollWidth: doc.scrollWidth, clientWidth: vw, has: doc.scrollWidth > vw, offenders };
      });

      if (overflow.has) {
        failed = true;
        console.log(`OVERFLOW ${width} ${route}: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`);
        for (const o of overflow.offenders.slice(0, 25)) console.log(`    ${o.el}  right=${o.right}  width=${o.width}`);
        if (overflow.offenders.length > 25) console.log(`    ... ${overflow.offenders.length - 25} more`);
      } else {
        const extra = overflow.offenders.length ? ` (${overflow.offenders.length} elements past the right edge but no page scroll)` : '';
        console.log(`ok       ${width} ${route}${extra}`);
      }
      console.log(`         -> ${path.relative(ROOT, file)}`);
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  await server.stop();
}

console.log(failed ? '\nshots: FAIL (see above)' : '\nshots: PASS, no horizontal overflow');
process.exit(failed ? 1 : 0);
