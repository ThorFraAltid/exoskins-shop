# Data hooks the pages must provide

`tests/smoke.mjs` and `scripts/visual-diff.mjs` find elements only through these attributes. Do not rely on classes or text.

| Hook | Where | Contract |
|---|---|---|
| `data-figma="<node id>"` | Root element of every section in `design-source/figma/sections.json` | Exactly one element per node per page. Its box is compared with the Figma box (tolerance 2 px). |
| `data-card` | Every Home inventory card and every "You Might Also Like" card | The element is the `<a href>`, or contains exactly one `<a href>`. The link leads to an existing page, or to an `#id` that exists on the target page. |
| `data-buy` | "Buy now" on each skin page | One per page, an `<a>` with `target="_blank"`, `rel` containing `noopener`, href host `amazon.*`. |
| `data-gallery-main` | Container of the main gallery media on a skin page | One per page. Its content (`img`/`video`/`picture`) changes when a thumbnail is chosen. |
| `data-gallery-thumb` | Each gallery thumbnail | A `<button>`. Clicking it swaps the main media and sets `aria-current="true"` on itself, removing it from the other thumbnails. |
| `data-slider` | Testimonial slider root | One per page. `keydown` ArrowLeft / ArrowRight is handled on this element (events bubble up from focused descendants, e.g. the arrow buttons). |
| `data-slide` | Each testimonial inside `data-slider` | Exactly one carries `data-active`. All others carry `aria-hidden="true"` or `inert`; the active one carries neither. |
| `data-slider-next` | Next arrow | A `<button>` inside `data-slider`. |
| `data-slider-prev` | Previous arrow | A `<button>` inside `data-slider`. The slider loops: on the first slide it shows the last one. |
| `data-menu-button` | Mobile menu toggle | A `<button>` visible at 390 wide, `aria-expanded="false"` closed, `"true"` open. |
| `data-menu` | Mobile menu panel | Closed: `hidden` attribute, or `display:none` / `visibility:hidden`. Opens on the button, closes on Escape. |
| `data-pending` | A link or control whose destination does not exist yet (About eXo, FAQ, Privacy Policy, LinkedIn) | Rendered without `href`. Optional value names the reason. `check-links` lists it, `check-launch` fails on it. An `<a>` without `href` and without `data-pending` fails `check-links`. |

Other rules the checks enforce:

- No `href="#"` and no empty `href` anywhere (`check-links`).
- No `figma.com` string anywhere in `dist/` (`check-links`).
- Every internal `href`/`src`/`srcset`/`poster` resolves to a file in `dist/`; page links end in `/` (`check-links`).
- No console errors, no failed or 4xx/5xx requests on any route (`test:smoke`).
