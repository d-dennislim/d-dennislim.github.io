#!/usr/bin/env node
/**
 * Copies the self-hosted font files into public/fonts.
 *
 * doc/brand-system.md §12 and §24: IBM Plex Sans + Mono, self-hosted, subset,
 * woff2 — no Google Fonts CDN (a third-party request, a privacy consideration
 * and a fallback-metric shift). The @fontsource packages already ship
 * per-unicode-range subsets, so the "latin" file *is* the subset; there is no
 * pyftsubset step.
 *
 * The weights are the ones the type scale actually uses:
 *   Sans 400 (body, body-lg, body-sm, quote) and 600 (display, h1, h2, h3)
 *   Mono 400 (code), 500 (label) and 600 (metric)
 */
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'public/fonts');

const FAMILIES = [
  { pkg: '@fontsource/ibm-plex-sans', slug: 'ibm-plex-sans', weights: [400, 600] },
  { pkg: '@fontsource/ibm-plex-mono', slug: 'ibm-plex-mono', weights: [400, 500, 600] },
];

mkdirSync(OUT, { recursive: true });

let copied = 0;
let bytes = 0;

for (const family of FAMILIES) {
  const dir = resolve(root, 'node_modules', family.pkg, 'files');
  const available = readdirSync(dir);

  for (const weight of family.weights) {
    // Match the plain `latin` subset only — `latin-ext` is a separate, larger
    // file we do not ship. Globbed rather than hard-coded so a change in
    // fontsource's naming surfaces as a clear error, not a silent 404.
    const pattern = new RegExp(`^${family.slug}-latin-${weight}-normal\\.woff2$`);
    const match = available.find((file) => pattern.test(file));
    if (!match) {
      throw new Error(
        `sync-fonts: no ${family.slug} weight ${weight} latin woff2 in ${family.pkg}. ` +
          `Found: ${available.filter((f) => f.endsWith('.woff2')).join(', ')}`,
      );
    }
    const dest = resolve(OUT, match);
    copyFileSync(resolve(dir, match), dest);
    copied += 1;
    bytes += statSync(dest).size;
  }
}

console.log(
  `sync-fonts: ${copied} woff2 files, ${(bytes / 1024).toFixed(1)} KB -> public/fonts`,
);
