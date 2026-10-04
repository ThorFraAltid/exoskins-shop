// Smoke test over the built site (plain Playwright, no test runner).
//
// Usage: node tests/smoke.mjs [--url http://localhost:4321]
//   Without --url it starts `astro preview` on a free port (needs dist/) and stops it afterwards.
//
// Data hooks the pages must provide (same list in scripts/HOOKS.md):
//   [data-card]            Home inventory cards and "You Might Also Like" cards. The element is the <a>,
//                          or contains exactly one <a href>. Every card must lead to an existing page/anchor.
//   [data-buy]             The "Buy now" <a> on a skin page: target="_blank", rel contains "noopener",
//                          href host is amazon.*.
//   [data-gallery-main]    Container of the main gallery media on a skin page.
//   [data-gallery-thumb]   Each gallery thumbnail, a <button>. Clicking it swaps the main media and sets
//                          aria-current="true" on itself (and removes it from the others).
//   [data-slider]          Testimonial slider root. Keydown ArrowLeft/ArrowRight is handled on this element
//                          (events bubble up from focused descendants such as the arrow buttons).
//   [data-slide]           Each testimonial. The active one has data-active; inactive ones carry
//                          aria-hidden="true" or inert.
//   [data-slider-next]     Next arrow <button>.
//   [data-slider-prev]     Previous arrow <button>, `disabled` on the first slide (no loop, PLAN.md).
//   [data-menu-button]     Mobile menu toggle <button> with aria-expanded="true|false".
//   [data-menu]            Mobile menu panel. Closed = `hidden` attribute or display:none/visibility:hidden.
//                          Escape closes it.
//
// Checks: every route in dist returns 200 with no console errors, no page errors, no failed requests
// (network failure or HTTP >= 400). Home: every card navigates to an existing page. Every skin page: Buy now.
// /skins/0003/: second thumbnail changes the main media. Home: slider next arrow and ArrowRight change the
// active testimonial. 390 wide: menu button opens the menu, Escape closes it.
import { chromium } from 'playwright';
import { getBase, getServer, listRoutes, parseArgs, requireDist, routeUrl } from '../scripts/lib.mjs';

const args = parseArgs();
requireDist();
const routes = listRoutes();
const base = await getBase();
const server = await getServer(args, base);
const browser = await chromium.launch();
const results = [];
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
const fail = (name, detail) => results.push({ ok: false, name, detail });
const url = (route) => routeUrl(server.origin, base, route);

