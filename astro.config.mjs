// @ts-check
import { defineConfig } from 'astro/config';
import profile from './src/content/profile.json' with { type: 'json' };

/* No integrations. The only JavaScript this site ships is the theme toggle,
   the navbar prompt typing and the navbar section spy — a few KB together.
   That includes @astrojs/sitemap, which ships no client JS but does require
   `site` to be set: scripts/build-seo-files.mjs writes the sitemap instead, so
   an unset `site` is a working state rather than a build error.

   `site` is read from `site.origin` in profile.json rather than written here,
   so the origin is stored exactly once and filling that one string switches on
   the canonical, `og:url`, `sitemap.xml` and robots' `Sitemap:` line together.
   While it is empty the key stays unset, which is what it has always been and
   for the original reason: a placeholder domain would put a fake URL in the
   output. */
const origin = profile.site.origin;

export default defineConfig({
  ...(origin && !origin.startsWith('[[FILL') ? { site: origin } : {}),
  build: { inlineStylesheets: 'never' },
});
