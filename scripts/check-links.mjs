// Link and asset check over the built site. Run after `astro build`.
//
// Usage: node scripts/check-links.mjs [--dist path]
//
// For every HTML file in dist/:
//   - every internal href/src/srcset/poster is resolved against the page URL and the astro `base`
//     and must exist in dist/ (a page link must end in "/" because of trailingSlash: 'always');
//     a "#fragment" must match an id on the target page
//   - href="#", empty href, and <a> without href (unless data-pending) fail
//   - external links are listed (not fetched)
// Every text file in dist/ (html, css, js, svg, json, xml, txt, webmanifest) is scanned for "figma.com": fail.
// Elements carrying `data-pending` are listed separately and never fail this script (check-launch fails on them).
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { scanTags } from './html.mjs';
import { DIST, getBase, parseArgs, requireDist, walk } from './lib.mjs';

const args = parseArgs();
const dist = args.dist ? path.resolve(String(args.dist)) : DIST;
requireDist(dist);
const base = await getBase();
const ORIGIN = 'http://site.invalid';

const htmlFiles = walk(dist, (p) => p.endsWith('.html')).sort();
const pageUrl = (file) => {
  const rel = path.relative(dist, file).split(path.sep).join('/');
  const p = rel === 'index.html' ? '' : rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
  return new URL(base + p, ORIGIN);
};

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const ids = new Set();
    for (const t of scanTags(readFileSync(file, 'utf8'))) {
      if (t.attrs.has('id')) ids.add(t.attrs.get('id'));
      if (t.tag === 'a' && t.attrs.has('name')) ids.add(t.attrs.get('name'));
    }
    idCache.set(file, ids);
  }
  return idCache.get(file);
}

/** Maps a same-origin URL to a file in dist, or returns { error }. */
function resolveInDist(u) {
  let p = decodeURIComponent(u.pathname);
  if (!p.startsWith(base)) return { error: `outside base "${base}"` };
  p = p.slice(base.length);
  const target = path.join(dist, p);
  if (p === '' || p.endsWith('/')) {
    const idx = path.join(target, 'index.html');
    return existsSync(idx) ? { file: idx } : { error: 'no index.html for this path' };
  }
  if (existsSync(target) && statSync(target).isFile()) return { file: target };
  if (existsSync(path.join(target, 'index.html'))) return { error: 'page link without trailing slash' };
  return { error: 'file does not exist' };
}

const errors = [];
const external = new Map(); // url -> Set(page)
const pending = [];
let checked = 0;

for (const file of htmlFiles) {
  const page = path.relative(dist, file);
  const here = pageUrl(file);
  for (const t of scanTags(readFileSync(file, 'utf8'))) {
    const label = `<${t.tag}>${t.text ? ` "${t.text}"` : ''}`;
    if (t.attrs.has('data-pending')) {
      pending.push({ page, label, value: t.attrs.get('data-pending'), href: t.attrs.get('href') });
      continue;
    }
    if (t.tag === 'a' && !t.attrs.has('href')) {
      errors.push({ page, label, ref: '(no href)', why: '<a> without href must carry data-pending' });
      continue;
    }
    const refs = [];
    if (t.attrs.has('href')) {
      const href = t.attrs.get('href').trim();
      if (href === '' || href === '#') {
        errors.push({ page, label, ref: `href="${href}"`, why: 'empty or "#" href' });
        continue;
      }
      refs.push(['href', href]);
    }
    for (const a of ['src', 'poster']) if (t.attrs.has(a)) refs.push([a, t.attrs.get(a).trim()]);
    if (t.attrs.has('srcset')) {
      for (const cand of t.attrs.get('srcset').split(',')) {
        const u = cand.trim().split(/\s+/)[0];
        if (u) refs.push(['srcset', u]);
      }
    }
    for (const [attr, ref] of refs) {
      if (ref === '') {
        errors.push({ page, label, ref: `${attr}=""`, why: `empty ${attr}` });
        continue;
      }
      if (/^(data|blob|javascript):/i.test(ref)) continue;
      if (/^(mailto|tel|sms):/i.test(ref)) {
        if (!external.has(ref)) external.set(ref, new Set());
        external.get(ref).add(page);
        continue;
      }
      let u;
      try {
        u = new URL(ref, here);
      } catch {
        errors.push({ page, label, ref, why: 'not a valid URL' });
        continue;
      }
      if (u.origin !== ORIGIN) {
        if (!external.has(u.href)) external.set(u.href, new Set());
        external.get(u.href).add(page);
        continue;
      }
      checked++;
      const r = resolveInDist(u);
      if (r.error) {
        errors.push({ page, label, ref, why: r.error });
        continue;
      }
      if (u.hash && u.hash !== '#' && r.file.endsWith('.html')) {
        const id = decodeURIComponent(u.hash.slice(1));
        if (!idsOf(r.file).has(id)) errors.push({ page, label, ref, why: `no element with id="${id}" on ${path.relative(dist, r.file)}` });
      }
    }
  }
}

// figma.com anywhere in the output.
const textFiles = walk(dist, (p) => /\.(html|css|js|mjs|svg|json|xml|txt|webmanifest)$/i.test(p));
for (const file of textFiles) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/[^\s"'()<>]*figma\.com[^\s"'()<>]*/gi)) {
    errors.push({ page: path.relative(dist, file), label: 'text', ref: m[0].slice(0, 120), why: 'Figma URL in output' });
  }
}

console.log(`check-links: ${htmlFiles.length} HTML files, ${checked} internal references, base "${base}"`);
console.log(`\nExternal links (${external.size}, not fetched):`);
for (const [u, pages] of [...external].sort()) console.log(`  ${u}  (${pages.size} page${pages.size > 1 ? 's' : ''})`);
console.log(`\nPending elements (${pending.length}, do not fail this check, block launch):`);
for (const p of pending) console.log(`  ${p.page}: ${p.label}${p.value ? ` data-pending="${p.value}"` : ''}${p.href !== undefined ? ` href="${p.href}"` : ''}`);
if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  for (const e of errors) console.log(`  ${e.page}: ${e.label} ${e.ref} -> ${e.why}`);
  console.log('\ncheck-links: FAIL');
  process.exit(1);
}
console.log('\ncheck-links: PASS');
