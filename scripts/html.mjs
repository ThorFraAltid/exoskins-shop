// Tiny HTML tag/attribute scanner for the static output in dist/ (no DOM, no dependencies).
// Skips comments and the raw text inside <script> and <style>.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", '#x27': "'", '#x2F': '/', '#47': '/' };
export const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (ENTITIES[e] !== undefined) return ENTITIES[e];
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return m;
  });

const ATTR = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/**
 * Returns [{ tag, attrs: Map, line, text }] for every start tag.
 * `text` is the stripped text up to the matching close tag of the same name (approximate, for reports).
 */
export function scanTags(html) {
  const tags = [];
  let i = 0;
  const lineAt = (pos) => html.slice(0, pos).split('\n').length;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) break;
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    const m = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(lt, lt + 64));
    if (!m) {
      i = lt + 1;
      continue;
    }
    // Find the end of the tag, respecting quotes.
    let j = lt + m[0].length;
    let q = null;
    for (; j < html.length; j++) {
      const c = html[j];
      if (q) {
        if (c === q) q = null;
      } else if (c === '"' || c === "'") q = c;
      else if (c === '>') break;
    }
    const tag = m[1].toLowerCase();
    const attrSrc = html.slice(lt + m[0].length, j);
    const attrs = new Map();
    for (const a of attrSrc.matchAll(ATTR)) {
      const val = a[2] ?? a[3] ?? a[4];
      attrs.set(a[1].toLowerCase(), val === undefined ? '' : decode(val));
    }
    const closeIdx = html.indexOf(`</${tag}`, j);
    const text =
      closeIdx === -1
        ? ''
        : html
            .slice(j + 1, Math.min(closeIdx, j + 2000))
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 60);
    tags.push({ tag, attrs, line: lineAt(lt), text: decode(text) });
    i = j + 1;
    if (tag === 'script' || tag === 'style') {
      const end = html.indexOf(`</${tag}`, i);
      i = end === -1 ? html.length : end;
    }
  }
  return tags;
}
