# eXoskins.shop build plan

Client: Simon (eXo). Builder: Thor. Local build first, no deploy in this plan.

## Goal

Turn Simon's Figma file into the real website, 1:1. No redesign, no invented copy.
Figma: https://www.figma.com/design/R3y0iSFbggXv7vRS4b3I4M/eXoskins.shop-chairface (file key `R3y0iSFbggXv7vRS4b3I4M`).

## What the Figma file contains (verified by reading the file)

Page "Desktop, Phone, Style" (`25:145`) has three frames. There are no phone frames.

| Frame | Node | Size | Becomes |
|---|---|---|---|
| Home | `901:367` | 1440 x 4343 | `/` |
| Item | `5190:1434` | 1440 x 3401 | `/skins/[id]/` |
| Style | `901:1109` | 1558 x 1521 | design tokens |

Tokens from Style: font Space Grotesk (Regular, Medium), colors `#B9FF66`, `#191A23`, `#F3F3F3`, plus black and white. The Style frame has both a desktop and a mobile type scale (H1 to H4, p).

Components page (`403:244`): Button (primary, secondary, tertiary), Logo (Pos, Neg), Heading (Green, White, Black), Link (9 variants), Plus icon.

Home sections, top to bottom (node ids):
1. Header `7102:807` (1241 x 726): logo, nav (About eXo, FAQ, Go to skins, Shopping basket button), hero mouse animation, four feature labels.
2. "Featured at" `3037:674` + Logotypes `901:459` (amazon, XPL repeated).
3. Heading "Inventory" `901:368` with subheading.
4. Inventory grid: 405 x 303 cards (`901:468`, `5036:733`, `5036:748`, `5081:800`, `5081:807`, `5081:793`, `5036:1177`, `5081:837`), wide "Dropping Soon" skull card `5081:787` (1232 x 359), large "Dropping Soon" dragon card `5036:863` (822 x 633). Card variants: black, light, green "Dropping soon" crate.
5. Heading "A word from our customers" `901:380`.
6. Testimonials block `901:681` (1240 x 625): speech bubble slider, arrows, five star dots.
7. Footer `901:753`: logo, links, LinkedIn icon, contact details, email field, "Subscribe to news", copyright, Privacy Policy.

Item sections:
1. Header bar `5190:1435` (logo + nav, no hero).
2. Gallery: four thumbnails (`5205:946`, `7037:844`, `7094:827`, `7087:1296`) and main view `5205:967` (637 x 609).
3. Info `5205:982`: id tag (/0001), "Factory New", Pattern Template, Wear Rating, "Compatible with" list, and "Buy now" `7037:839`.
4. "You Might Also Like" `7094:816` with six cards.
5. Testimonials `7040:1062`, Footer `7101:893` (same as Home).

## Assets on disk (`design-source/`)

- `drive/headervideo/eXo_main_landscape_3mbps.mp4` (1920x1080, 31 s, the header animation that is live on exoskins.shop today) and `Header-video.mov` (1280x720).
- `drive/Skins/0001.mp4` (1492x1388, 10 s), `0002.mp4` (992x924, 10 s): product videos that stand in for product images.
- `drive/img/skins/0001/1.png` to `4.png`: gallery images for skin 0001.
- `drive/eXo-logo/`: logo and icon SVG.
- `drive/AI-Skins-tests/`: flat skin patterns and test renders. Not used unless the Figma file uses them.
- `figma/home.png`, `item.png`, `style.png`: frame renders, the visual target.
- All other images (mouse renders, skull, dragon, crate, partner logos, icons) are exported from Figma per node.

## Stack

- Astro (static output), TypeScript, plain CSS with custom properties. Bun as package manager.
- No UI framework. Interactivity is small: mobile menu, testimonial slider, gallery thumbnail switch. Vanilla TS in Astro `<script>`.
- Space Grotesk self-hosted via `@fontsource-variable/space-grotesk`.
- Why Astro: the site is content pages generated from one product list, no checkout, no accounts. Static HTML deploys anywhere, including next to or instead of the current WordPress install.

## Structure

```
src/
  data/products.ts        one typed list: id, name, card variant, media, specs, compatibility, amazonUrl
  data/testimonials.ts
  data/site.ts            contact info, nav, partner logos, amazon store URL
  styles/tokens.css       colors, type scale (desktop + mobile), radii, spacing
  styles/global.css
  components/             Header, Hero, Partners, SectionHeading, SkinCard, DropCard, InventoryGrid,
                          Testimonials, Footer, Button, ProductGallery, ProductInfo
  layouts/Base.astro
  pages/index.astro
  pages/skins/[id].astro  getStaticPaths over products
public/media/             optimized videos, images, SVGs
```

