# eXoskins.shop: hand-off

Local build of Simon's Figma file (`R3y0iSFbggXv7vRS4b3I4M`). Not deployed, nothing committed.

## Run it

```bash
bun install
bun run dev        # http://localhost:4321
bun run verify     # build + link check + smoke test
bun run check:launch   # lists what blocks going live
```

`bun run visual-diff -- --serve` compares the site with the Figma renders section by section (output in `visual-diff/`). `bun run shots` writes screenshots at 390, 768, 1024, 1440, 1920 to `shots/`.

## State (verified 3 Oct 2026)

- `bun run verify`: build clean, link check passes (681 internal references), smoke test 15 of 15.
- `astro check`: 0 errors, 0 warnings.
- Home at 1440: all 17 Figma sections at the Figma position and size (0 px off).
- Product page (`/skins/0003/`) at 1440: all sections within 2 px, except the footer (see below).
- No horizontal scroll at 390, 768, 1024, 1440, 1920.
- `bun run check:launch` fails on purpose. Its list is the "Needs Simon" list below.

## Needs Simon before launch

1. Amazon listing URL per skin. All five "Buy now" buttons and "Shopping basket" point at `https://www.amazon.com/`. Set `amazonUrl` in `src/content/skins/<id>.json` and `AMAZON_STORE_URL` in `src/data/site.ts`.
2. Skin numbering. Video `0001.mp4` is a graffiti skin and `0002.mp4` a gold skin, but the Figma product page shows Lightning as /0001. The site follows the video names: 0001 Graffiti, 0002 Gold, 0003 Lightning, 0004 Teal fade, 0005 Green. Skin names are working names.
3. Only skin 0003 has specs (from Figma: Factory New, Pattern Template 524, Wear Rating 0,779833555). The other four show only the compatibility list. The compatibility list is the one from Figma, shown on every skin.
4. Five skins exist, the Home grid has six skin slots, so 0004 appears twice.
5. Gold skin (0002) card image is a cut-out made from the first frame of his video. A proper render would be better. Skins 0004 and 0005 have one image each.
6. Links with no destination: About eXo, FAQ, Privacy Policy, LinkedIn. They are shown as designed but do nothing. Set them in `src/data/site.ts`.
7. Newsletter. "Subscribe to news" and "Get notified here" open a prefilled mail to hi@exoskins.shop, so signups depend on the visitor sending that mail. Set `NEWSLETTER_ENDPOINT` in `site.ts` once a provider is chosen.
8. Placeholder copy from Figma that is live on the page: testimonials "John Smith" and "Navn Navnesen", "Lorem ipsum" in both Dropping Soon cards. Fake reviews are a legal risk in the EU.
9. Hero. Figma shows a still of three mice; the hero plays the crate animation from the live site instead, fitted above the label row with soft edges.
10. Favicon is the logo pill cut from the icon sheet. A square icon would look better.

## Skins (updated 4 Oct 2026)

Six skins, named after Simon's own pattern files in `AI-Skins-tests/Plano-Skins`:

| id | Skin | Media on the product page |
|---|---|---|
| 0001 | NeoQueen | video `0001.mp4` (white frame cropped off), Simon's product shot, a still from the video, flat pattern |
| 0002 | QueenGambit | video `0002.mp4` (cropped), Simon's product shot (`queen.png`), a still, flat pattern |
| 0003 | Lightning | the four Figma gallery images; lightning effect on the Home card and the first product image only |
| 0004 | Fade | Figma render, flat pattern |
| 0005 | Doppler | Figma render, flat pattern |
| 0006 | NightWish | Figma render (the swirl mouse on the Home grid), flat pattern |

This replaces the earlier five-skin mapping in this file and in PLAN.md: the Home grid's six skin slots now hold six different skins. Ids and which skin gets which id are still Thor's assumption (video file names for 0001 and 0002); Simon should confirm.

## Added after the Figma build (Thor's requests, 4 Oct 2026)

Not in Simon's Figma file; he has not seen these.

- Motion: home intro (video, then logo, frame, rest), scroll reveal, floating card images, typewriter id labels, looping hero label animations, skull zoom, dragon flow, lightning on the Lightning skin card, smooth in-page scrolling. All off with reduced motion.
- FAQ section on Home (`src/data/faq.ts`). The five answers are a draft written from the brief and the site's own labels. Simon must approve or replace them.
- Testimonials: five instead of three, shortened, with bold emphasis, looping and auto-advancing. Four of the five are placeholders (John Smith and three "Navn Navnesen"); `check:launch` blocks on them. Rune's quote is a shortened version of his original and needs his approval.
- Dragon card: plays a looping video of the snake slithering (`public/media/drops/dragon.mp4`), generated from Simon's still with an image-to-video model (Wan 2.2 first/last frame on Hugging Face, free tier) and slowed with frame interpolation. The still image shows until the video plays and for visitors with reduced motion. Mid-loop frames are motion-blurred; a sharper take can be generated when the free quota resets.
- Mobile: larger hero, menu opens under the fixed logo and button.

## Where the site differs from Figma, on purpose

- Item page footer: Figma has it 19 px left and with a 380 px empty band above. The site uses the Home footer position and spacing.
- Testimonials: Figma shows five dots for three testimonials. The site shows three dots and opens on the second one, like the render.
- Gallery thumbnails that are not selected are dimmed to 60 %.
- The grey "Hear from Our Satisfied Clients" subheading is left out: it is black on black in Figma and template text.
- Mobile and tablet layouts, hover and focus states, the mobile menu and the 404 page are not in Figma. They follow PLAN.md and use only existing components, colours and radii. The menu button uses the Figma Plus icon.
- Text written by the build, not by Simon: subscribe form status messages, "Back to Home" on the 404 page, page titles and meta description.

## Not done

- Deploy and the move away from the WordPress install (URLs, redirects, mail records, existing subscribers).
- Analytics, cookie banner.
- Video pause control (videos loop without one; they stay paused for visitors with reduced motion).
- `dist/_astro` contains the original PNGs next to the optimized ones (about 35 MB). Pages do not load them, but they inflate the upload.
- No commit has been made. `/review` and `/qa` have not been run.

## Adding a skin

Add `src/content/skins/<id>.json` (copy 0003 for a full example), put images in `src/assets/skins/` and videos in `public/media/skins/`, then place it on the Home grid in `src/data/placements.ts`. The build fails if the file does not match the schema.
