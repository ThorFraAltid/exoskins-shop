// Launch-blocker check (PLAN.md review finding 7). Exit 1 while anything below is true:
//   - a skin in src/content/skins/*.json has amazonUrl === AMAZON_STORE_URL (src/data/site.ts)
//   - a testimonial is flagged `placeholder: true` (src/data/testimonials.ts and/or src/content/testimonials/*.json)
//   - an element in dist/ carries `data-pending`
//   - NEWSLETTER_ENDPOINT in src/data/site.ts is an empty string
// Sources are read as text/JSON, nothing is imported. Missing files fail with a message, they are never skipped.
//
// Usage: node scripts/check-launch.mjs [--root <project dir>]   (--root is for testing against fixtures)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { scanTags } from './html.mjs';
import { parseArgs, ROOT, walk } from './lib.mjs';

const args = parseArgs();
const root = args.root ? path.resolve(String(args.root)) : ROOT;
const rel = (p) => path.relative(root, p);
const blockers = [];
const setupErrors = [];

/** Value of `export const NAME = '...'` (optionally typed). undefined = not found, null = not a string literal. */
function stringConst(src, name) {
  const m = new RegExp(`(?:export\\s+)?const\\s+${name}\\b[^=]*=\\s*([^;\\n]+)`).exec(src);
  if (!m) return undefined;
  const lit = /^\s*(['"`])((?:\\.|(?!\1).)*)\1\s*(?:as\s+const)?\s*(?:\/\/.*)?$/.exec(m[1]);
  if (!lit || (lit[1] === '`' && lit[2].includes('${'))) return null;
  return lit[2];
}

// --- site.ts -------------------------------------------------------------------------------
const sitePath = path.join(root, 'src/data/site.ts');
let storeUrl;
if (!existsSync(sitePath)) setupErrors.push(`${rel(sitePath)} does not exist`);
else {
  const site = readFileSync(sitePath, 'utf8');
  storeUrl = stringConst(site, 'AMAZON_STORE_URL');
  if (storeUrl === undefined) setupErrors.push(`AMAZON_STORE_URL not found in ${rel(sitePath)}`);
  else if (storeUrl === null) setupErrors.push(`AMAZON_STORE_URL in ${rel(sitePath)} is not a plain string literal; this check reads it as text`);
  const endpoint = stringConst(site, 'NEWSLETTER_ENDPOINT');
  if (endpoint === undefined) setupErrors.push(`NEWSLETTER_ENDPOINT not found in ${rel(sitePath)}`);
  else if (endpoint === null) setupErrors.push(`NEWSLETTER_ENDPOINT in ${rel(sitePath)} is not a plain string literal; this check reads it as text`);
  else if (endpoint.trim() === '') blockers.push(`NEWSLETTER_ENDPOINT is empty in ${rel(sitePath)}: forms fall back to opening a mail`);
}

// --- skins ---------------------------------------------------------------------------------
const skinsDir = path.join(root, 'src/content/skins');
if (!existsSync(skinsDir)) setupErrors.push(`${rel(skinsDir)}/ does not exist`);
else {
  const files = readdirSync(skinsDir).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) setupErrors.push(`no skin JSON files in ${rel(skinsDir)}/`);
  for (const f of files) {
    const p = path.join(skinsDir, f);
    let data;
    try {
      data = JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      setupErrors.push(`${rel(p)} is not valid JSON: ${e.message}`);
      continue;
    }
    if (typeof data.amazonUrl !== 'string' || !data.amazonUrl) setupErrors.push(`${rel(p)} has no amazonUrl`);
    else if (typeof storeUrl === 'string' && data.amazonUrl === storeUrl)
      blockers.push(`skin ${data.id ?? path.basename(f, ".json")}: amazonUrl is still the store URL (${rel(p)})`);
  }
}

// --- testimonials --------------------------------------------------------------------------
const tsPath = path.join(root, 'src/data/testimonials.ts');
const tDir = path.join(root, 'src/content/testimonials');
if (!existsSync(tsPath) && !existsSync(tDir)) setupErrors.push(`neither ${rel(tsPath)} nor ${rel(tDir)}/ exists`);
if (existsSync(tsPath)) {
  const lines = readFileSync(tsPath, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/\bplaceholder\s*:\s*true\b/.test(line)) {
      // Name the entry: nearest `name:` within the surrounding object.
      const win = lines.slice(Math.max(0, i - 12), i + 12).join('\n');
      const name = /\bname\s*:\s*(['"`])(.*?)\1/.exec(win)?.[2];
      blockers.push(`testimonial${name ? ` "${name}"` : ''} has placeholder: true (${rel(tsPath)}:${i + 1})`);
    }
  });
}
if (existsSync(tDir)) {
  for (const f of readdirSync(tDir).filter((f) => f.endsWith('.json')).sort()) {
    const p = path.join(tDir, f);
    const data = JSON.parse(readFileSync(p, 'utf8'));
    for (const item of Array.isArray(data) ? data : [data]) {
      if (item?.placeholder === true) blockers.push(`testimonial${item.name ? ` "${item.name}"` : ''} has placeholder: true (${rel(p)})`);
    }
  }
}

// --- dist: data-pending ----------------------------------------------------------------------
const dist = path.join(root, 'dist');
if (!existsSync(dist)) setupErrors.push(`${rel(dist)}/ does not exist, run \`bun run build\` first`);
else {
  for (const file of walk(dist, (p) => p.endsWith('.html')).sort()) {
    for (const t of scanTags(readFileSync(file, 'utf8'))) {
      if (!t.attrs.has('data-pending')) continue;
      const v = t.attrs.get('data-pending');
      blockers.push(`pending element on ${path.relative(dist, file)}: <${t.tag}>${t.text ? ` "${t.text}"` : ''}${v ? ` (${v})` : ''}`);
    }
  }
}

if (setupErrors.length) {
  console.log('check-launch: cannot evaluate, inputs missing or unreadable:');
  setupErrors.forEach((e) => console.log(`  - ${e}`));
}
if (blockers.length) {
  console.log(`check-launch: ${blockers.length} launch blocker${blockers.length > 1 ? 's' : ''}:`);
  blockers.forEach((b) => console.log(`  - ${b}`));
}
if (setupErrors.length || blockers.length) {
  console.log('\ncheck-launch: FAIL');
  process.exit(1);
}
console.log('check-launch: PASS, no launch blockers');