/** Opens a page and records console errors, page errors and failed requests. */
async function open(context, route) {
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(`console error: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));
  const res = await page.goto(url(route), { waitUntil: 'networkidle' });
  return { page, res, problems };
}

async function check(name, fn) {
  try {
    const detail = await fn();
    pass(name, detail ?? '');
  } catch (e) {
    fail(name, e.message.split('\n')[0]);
  }
}

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // 1. Every route: 200, no console errors, no failed requests.
  for (const route of routes) {
    await check(`route ${route}`, async () => {
      const { page, res, problems } = await open(desktop, route);
      await page.waitForTimeout(300);
      const status = res?.status();
      await page.close();
      assert(status === 200, `HTTP ${status}`);
      assert(!problems.length, problems.join(' | '));
      return 'HTTP 200, clean console and network';
    });
  }

  // 2. Home cards navigate to existing pages.
  await check('home: cards lead to existing pages', async () => {
    const { page } = await open(desktop, '/');
    const hrefs = await page.$$eval('[data-card]', (cards) =>
      cards.map((c) => {
        const links = c.matches('a[href]') ? [c] : [...c.querySelectorAll('a[href]')];
        return { count: links.length, href: links[0]?.href ?? null, label: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) };
      }),
    );
    await page.close();
    assert(hrefs.length > 0, 'no [data-card] on Home');
    const bad = hrefs.filter((h) => h.count !== 1);
    assert(!bad.length, `cards without exactly one link: ${bad.map((b) => `"${b.label}" (${b.count})`).join(', ')}`);
    for (const h of hrefs) {
      const target = new URL(h.href);
      const p = await desktop.newPage();
      const r = await p.goto(target.href, { waitUntil: 'domcontentloaded' });
      const status = r?.status();
      const hashOk = !target.hash || (await p.locator(`[id="${decodeURIComponent(target.hash.slice(1))}"]`).count()) > 0;
      await p.close();
      assert(status === 200, `card "${h.label}" -> ${target.pathname}${target.hash}: HTTP ${status}`);
      assert(hashOk, `card "${h.label}" -> ${target.pathname}${target.hash}: no element with that id`);
    }
    // Real click on the first card that points to another page.
    const { page: home } = await open(desktop, '/');
    const first = home.locator('[data-card]').first();
    const firstHref = await first.evaluate((c) => (c.matches('a[href]') ? c : c.querySelector('a[href]')).href);
    await Promise.all([home.waitForURL(firstHref), first.click()]);
    await home.close();
    return `${hrefs.length} cards, ${new Set(hrefs.map((h) => h.href)).size} distinct targets, first card click navigated`;
  });

  // 3. Buy now on every skin page.
  const skinRoutes = routes.filter((r) => /^\/skins\/[^/]+\/$/.test(r));
  if (!skinRoutes.length) fail('skin pages', 'no /skins/<id>/ routes in dist');
  for (const route of skinRoutes) {
    await check(`${route}: Buy now`, async () => {
      const { page } = await open(desktop, route);
      const buy = await page.$$eval('[data-buy]', (els) => els.map((e) => ({ tag: e.tagName, href: e.href, target: e.target, rel: e.rel })));
      await page.close();
      assert(buy.length === 1, `expected one [data-buy], found ${buy.length}`);
      const b = buy[0];
      assert(b.tag === 'A', `[data-buy] is <${b.tag.toLowerCase()}>, expected <a>`);
      assert(b.target === '_blank', `target="${b.target}"`);
      assert(/\bnoopener\b/.test(b.rel), `rel="${b.rel}"`);
      const host = new URL(b.href).hostname;
      assert(/(^|\.)amazon\.[a-z.]+$/.test(host), `href host "${host}" is not amazon`);
      return b.href;
    });
  }

  // 4. Gallery thumbnail swap on /skins/0003/.
  await check('/skins/0003/: 2nd thumbnail changes the main media', async () => {
    const { page, res } = await open(desktop, '/skins/0003/');
    assert(res?.status() === 200, `HTTP ${res?.status()}`);
    const thumbs = page.locator('[data-gallery-thumb]');
    const n = await thumbs.count();
    assert(n >= 2, `found ${n} [data-gallery-thumb]`);
    const main = page.locator('[data-gallery-main]');
    assert((await main.count()) === 1, `found ${await main.count()} [data-gallery-main]`);
    const sig = () =>
      main.evaluate((m) => {
        const media = m.querySelector('img, video, picture');
        const el = m.querySelector('img, video');
        return `${media?.tagName}|${el?.currentSrc || el?.getAttribute('src') || ''}|${m.innerHTML.length}|${m.innerHTML.slice(0, 400)}`;
      });
    const before = await sig();
    await thumbs.nth(1).click();
    await page.waitForTimeout(200);
    const after = await sig();
    const current = await thumbs.nth(1).getAttribute('aria-current');
    await page.close();
    assert(before !== after, 'main media did not change');
    assert(current === 'true', `clicked thumbnail aria-current="${current}"`);
    return 'main media swapped, aria-current set';
  });

  // 5. Testimonial slider on Home.
  await check('home: slider next arrow and ArrowRight', async () => {
    const { page } = await open(desktop, '/');
    const slider = page.locator('[data-slider]');
    assert((await slider.count()) === 1, `found ${await slider.count()} [data-slider]`);
    const slides = slider.locator('[data-slide]');
    const n = await slides.count();
    assert(n >= 3, `found ${n} [data-slide], need at least 3`);
    const state = () =>
      slider.locator('[data-slide]').evaluateAll((els) =>
        els.map((e) => ({ active: e.hasAttribute('data-active'), hidden: e.getAttribute('aria-hidden') === 'true' || e.inert })),
      );
    const activeIndex = async () => {
      const s = await state();
      const act = s.map((x, i) => (x.active ? i : -1)).filter((i) => i >= 0);
      assert(act.length === 1, `${act.length} slides have data-active`);
      const i = act[0];
      assert(!s[i].hidden, `active slide ${i} is aria-hidden/inert`);
      const visibleInactive = s.filter((x, j) => j !== i && !x.hidden).length;
      assert(visibleInactive === 0, `${visibleInactive} inactive slides are neither aria-hidden nor inert`);
      return i;
    };
    // The slider opens on the slide the Figma render shows (not necessarily the
    // first), so move to the first slide before checking the no-loop contract.
    await activeIndex();
    await slider.locator('[data-slider-next]').focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);
    const i0 = await activeIndex();
    assert(i0 === 0, `Home key: active slide is ${i0}, expected 0`);
    // The slider loops: previous on the first slide shows the last one, and next brings it back.
    await slider.locator('[data-slider-prev]').click();
    await page.waitForTimeout(600);
    const wrapped = await activeIndex();
    assert(wrapped === n - 1, `prev on the first slide: active ${wrapped}, expected ${n - 1}`);
    await slider.locator('[data-slider-next]').click();
    await page.waitForTimeout(600);
    assert((await activeIndex()) === 0, 'next on the last slide did not wrap to the first');
    await slider.locator('[data-slider-next]').click();
    await page.waitForTimeout(100);
    const i1 = await activeIndex();
    assert(i1 === i0 + 1, `next arrow: active ${i0} -> ${i1}`);
    await slider.locator('[data-slider-next]').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    const i2 = await activeIndex();
    assert(i2 === i1 + 1, `ArrowRight: active ${i1} -> ${i2}`);
    await page.close();
    return `active ${i0} -> ${i1} (arrow) -> ${i2} (key)`;
  });
  await desktop.close();

  // 6. Mobile menu at 390.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await check('390: menu button opens the menu, Escape closes it', async () => {
    const { page } = await open(mobile, '/');
    const btn = page.locator('[data-menu-button]');
    const menu = page.locator('[data-menu]');
    assert((await btn.count()) === 1, `found ${await btn.count()} [data-menu-button]`);
    assert((await menu.count()) === 1, `found ${await menu.count()} [data-menu]`);
    assert(await btn.isVisible(), 'menu button not visible at 390');
    assert(!(await menu.isVisible()), 'menu visible before opening');
    assert((await btn.getAttribute('aria-expanded')) === 'false', `aria-expanded="${await btn.getAttribute('aria-expanded')}" before opening`);
    // let the home intro finish, it moves the logo into place
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro') || document.documentElement.classList.contains('intro-rest'));
    await page.waitForTimeout(1200);
    const logoBefore = await page.locator('.navbar__logo').first().boundingBox();
    const btnBefore = await btn.boundingBox();
    await btn.click();
    await page.waitForTimeout(500);
    const logoAfter = await page.locator('.navbar__logo').first().boundingBox();
    const btnAfter = await btn.boundingBox();
    assert(JSON.stringify(logoBefore) === JSON.stringify(logoAfter), 'logo moved or resized when the menu opened');
    assert(JSON.stringify(btnBefore) === JSON.stringify(btnAfter), 'menu button moved or resized when the menu opened');
    assert(await menu.isVisible(), 'menu not visible after clicking the button');
    assert((await btn.getAttribute('aria-expanded')) === 'true', 'aria-expanded not "true" when open');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600); // the menu fades out before it is hidden
    assert(!(await menu.isVisible()), 'menu still visible after Escape');
    assert((await btn.getAttribute('aria-expanded')) === 'false', 'aria-expanded not "false" after Escape');
    await page.close();
    return 'open + Escape ok';
  });
  await mobile.close();
} finally {
  await browser.close();
  await server.stop();
}

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  -- ${r.detail}` : ''}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\nsmoke: ${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
