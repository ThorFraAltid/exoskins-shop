// @ts-check
import { defineConfig } from 'astro/config';

// SITE_BASE lets the build live under a sub path (e.g. a staging folder).
// It must start and end with a slash; the default serves from the domain root.
const base = process.env.SITE_BASE ?? '/';

// https://astro.build/config
export default defineConfig({
  site: 'https://exoskins.shop',
  base,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
