#!/usr/bin/env node
/**
 * The pre-publish gate. Runs over dist/ and exits non-zero on any failure.
 *
 * doc/brand-system.md §26 asks for exactly this — "Before every publish: grep
 * the build for [[FILL, Your Name, Client name, project-name,
 * you@yourdomain.com, and lorem. Any hit blocks the deploy. **This is worth an
 * actual CI check.**" — and §24 and §25 state numbers and required assets that
 * nothing currently measures either. All three are checked here because all
 * three fail the same way otherwise: silently, and only in front of a reader.
 *
 * Four groups:
 *   §26  placeholder strings                (content that isn't finished)
 *   §24  performance budget                 (weight, JS, request count)
 *   §22  head metadata and structured data  (shape, not taste)
 *   §25  required assets                    (the build is blocked without them)
 *
 * **The §26 pattern is pinned to `[[FILL` and must never be widened to
 * `\[\[`.** `[[REDACTED: label]]` is finished copy — a client name that was
 * never written down and never will be — and CLAUDE.md is explicit that
 * widening this pattern would block the deploy on every shipped redaction.
 *
 * Checks that need an absolute URL are skipped while `site.origin` is empty,
 * and each one says so on the way past. A skip is printed, never silent: an
 * empty origin is a state you are meant to notice, because it is the last
 * thing standing between this build and a launch.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(root, 'dist');

if (!existsSync(DIST)) {
  console.error('check-publish: no dist/ — run this after astro build');
  process.exit(1);
}

const profile = JSON.parse(readFileSync(resolve(root, 'src/content/profile.json'), 'utf8'));
const rawOrigin = profile.site.origin ?? '';
const hasOrigin = rawOrigin.length > 0 && !rawOrigin.startsWith('[[FILL');

const failures = [];
const skips = [];
const notes = [];

const fail = (rule, message) => failures.push(`${rule}  ${message}`);
const skip = (rule, message) => skips.push(`${rule}  ${message}`);
const note = (message) => notes.push(message);

/* ------------------------------------------------------------------ files -- */

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = walk(DIST);
const rel = (file) => relative(DIST, file).split(sep).join('/');
const TEXT = /\.(html|css|js|mjs|json|xml|txt|svg|webmanifest)$/i;

/* ----------------------------------------------------- §26 content rules -- */

/**
 * §26's six strings, verbatim.
 *
 * `[[FILL` is case-sensitive because it is a literal marker this repo writes;
 * the other five are placeholder prose from the design-system previews and can
 * arrive in any casing. `lorem` is matched on a word boundary so it cannot be
 * tripped by a hash or a filename that happens to contain the letters.
 */
