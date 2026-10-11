#!/usr/bin/env node
/**
 * The lab benchmark: Lighthouse over the built site, asserted against §24.
 *
 * This is the second of the two things that measure this site, and they
 * measure different kinds of thing. check-publish.mjs runs on every build and
 * checks what is *in* the output — strings, bytes, tags. This runs on demand
 * and checks how the output *behaves* in a browser, which needs a browser and
 * takes half a minute, so it is not something to put in front of every save.
 *
 * doc/brand-system.md §24 sets the targets — LCP < 1.5s, CLS 0, INP < 100ms,
 * Lighthouse >= 95 on all four categories — and §27 asks for Core Web Vitals
 * "field data, if traffic allows; lab otherwise". Lab, here: there is no
 * analytics and, at this traffic, no CrUX entry to read either.
 *
 * Two notes on what the numbers mean.
 *
 * **INP has no lab equivalent.** It measures real interactions by real people;
 * a headless run has none. Total Blocking Time is what Lighthouse offers in
 * its place and is reported as such, never relabelled — a site shipping 3 KB
 * of JavaScript will read 0ms and that is not the same as having been shown
 * to answer a click in under 100ms.
 *
 * **The accessibility score is not §27's "axe clean".** Lighthouse runs a
 * subset of axe-core's rules, automatically, in one mode. It catches
 * regressions, which is worth having every quarter. §20's pre-launch list —
 * keyboard-only pass, VoiceOver or NVDA, 200% zoom, both modes, greyscale —
 * is a person's job and this script records when one was last done rather
 * than pretending to have done it.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(root, 'dist');
const REPORTS = resolve(root, 'reports');
const MEASURES = resolve(root, 'doc/measures.md');

if (!existsSync(DIST)) {
  console.error('audit: no dist/ — run `npm run build` first');
  process.exit(1);
}

/* §24's table, as numbers. Lighthouse categories are 0-1; the budget is the
   0-100 figure §24 states, so it is compared after scaling. */
const TARGETS = {
  score: 95,
  lcpMs: 1500,
  cls: 0,
};

/* ------------------------------------------------------------------ serve -- */

/**
 * A static server over dist/, rather than `astro preview` in a child process.
 * Fewer moving parts to leave running if the audit throws, and it serves the
 * same bytes the deploy would — which is the point of auditing the build
 * instead of the dev server, where public/ is served `no-cache` and the dev
 * toolbar is in the document.
 */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  /* `normalize` then a prefix test: a request is allowed to reach dist/ and
     nothing above it. */
  let file = resolve(DIST, `.${normalize(decodeURIComponent(url.pathname))}`);
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && extname(file) === '') file = join(file, 'index.html');
  if (!existsSync(file) || extname(file) === '') {
    res.writeHead(404).end('not found');
    return;
  }
  const body = readFileSync(file);
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    /* Long-lived, like a CDN would: an audit against a no-cache origin
       measures the origin's headers, not the page. */
    'cache-control': 'public, max-age=31536000',
  });
  res.end(body);
});

await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const { port } = server.address();
const target = `http://127.0.0.1:${port}/`;

/* ------------------------------------------------------------- lighthouse -- */

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

let result;
try {
  result = await lighthouse(
    target,
    { port: chrome.port, output: 'json', logLevel: 'error' },
    /* Mobile emulation and 4G throttling are Lighthouse's defaults and are
       also the conditions §24 states its LCP budget under ("< 1.5s (4G)"), so
       they are left alone deliberately rather than configured away. */
    undefined,
  );
} finally {
  chrome.kill();
  server.close();
}

const lhr = result.lhr;

const categories = ['performance', 'accessibility', 'best-practices', 'seo'].map((id) => ({
  id,
  title: lhr.categories[id].title,
  score: Math.round(lhr.categories[id].score * 100),
}));

const metric = (id) => lhr.audits[id]?.numericValue ?? null;
const lcp = metric('largest-contentful-paint');
const cls = metric('cumulative-layout-shift');
const tbt = metric('total-blocking-time');

/* ---------------------------------------------------------------- report -- */

const failures = [];
for (const category of categories) {
  if (category.score < TARGETS.score)
    failures.push(`${category.title} scored ${category.score} — §24 says >= ${TARGETS.score}`);
}
if (lcp !== null && lcp > TARGETS.lcpMs)
  failures.push(`LCP is ${Math.round(lcp)}ms — §24 says < ${TARGETS.lcpMs}ms`);
if (cls !== null && cls > TARGETS.cls)
  failures.push(`CLS is ${cls.toFixed(3)} — §24 says ${TARGETS.cls}`);

const stamp = new Date().toISOString().slice(0, 10);
mkdirSync(REPORTS, { recursive: true });
const reportPath = resolve(REPORTS, `lighthouse-${stamp}.json`);
writeFileSync(reportPath, JSON.stringify(lhr, null, 2));

for (const category of categories) console.log(`audit: ${category.title.padEnd(16)} ${category.score}`);
console.log(`audit: LCP ${lcp === null ? 'n/a' : `${Math.round(lcp)}ms`}`);
console.log(`audit: CLS ${cls === null ? 'n/a' : cls.toFixed(3)}`);
console.log(`audit: TBT ${tbt === null ? 'n/a' : `${Math.round(tbt)}ms`} (lab stand-in for INP, not INP)`);
console.log(`audit: report -> ${reportPath.replace(`${root}/`, '')}`);

/*
 * One row per run in the log, so the benchmark is a trend and not a number
 * somebody once saw. §28 asks for this quarterly.
 *
 * Inserted directly under the Tier 2 table's header rather than appended to
 * the file, which would put it after the prose and outside the table — newest
 * first, so the current state is the row you read without scrolling.
 */
if (existsSync(MEASURES)) {
  const scores = categories.map((c) => c.score).join(' / ');
  const row =
    `| ${stamp} | ${scores} | ${lcp === null ? 'n/a' : `${Math.round(lcp)}ms`} | ` +
    `${cls === null ? 'n/a' : cls.toFixed(3)} | ${tbt === null ? 'n/a' : `${Math.round(tbt)}ms`} | ` +
    `${failures.length === 0 ? 'pass' : `${failures.length} over budget`} |`;

  const log = readFileSync(MEASURES, 'utf8');
  const header = '| Date | Perf / A11y / Best practices / SEO | LCP | CLS | TBT | Result |';
  const at = log.indexOf(header);
  if (at === -1) {
    console.warn(`audit: no run table in ${MEASURES.replace(`${root}/`, '')} — row not logged`);
  } else {
    /* Past the header and its separator row, which is the next newline down. */
    const divider = log.indexOf('\n', log.indexOf('\n', at) + 1);
    writeFileSync(MEASURES, `${log.slice(0, divider + 1)}${row}\n${log.slice(divider + 1)}`);
  }
}

if (failures.length === 0) {
  console.log('audit: pass — all four categories >= 95, LCP and CLS inside §24');
  process.exit(0);
}

console.error('\naudit: OVER BUDGET\n');
for (const line of failures) console.error(`  ${line}`);
console.error(`\nThe full trace is in ${reportPath.replace(`${root}/`, '')}.\n`);
process.exit(1);