## Products

The Figma file shows skins /0001 to /0005 (Home cards are all labelled /FD0001, the Item frame numbers them). Build one product page per skin that exists in the design: 0001 to 0005.
- 0001: gallery uses `0001.mp4` as the main view, the four PNGs as thumbnails.
- 0002: main view uses `0002.mp4`.
- 0003 to 0005: use the mouse renders exported from Figma.
- Specs text (Factory New, Pattern Template, Wear Rating, Compatible with) comes verbatim from the Item frame.
- "Dropping soon" cards are not products and have no product page.
- Adding skin 6 to 20 later is one entry in `products.ts` plus media files.

## Responsive

Figma has desktop only. Rules for the widths that are not designed:
- 1440 is the reference. Content column is 1240 wide, centered. Above 1440 the column stays 1240.
- Below 1240: fluid scale down. Grid goes 3 columns, then 2 (under ~1000), then 1 (under ~640). Wide cards span the full row.
- Mobile uses the mobile type scale from the Style frame. Nav collapses to a menu button. Testimonials show one bubble at a time. Product page stacks gallery above info, thumbnails become a horizontal row. Footer stacks.
- Same components, same colors, same radii. Nothing new is designed for mobile.

## Decisions taken without Simon (flag in the hand-off)

1. Amazon links: no product URLs exist yet. Every "Buy now" reads `amazonUrl` from `products.ts`. Until Simon supplies real listing URLs they point at one `AMAZON_STORE_URL` constant.
2. "Shopping basket" in the nav: there is no basket on the site (checkout is Amazon). It links to the same Amazon store URL.
3. "About eXo" and "FAQ": the Figma file has no such pages or sections. The links stay in the nav as designed; no page content is invented.
4. "Get notified here" and "Subscribe to news": no email provider is chosen. The forms open a mail to hi@exoskins.shop.
5. Testimonials: the copy in Figma is used verbatim, including the placeholder name "Navn Navnesen".
6. Header animation: use the 1080p mp4 that is live on exoskins.shop, re-encoded for web (mp4 + webm, poster frame), autoplay, muted, loop, playsinline.

## Build order

1. Scaffold Astro, tokens, fonts, Base layout. Export all Figma assets, optimize videos with ffmpeg.
2. Shared components: Header/nav, Footer, SectionHeading, Button, SkinCard, DropCard, Testimonials.
3. Home page.
4. Product page template + data, five product pages.
5. Responsive pass at 1440, 1024, 768, 390.
6. Verification loop: screenshot each page at 1440 and overlay against the Figma renders, fix differences, repeat until they match. Then mobile QA, link check, `astro build` clean, Lighthouse.

## Done means

- `bun run build` passes with no errors or warnings.
- Home and Item at 1440 match the Figma renders section by section (side by side screenshots).
- Every skin card opens its product page, every Buy now opens Amazon in a new tab, "You Might Also Like" links work, slider and gallery work with mouse, touch and keyboard.
- No horizontal scroll and no overlap at 390, 768, 1024, 1440, 1920.
- No reference to Figma asset URLs in the code.

---

# Review outcome (gstack autoplan, auto-decided, owner away)

Four independent reviews ran on this plan: strategy, design, engineering (Claude subagents) and Codex. Scope, design and copy changes were rejected by rule (1:1 Figma build). Everything below is binding for the build and replaces the matching parts above.

## Findings that changed the plan