const PLACEHOLDERS = [
  { pattern: /\[\[FILL/g, label: '[[FILL' },
  { pattern: /Your Name/gi, label: 'Your Name' },
  { pattern: /Client name/gi, label: 'Client name' },
  { pattern: /project-name/gi, label: 'project-name' },
  { pattern: /you@yourdomain\.com/gi, label: 'you@yourdomain.com' },
  { pattern: /\blorem\b/gi, label: 'lorem' },
];

for (const file of files.filter((f) => TEXT.test(f))) {
  const body = readFileSync(file, 'utf8');
  for (const { pattern, label } of PLACEHOLDERS) {
    const hits = body.match(pattern);
    if (hits) fail('§26', `"${label}" x${hits.length} in ${rel(file)} — unfinished copy cannot ship`);
  }
}

/* ------------------------------------------------- §24 performance budget -- */

/* §24's table. `requests` was 20 until 2026-09-21, when it was raised by the
   two requests §25's required assets make unavoidable — one favicon from the
   icon set, plus the manifest Chrome fetches on load. §28's decision log
   carries the entry. */
const BUDGET = { pageBytes: 400 * 1024, jsBytes: 10 * 1024, requests: 22 };

const html = files.filter((f) => f.endsWith('.html'));
if (html.length === 0) fail('§24', 'dist/ contains no HTML — nothing was built');

/**
 * What one page actually costs: the document, plus every subresource its own
 * markup references. Counted per page rather than over dist/, because §24's
 * budget is "total page weight (home, excluding resume)" — the twelve
 * certification badges ship in two formats each and only one format is ever
 * fetched, so summing the directory would fail a budget the page meets.
 *
 * `<picture>` is the reason for the `source` handling: only the first format
 * the browser accepts is fetched, so an avif/webp pair is one request and the
 * avif's bytes, not both.
 */
const referencedAssets = (body) => {
  const refs = new Set();
  const icons = [];
  const add = (href) => {
    if (!href || /^(https?:|data:|mailto:|#)/i.test(href)) return;
    refs.add(href.split('?')[0].split('#')[0].replace(/^\//, ''));
  };

  for (const match of body.matchAll(/<link[^>]+>/g)) {
    const tag = match[0];
    const href = tag.match(/href="([^"]+)"/)?.[1];
    /* The icon set is alternates, not a set of loads: a browser picks one
       favicon and fetches `apple-touch-icon` only when iOS is adding the site
       to a home screen, which is not a page load at all. Counted as one, the
       same call the avif/webp pair below gets. The manifest is not an
       alternate — Chrome fetches it on load — so it is counted separately. */
    if (/rel="(icon|apple-touch-icon)"/.test(tag)) {
      icons.push(href);
      continue;
    }
    add(href);
  }
  for (const [, src] of body.matchAll(/<script[^>]+src="([^"]+)"/g)) add(src);
  for (const [, src] of body.matchAll(/<img[^>]+src="([^"]+)"/g)) add(src);
  if (icons.length) add(icons[0]);

  /* One entry per <picture>: its first <source>, which is the format a modern
     browser takes, standing in for the whole set. */
  for (const match of body.matchAll(/<picture[\s\S]*?<\/picture>/g)) {
    const first = match[0].match(/<source[^>]+srcset="([^",\s]+)/);
    if (first) add(first[1]);
  }
  return [...refs];
};

const sizeOf = (assetPath) => {
  const full = resolve(DIST, assetPath);
  return existsSync(full) ? statSync(full).size : 0;
};

for (const page of html) {
  const body = readFileSync(page, 'utf8');
  const assets = referencedAssets(body);

  /* A <picture>'s <img src> and its first <source> are the same request; the
     set already de-duplicates identical hrefs, and the avif/webp pair differs
     only in extension, so the fallback is dropped here. */
  const avif = new Set(assets.filter((a) => a.endsWith('.avif')).map((a) => a.replace(/\.avif$/, '')));
  const fetched = assets.filter((a) => !(a.endsWith('.webp') && avif.has(a.replace(/\.webp$/, ''))));

  const pageBytes = statSync(page).size + fetched.reduce((sum, a) => sum + sizeOf(a), 0);
  /* §24's JS budget is bytes the browser parses and runs, so a `<script>` the
     browser never executes is not JS. The one on this page is the JSON-LD
     graph: it is data in a script tag, it costs real bytes — counted, like all
     of the document, in pageBytes above — and charging it to a 10 KB
     executable budget would read as the site having doubled its JavaScript by
     adding structured data, which is the opposite of what happened. */
  const executable = (tag) => {
    const type = tag.match(/\stype="([^"]*)"/)?.[1];
    return !type || /^(text\/javascript|application\/javascript|module)$/i.test(type);
  };

  const jsBytes =
    [...body.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter((m) => executable(m[1]))
      .reduce((sum, m) => sum + Buffer.byteLength(m[2], 'utf8'), 0) +
    fetched.filter((a) => /\.m?js$/.test(a)).reduce((sum, a) => sum + sizeOf(a), 0);
  const requests = 1 + fetched.length;

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const name = rel(page);

  if (pageBytes > BUDGET.pageBytes)
    fail('§24', `${name} weighs ${kb(pageBytes)} — budget is ${kb(BUDGET.pageBytes)}`);
  if (jsBytes > BUDGET.jsBytes)
    fail('§24', `${name} ships ${kb(jsBytes)} of JS — budget is ${kb(BUDGET.jsBytes)}`);
  if (requests > BUDGET.requests)
    fail('§24', `${name} makes ${requests} requests — budget is ${BUDGET.requests}`);

  note(`${name}: ${kb(pageBytes)}, ${kb(jsBytes)} JS, ${requests} requests`);
}

/* --------------------------------------------------------------- §22 SEO -- */

const attr = (body, re) => {
  const match = body.match(re);
  return match ? match[1] : null;
};
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

for (const page of html) {
  const body = readFileSync(page, 'utf8');
  const name = rel(page);

  const title = attr(body, /<title>([\s\S]*?)<\/title>/);
  if (!title) fail('§22', `${name} has no <title>`);
  else if (decode(title).length >= 60)
    fail('§22', `${name} title is ${decode(title).length} chars — §22 says under 60`);

  const descriptions = [...body.matchAll(/<meta\s+name="description"\s+content="([^"]*)"/g)];
  if (descriptions.length === 0) fail('§22', `${name} has no meta description`);
  else if (descriptions.length > 1)
    fail('§22', `${name} has ${descriptions.length} meta descriptions — §22 says one per page`);
  else {
    const written = decode(descriptions[0][1]);
    /* An unwritten description is §26's failure, not §22's, and it is already
       reported above. Measuring the marker as well would print two lines about
       one missing sentence and put a character count on a placeholder, which
       reads as if 160 characters of the right length would satisfy it. */
    if (written.startsWith('[[FILL')) {
      note(`${name}: meta description not written yet — §26 is blocking on it above`);
    } else if (written.length < 150 || written.length > 160) {
      fail('§22', `${name} meta description is ${written.length} chars — §22 says 150-160`);
    }
  }

  for (const property of ['og:title', 'og:description', 'og:type']) {
    if (!body.includes(`property="${property}"`)) fail('§22', `${name} is missing ${property}`);
  }

  /* `og:image` sits with the canonical rather than with its own siblings: the
     Open Graph spec requires an absolute URL for it and no scraper resolves a
     relative one, so it is the third tag that cannot be written until there is
     an origin. The card degrades to a text preview in the meantime. */
  if (hasOrigin) {
    if (!/<meta\s+property="og:image"\s+content="https?:\/\//.test(body))
      fail('§22', `${name} has no absolute og:image`);
  } else {
    skip('§22', `${name}: og:image — an OG image URL has to be absolute, and site.origin is empty`);
  }

  const card = attr(body, /<meta\s+name="twitter:card"\s+content="([^"]*)"/);
  if (card !== 'summary_large_image')
    fail('§22', `${name} twitter:card is ${card ?? 'absent'} — §22 says summary_large_image`);

  if (hasOrigin) {
    if (!/<link\s+rel="canonical"\s+href="https?:\/\//.test(body))
      fail('§22', `${name} has no absolute self-referencing canonical`);
    if (!/<meta\s+property="og:url"\s+content="https?:\/\//.test(body))
      fail('§22', `${name} has no absolute og:url`);
  } else {
    skip('§22', `${name}: canonical and og:url — site.origin is empty, so neither can be absolute`);
  }

  /* The JSON-LD is checked for the five fields §22 names, and for parsing at
     all: a graph that doesn't parse is invisible rather than wrong, which is
     the failure mode nobody notices. */
  const blocks = [...body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) {
    if (hasOrigin) fail('§22', `${name} has no JSON-LD`);
    else skip('§22', `${name}: JSON-LD — Person needs an absolute url, and site.origin is empty`);
  }
  for (const [, json] of blocks) {
    let graph;
    try {
      graph = JSON.parse(json);
    } catch (error) {
      fail('§22', `${name} JSON-LD does not parse: ${error.message}`);
      continue;
    }
    if (graph['@type'] !== 'Person') continue;
    for (const key of ['name', 'jobTitle', 'url', 'sameAs', 'hasCredential']) {
      if (!graph[key]) fail('§22', `${name} Person JSON-LD is missing ${key}`);
    }
  }
}

/* robots.txt is required either way; sitemap.xml only once there is an origin
   to write absolute <loc> values with. */
if (!existsSync(resolve(DIST, 'robots.txt'))) fail('§22', 'no robots.txt in the build');
if (hasOrigin) {
  if (!existsSync(resolve(DIST, 'sitemap.xml'))) fail('§22', 'no sitemap.xml in the build');
} else {
  skip('§22', 'sitemap.xml — site.origin is empty, and <loc> has to be absolute');
}

/* --------------------------------------------------- §25 required assets -- */

for (const asset of [
  'favicon.svg',
  'favicon-96.png',
  'apple-touch-icon.png',
  'site.webmanifest',
  'og.png',
]) {
  if (!existsSync(resolve(DIST, asset)))
    fail('§25', `${asset} is missing — §25 marks it required and blocks the build without it`);
}

/* ----------------------------------------------------------------- report -- */

for (const line of notes) console.log(`check-publish: ${line}`);
for (const line of skips) console.log(`check-publish: SKIPPED  ${line}`);

if (failures.length === 0) {
  console.log(
    `check-publish: pass — ${html.length} page(s) checked against §22, §24, §25 and §26` +
      (skips.length ? `, ${skips.length} check(s) skipped pending site.origin` : ''),
  );
  process.exit(0);
}

console.error(`\ncheck-publish: BLOCKED — ${failures.length} failure(s)\n`);
for (const line of failures) console.error(`  ${line}`);
console.error('\nThese are publish gates, not warnings. Fix them or the deploy ships broken.\n');
process.exit(1);
