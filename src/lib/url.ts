/**
 * Builds a site URL that respects the configured base path (`SITE_BASE`).
 *
 * - `url('/')`             -> `/` (or `/base/`)
 * - `url('skins/0003/')`   -> `/skins/0003/`
 * - `url('/#inventory')`   -> `/#inventory`
 * - `url('media/x.svg')`   -> `/media/x.svg`
 *
 * Absolute URLs (`https:`, `mailto:`, `tel:`) are returned unchanged.
 */
export function url(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\/+/, '')}`;
}