| # | Finding (source) | Decision |
|---|---|---|
| 1 | One product list cannot express 8 Home cards + 6 "also like" cards for 5 skins (eng, Codex, strategy) | Separate catalog from placement: `skins` content collection + explicit `homeGrid` and `alsoLike` slot lists |
| 2 | Asset reality differs from Figma: `Skins/0001.mp4` is a graffiti skin, `0002.mp4` a gold skin, Figma Item /0001 is a Lightning skin (found while probing videos) | Follow Simon's file names, see Product mapping |
| 3 | Specs exist for one skin only (strategy, Codex) | Spec fields optional per skin, rendered only when present. Nothing invented |
| 4 | Both header videos are the crate animation, Figma shows a still of three mice in a layer called "Header-video 1" | Hero plays the live-site video inside the Figma header box geometry |
| 5 | Links without destination: About eXo, FAQ, Privacy Policy, LinkedIn (Codex, design) | Rendered as designed, marked `pending` in `site.ts`, no href, listed in HANDOFF.md. No invented pages |
| 6 | mailto forms lose signups silently (strategy, eng) | Forms validate the email and open a prefilled mail to hi@exoskins.shop. `NEWSLETTER_ENDPOINT` in `site.ts`; when set, forms POST there instead. Listed as launch blocker |
| 7 | Amazon placeholder can ship unnoticed (strategy, eng) | `amazonUrl` explicit per skin. `bun run check:launch` fails while any skin points at the store URL, a testimonial is flagged placeholder, or a pending link exists |
| 8 | Responsive rules too vague (design, Codex) | Full spec below |
| 9 | Base path, trailing slash, 404, meta (eng) | `SITE_BASE` env var, `trailingSlash: 'always'`, `404.astro`, title/description/OG/favicon from existing assets |
| 10 | Verification not reproducible (eng, Codex) | Playwright with frozen video and slider, per-section geometry gate + pixel diff as guide. Reference renders re-exported at 1440 (`design-source/figma/home-1440.png`, `item-1440.png`) |
| 11 | Variable font metrics may differ from Figma's static Space Grotesk (eng) | Use `@fontsource/space-grotesk` 400 and 500 |
| 12 | Simon cannot add skins himself (strategy) | One JSON file per skin in a content collection with a zod schema; CMS can be added later without a rebuild |
| 13 | WordPress cutover (strategy) | Out of scope (local build only). Listed in HANDOFF.md |

Rejected: adding a visible pause control on videos, a scrim behind "Lorem ipsum", cropping partner logos differently, new pages. Those change the design; they are listed in HANDOFF.md for Simon.

## Product mapping (5 skins)

| id | Skin | Card media | Gallery | Specs |
|---|---|---|---|---|
| 0001 | Graffiti | Figma graffiti mouse render (Home card `5036:1177`) | `Skins/0001.mp4` | none verified |
| 0002 | Gold | still from `Skins/0002.mp4` | `Skins/0002.mp4` | none verified |
| 0003 | Lightning | `img/skins/0001/2.png` | `img/skins/0001/1-4.png` (the Figma Item gallery) | Figma Item: Factory New, Pattern Template: 524, Wear Rating: 0,779833555 |
| 0004 | Teal/pink fade | Figma teal mouse render | Figma render | none verified |
| 0005 | Green | Figma green mouse render | Figma render | none verified |

"Compatible with" (Logitech Super Light 1, Logitech Super Light 2, Razer DeathAdder V3 Pro, Razer DeathAdder V4 Pro) is shown on every skin page from one site-level list. Flagged for Simon.

`/skins/0003/` is the page that is pixel-compared with the Figma Item frame.

Home grid slots, in Figma order: A black `901:468` -> 0004, B light `5036:733` -> 0005, crate `5036:748`, skull wide `5081:787`, C light `5081:800` -> 0003, crate `5081:807`, D black `5081:793` -> 0002, E black `5036:1177` -> 0001, dragon large `5036:863`, F light `5081:837` -> 0004 (5 skins, 6 slots; repeats until skin 6 exists).
Home card label is `/FD` + id, Item-page card label is `/` + id, as in the two frames. Each slot keeps its Figma tagline.

"You Might Also Like": Figma order skin, skin, crate / skin, crate, skin, filled with the four other skins.

Crate "See more" and "Get notified here" go to the footer subscribe form (`#subscribe`). "Go to skins" goes to `/#inventory`. "Shopping basket" goes to `AMAZON_STORE_URL`.

## Responsive spec (Figma has desktop only)

Breakpoints: >=1240 desktop as designed; 1024; 768; 390. Gutters 32 / 24 / 16. Mobile type scale from the Style frame at <=767, `clamp()` between scales from 768 to 1239. Column max 1240, gutter-aware.

- Hero box: keeps border, radius, green bottom edge. Video 16:9, never cropped on the sides at mobile. 1024: same layout scaled. 768: the four feature labels move below the video inside the box, one row. 390: nav is logo + 44px menu button; labels 2x2.
- Mobile menu: full-height black panel, links stacked, Shopping basket as full-width outline button, Esc closes, focus trapped, `aria-expanded`, body scroll locked.
- Partner row: 6 logos, 4 at 768, 2 at 390. Repeats are decorative (`aria-hidden`).
- Section heading: pill + subheading side by side to 768, stacked at 390.
- Inventory grid: 3 columns down to 1024, 2 columns at 768 with `grid-auto-flow: dense`, 1 column at 390. Cards keep 405:303. Skull card full row at every width, min-height one card, `object-fit: cover`. Dragon card 2x2 at 3 columns, full row 1:1 at 2 and 1 columns.
- Testimonials: centre bubble with neighbours peeking stays at all widths. Centre width about 46% / 60% / 72% / 84%. No loop (left arrow disabled on slide 1, as in Figma), no autoplay.
- Footer: 768: logo + LinkedIn row, links row, contact and form in 2 columns. 390: stacked, full-width field and button.
- Product page: 1024 three columns with smaller thumbs. 768: thumbs + main together, info below. 390: main view full width square, thumbs in one row below, info below, Buy now full width.
- "You Might Also Like": same 3 / 2 / 1 rules.

