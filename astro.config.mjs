// @ts-check
import { defineConfig } from 'astro/config';

/* No integrations: the only JavaScript this site ships is the theme toggle
   and the navbar prompt typing, a few hundred bytes together.
   `site` is deliberately unset — it exists to build canonical URLs and a
   sitemap, and those are part of the SEO milestone, not this one. Setting it to
   a placeholder domain now would put a fake URL in the output. */
export default defineConfig({
  build: { inlineStylesheets: 'never' },
});
