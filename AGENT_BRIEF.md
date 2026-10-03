# Brief for build agents (read fully before touching anything)

Project: `/Users/thorjekes/exoskins-shop`. Astro 7 static site, TypeScript, plain CSS, bun. Read `PLAN.md` completely first; the section "Review outcome" is binding and overrides the text above it.

## The one rule

The website is Simon's Figma file, 1:1. Not a similar design. Not your taste. Every size, colour, radius, gap, font size, line height, text string and asset comes from the Figma file. If Figma does not define something (mobile layout, hover states), follow PLAN.md "Responsive spec" and "States". Never invent copy, sections, decorations, gradients, shadows or icons.

## How to read the design

Figma file key: `R3y0iSFbggXv7vRS4b3I4M`. Node ids and frame coordinates of every section: `design-source/figma/sections.json`. Full renders at 1440 wide: `design-source/figma/home-1440.png`, `item-1440.png` (view crops with the Read tool; crop with ffmpeg first, the full images are tall).

Use the Figma MCP tools (load them with ToolSearch, query `select:mcp__0c6a45fe-a27d-4dfa-aafc-48c49d67f2b5__get_design_context,mcp__0c6a45fe-a27d-4dfa-aafc-48c49d67f2b5__get_screenshot,mcp__0c6a45fe-a27d-4dfa-aafc-48c49d67f2b5__download_assets,mcp__0c6a45fe-a27d-4dfa-aafc-48c49d67f2b5__get_variable_defs`):

- `get_design_context` with `fileKey`, `nodeId`, `clientFrameworks: "astro"`, `clientLanguages: "typescript,html,css"`, `skillNames: "resource:figma-design-to-code"`. Call it per section node, never on the whole frame (the response is cut off above about 20 KB; if a call fails with a JSON parse error, call it on the child nodes instead).
- It returns React + Tailwind. Convert to Astro components and plain CSS. Keep the exact numbers. Turn absolute positioning into flex/grid where the layout is a normal flow, keep it where the design is a true overlay (hero).
- It returns asset URLs (`https://www.figma.com/api/mcp/asset/...`). Download every one with curl into the repo straight away. No Figma URL may remain in the code. Do not redraw, simplify or replace an asset. SVGs keep their root width/height.
- Never use a screenshot of the design as an image in the site.

## Conventions

- Images that need optimizing go in `src/assets/` and are rendered with `astro:assets` (`<Image>`/`<Picture>`, AVIF + WebP, alpha kept). SVGs and videos go in `public/media/`.
- Every URL is built with the helper `url()` from `src/lib/url.ts` (prefixes `import.meta.env.BASE_URL`). No hardcoded leading-slash paths in components.
- Design tokens only from `src/styles/tokens.css`. No magic colours in components.
- Each section root element carries `data-figma="<node id>"` matching `sections.json` (used by the visual diff).
- Fonts: `@fontsource/space-grotesk` weights 400 and 500.
- No fallback code that hides errors, no TODOs, no stubs, no placeholder implementations. If something cannot be built from the available information, stop and report it instead of inventing.
- Do not use git commit. Do not deploy. Do not start long-lived dev servers and leave them running; if you start one for a check, stop it.
- Other agents work in this repo at the same time. Only edit the files your task names. If you need a change in someone else's file, report it instead.

## Done for your task means

`bun run build` passes, you looked at your result in a browser screenshot next to the Figma crop and fixed the differences, and your final message lists: files created, anything you could not match and why, anything you had to decide yourself.
