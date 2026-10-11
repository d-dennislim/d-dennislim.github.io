#!/usr/bin/env node
/**
 * Writes robots.txt and sitemap.xml into the finished build.
 *
 * doc/brand-system.md §22: "`sitemap.xml` listing every real page; `robots.txt`
 * allowing everything and pointing to the sitemap. Keep the PDF resume
 * indexable — recruiters find it directly."
 *
 * Why a script and not @astrojs/sitemap. The integration needs `site` to be
 * set, and `site` is deliberately unset until `site.origin` in profile.json
 * names a real host — so on this repo, today, adding it would turn a working
 * build into a failing one. This runs after the build instead, writes robots
 * either way, and writes the sitemap only when there is an origin to put in
 * it. A sitemap of relative paths is not a sitemap: the format requires an
 * absolute `<loc>`, and a guessed host is the fake URL astro.config.mjs
 * refuses.
 *
 * **It enumerates what the build emitted, not what §21 lists.** §21's IA names
 * `/case-studies/<slug>`, `/writing` and `/resume.pdf`; none of the three is
 * built yet. Walking `dist/` means the sitemap gains each of them on the build
 * that first emits it, and can never advertise a URL that 404s — which is the
 * one way a sitemap actively costs you.
 */
import { existsSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(root, 'dist');

const profile = JSON.parse(readFileSync(resolve(root, 'src/content/profile.json'), 'utf8'));

const rawOrigin = profile.site.origin ?? '';
const origin =
  rawOrigin.length > 0 && !rawOrigin.startsWith('[[FILL') ? rawOrigin.replace(/\/+$/, '') : null;

if (!existsSync(DIST)) {
  throw new Error('build-seo-files: no dist/ — run this after astro build, not before');
}

/** Every file under dist/, as paths relative to it. */
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [relative(DIST, full)];
  });

const files = walk(DIST);

/**
 * The indexable URLs: every emitted HTML page, plus the resume PDF if one is
 * ever served from the site (§22 asks for it by name). `index.html` maps to
 * its directory, which is the URL a reader is actually given — `/` and
 * `/case-studies/foo/`, never `/case-studies/foo/index.html`.
 */
const routes = files
  .filter((file) => file.endsWith('.html') || /(^|[\\/])resume\.pdf$/i.test(file))
  .map((file) => {
    const url = `/${file.split(sep).join('/')}`;
    return url.endsWith('/index.html') ? url.slice(0, -'index.html'.length) : url;
  })
  .sort();

/* robots.txt is written whether or not there is an origin: allow-all is the
   correct and complete instruction on its own, and the `Sitemap:` line is the
   only part that needs an absolute URL. */
const robots = [
  'User-agent: *',
  'Allow: /',
  ...(origin ? ['', `Sitemap: ${origin}/sitemap.xml`] : []),
  '',
].join('\n');

writeFileSync(resolve(DIST, 'robots.txt'), robots);

if (!origin) {
  console.log(
    `build-seo-files: robots.txt written (allow-all, no Sitemap: line). ` +
      `sitemap.xml skipped — site.origin is empty, and <loc> has to be absolute. ` +
      `${routes.length} route(s) are ready for it.`,
  );
  process.exit(0);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}
</urlset>
`;

writeFileSync(resolve(DIST, 'sitemap.xml'), sitemap);

console.log(
  `build-seo-files: robots.txt + sitemap.xml written, ${routes.length} route(s): ${routes.join(', ')}`,
);
