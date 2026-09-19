#!/usr/bin/env node
/**
 * Compiles certification badge artwork into the formats the page serves.
 *
 * doc/brand-system.md §24: images in AVIF with a WebP fallback, explicit
 * dimensions, lazy below the fold. The source art is far larger than it needs
 * to be — Credly ships 600x600 — so shipping it untouched would blow the 400 KB
 * page budget several times over with twelve certifications.
 *
 * Output is 128px for a 64px display box, so the badge stays sharp at 2x,
 * which is most screens.
 *
 * Note on provenance: this artwork is AWS/Credly's, not ours. The design system
 * says not to redistribute it without checking their asset terms — that check
 * was made deliberately, and every badge on the page links back to its Credly
 * verification page, which is the context these share assets exist for. See the
 * comment in src/components/Certifications.astro.
 */
import { mkdirSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'assets/badges');
const OUT = resolve(root, 'public/badges');

/**
 * Twice the display box, so the badge stays sharp at 2x — which is most
 * screens. The display size is `--hex-size` in bundle.css, currently the design
 * system's 128px on the shelf; keep these two in step.
 */
const SIZE = 256;

if (!existsSync(SRC)) {
  console.log('build-badges: no assets/badges directory — nothing to do');
  process.exit(0);
}

const sources = readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

if (sources.length === 0) {
  console.log('build-badges: assets/badges is empty — nothing to do');
  process.exit(0);
}

// Wipe first: the output filename carries the render size, so changing SIZE
// would otherwise leave the previous run's files behind to be shipped.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let written = 0;
let bytes = 0;

for (const file of sources) {
  const slug = parse(file).name;
  // `contain` with a transparent background rather than `cover`: the artwork is
  // a hexagon on a square canvas, and cropping it would clip the points.
  // Credly pads its artwork inside the canvas — the Advanced Networking badge
  // is 507x584 opaque in a 600x600 file. Left alone that renders ~54px in a
  // 64px box while the drawn hexagons beside it fill 64px, so the padding is
  // trimmed before resizing and the art fills its box.
  // `inside` rather than `contain`: the badge box is a hexagon, not a square,
  // so padding the output back out to a square would waste bytes and risk the
  // img stretching. This keeps the artwork's own 0.868 aspect.
  const base = sharp(resolve(SRC, file))
    .trim({ threshold: 1 })
    .resize(SIZE, SIZE, { fit: 'inside' });

  for (const [ext, encode] of [
    ['avif', (img) => img.avif({ quality: 55 })],
    ['webp', (img) => img.webp({ quality: 82 })],
  ]) {
    const dest = resolve(OUT, `${slug}-${SIZE}.${ext}`);
    await encode(base.clone()).toFile(dest);
    written += 1;
    bytes += statSync(dest).size;
  }
}

console.log(
  `build-badges: ${written} files from ${sources.length} badge${sources.length === 1 ? '' : 's'}, ` +
    `${(bytes / 1024).toFixed(1)} KB -> public/badges`,
);