## States (only brand colors, existing radii)

Use the Figma component variants first (Button x3, Link x9, Plus icon). Where Figma has none:
- Card: whole card is one link. Hover lifts 4px and the green bottom edge grows 4px. Arrow circle inverts.
- Buttons: primary green -> black fill, green text, green border. Secondary dark -> green fill, black text. Outline -> white fill, black text.
- Focus ring: 2px green on black/dark surfaces, 2px black on green/light surfaces, 2px offset.
- Slider arrows: white, green on hover, disabled at 30%. Dots: active green, inactive white, 24px hit area.
- Gallery thumbs: active marked with `aria-current` and full opacity, others 60%.
- Email field: focus 2px black border; error and success message in the black pill style of "Contact us:".
- `prefers-reduced-motion`: videos show the poster and do not play, no card lift, instant slide change.
- Home gets a visually hidden h1. Product media alt: skin id + skin name. Decorative images `alt=""`.

## Media

- Hero: `-an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart` at 1920 and a 1280 copy for small screens, poster from the video. `muted loop playsinline`, played by JS only when motion is allowed.
- Product videos: `-an`, 0001 scaled to 1274 wide, 0002 native, crf 26, `preload="none"`, play in viewport. Their background is off-white (about 252,253,253): match the surrounding surface.
- PNGs via `astro:assets` (AVIF/WebP, keep alpha). SVGs from Figma kept untouched.

## Tests

`astro check`, zod schema, `scripts/check-links` over `dist`, Playwright smoke (routes 200, no console errors, no horizontal scroll at 390/768/1024/1440/1920, cards navigate, Buy now is Amazon + `target=_blank`, thumbnails swap, slider keys), `scripts/visual-diff` against the 1440 renders.

## NOT in scope

Deploy and WordPress cutover, analytics, cookie banner, newsletter provider, About/FAQ/Privacy content, real Amazon listing URLs, skins 6 to 20, a CMS UI.

## Decision audit trail

| # | Phase | Decision | Class | Principle | Rejected |
|---|---|---|---|---|---|
| 1 | CEO | Keep Astro static, do not stay on WordPress | Taste | P5 explicit, P3 pragmatic | WordPress theme build, Next.js |
| 2 | CEO | Content collection per skin | Mechanical | P1 completeness | single TS array |
| 3 | CEO | Launch-blocker check script instead of blocking the local build | Taste | P6 bias to action | failing every build until Simon answers |
| 4 | Design | Responsive spec adopted from design voice | Mechanical | P1 | vague "fluid" rules |
| 5 | Design | No pause control, no scrim, no logo changes | User constraint | 1:1 rule | accessibility-driven design changes (flagged in hand-off) |
| 6 | Design | Hero uses the live video, not the Figma still | Taste | Simon's email names the live header animation | static image hero |
| 7 | Eng | Skin numbering follows video file names; Lightning becomes 0003 | Taste | newest client input wins | Lightning as 0001 with videos reassigned |
| 8 | Eng | Static fontsource 400/500 | Mechanical | P5 | variable font |
| 9 | Eng | Geometry gate + pixel diff as guide | Mechanical | P3 | pixel-perfect threshold on text |
| 10 | Eng | Pending links render without href | Taste | no invented pages | `#` placeholders, new pages |

## GSTACK REVIEW REPORT

| Review | Voices | Status | Findings |
|---|---|---|---|
| CEO / strategy | Claude subagent | issues resolved in plan | 10 raised, 9 adopted or flagged, 1 (WordPress cutover) out of scope |
| Design | Claude subagent | issues resolved in plan | responsive + states spec adopted; 3 design-changing items rejected and flagged |
| Eng | Claude subagent + Codex | issues resolved in plan | 3 blocking + 9 Codex findings adopted |
| DX | skipped | not a developer tool | |

Run as a condensed autoplan: one voice per phase plus Codex on eng, premise gate auto-accepted because the owner asked for no questions.
