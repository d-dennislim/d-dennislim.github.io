#!/usr/bin/env node
/**
 * Draws the identity assets §25 marks Required: the favicon set, the web
 * manifest and the 1200x630 Open Graph card.
 *
 * doc/brand-system.md §10 specifies all of them and specifies them as
 * *drawings of the monogram*, not as photographs — "the identity is
 * typographic". That is why they are generated rather than exported by hand:
 * every value below comes from design-system/tokens.json and
 * src/content/profile.json, so a change to `brand`, to the type scale or to
 * the initials cannot leave a stale PNG behind. A hand-exported favicon is a
 * copy of a token that nothing keeps in step, and hard rule 2 exists because
 * those copies drift.
 *
 * §10's requirements, and where each is met:
 *   favicon.svg          — monogram on a `brand` fill at `radius-md`
 *   favicon-96.png       — the same drawing, rasterised
 *   apple-touch-icon.png — 180x180, per §10
 *   site.webmanifest     — names and theme colours, from the same two files
 *   og.png               — 1200x630, the Cover construction (§10): colour band
 *                          across the top, name in `display` bottom-left,
 *                          title line beneath in `mono`
 *
 * Both drawings are **light mode only**, deliberately. A social scraper has no
 * colour-scheme preference and a browser tab strip is not the page, so there
 * is no second mode to check here — this is the one place CLAUDE.md's "both
 * modes, every time" has nothing to test. §10's own dark-tab note is answered
 * instead by the fill being opaque: the monogram sits on solid `brand`, never
 * on transparency, so it does not disappear against a dark tab.
 *
 * Glyphs are emitted as paths, not as text. satori's `embedFont` converts them
 * while it renders, which means neither the favicon nor the OG card depends on
 * the viewer having IBM Plex installed — and the SVG favicon stays a few KB
 * because two glyphs is all it carries.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/**
 * The public root, not a subdirectory: `/favicon.svg` and `/apple-touch-icon.png`
 * are fetched by convention at those exact paths by clients that never read the
 * head — an RSS reader, a crawler, iOS adding to the home screen — and a
 * declared path only helps the ones that do.
 *
 * Writing here is why this script names its outputs instead of wiping its
 * output directory the way build-badges does: `public/` also holds the fonts
 * and the badges, and an `rmSync` on it would delete another generator's work.
 */
const OUT = resolve(root, 'public');
const OUTPUTS = [
  'favicon.svg',
  'favicon-96.png',
  'apple-touch-icon.png',
  'og.png',
  'site.webmanifest',
];

const tokens = JSON.parse(readFileSync(resolve(root, 'design-system/tokens.json'), 'utf8'));
const profile = JSON.parse(readFileSync(resolve(root, 'src/content/profile.json'), 'utf8'));

/* ---------------------------------------------------------------- tokens -- */

/** Light-mode value of a colour token, by name. Throws rather than guessing. */
const colour = (name) => {
  const token = tokens.color.tokens.find((t) => t.name === name);
  if (!token) throw new Error(`build-brand-assets: no colour token "${name}" in tokens.json`);
  return token.value.light;
};

/** A type style from the scale, by name — `display`, `label`, `metric`. */
const typeStyle = (name) => {
  for (const group of tokens.type.groups) {
    const style = group.styles.find((s) => s.name === name);
    if (style) return style;
  }
  throw new Error(`build-brand-assets: no type style "${name}" in tokens.json`);
};

/** A spacing or radius token's px value as a number. */
const scaleValue = (group, name) => {
  const token = tokens[group].tokens.find((t) => t.name === name);
  if (!token) throw new Error(`build-brand-assets: no ${group} token "${name}" in tokens.json`);
  return Number.parseInt(token.value, 10);
};

const px = (style) => Number.parseInt(style.fontSize, 10);

const BRAND = colour('brand');
const ON_BRAND = colour('on-brand');
const SURFACE = colour('surface');
const INK = colour('ink');
const ACCENT = colour('accent');

/* ----------------------------------------------------------------- fonts -- */

/**
 * satori takes woff, ttf or otf — not woff2, which is the only format
 * sync-fonts copies into public/fonts because it is the only one the page
 * serves. The @fontsource packages ship both, so the build reads the woff
 * straight out of node_modules rather than adding a second file to public/.
 */
const fontFile = (pkg, file) => readFileSync(resolve(root, 'node_modules', pkg, 'files', file));

const fonts = [
  {
    name: 'IBM Plex Sans',
    data: fontFile('@fontsource/ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff'),
    weight: 600,
    style: 'normal',
  },
  {
    name: 'IBM Plex Mono',
    data: fontFile('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff'),
    weight: 500,
    style: 'normal',
  },
  {
    name: 'IBM Plex Mono',
    data: fontFile('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-600-normal.woff'),
    weight: 600,
    style: 'normal',
  },
];

/** satori takes React-ish elements; these are the two nodes we need. */
const h = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

/* --------------------------------------------------------------- monogram -- */

/**
 * The monogram, drawn at the size the design system's own avatar uses.
 *
 * 64px with `radius-md` is the literal token pair rather than a radius scaled
 * to each output size, and the SVG's viewBox does the scaling — so the corner
 * stays proportionally `radius-md` at 96px and at 180px without a second value
 * being invented for either. The glyph size is `metric` (mono 600), the only
 * mono style in the scale built for a large figure.
 */
const MONOGRAM_BOX = 64;
const initials = profile.identity.initials;

const monogramSvg = await satori(
  h(
    'div',
    {
      style: {
        width: MONOGRAM_BOX,
        height: MONOGRAM_BOX,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND,
        borderRadius: scaleValue('radius', 'radius-md'),
        color: ON_BRAND,
        fontFamily: 'IBM Plex Mono',
        fontWeight: 600,
        fontSize: px(typeStyle('metric')),
        letterSpacing: '0.02em',
      },
    },
    initials,
  ),
  { width: MONOGRAM_BOX, height: MONOGRAM_BOX, fonts, embedFont: true },
);

/* -------------------------------------------------------------- OG card --- */

/**
 * Rendered at 2x the layout it is designed in, the same trade build-badges
 * makes for the certification art: the card is 1200x630 by §22, but a feed
 * shows it at about half that, so laying it out at token sizes and doubling
 * them means the name lands at `display` size *as seen*, not as measured in
 * the file.
 */
const SCALE = 2;
const OG_W = 1200;
const OG_H = 630;

const display = typeStyle('display');
const label = typeStyle('label');

const ogSvg = await satori(
  h(
    'div',
    {
      style: {
        width: OG_W,
        height: OG_H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: SURFACE,
        fontFamily: 'IBM Plex Sans',
        /* The band across the top, §10's Cover construction. Drawn as a border
           rather than a child so it cannot be pushed around by the layout. */
        borderTop: `${scaleValue('spacing', 'space-4') * SCALE}px solid ${BRAND}`,
        padding: scaleValue('spacing', 'space-16') * SCALE,
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          fontSize: px(display) * SCALE,
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: display.letterSpacing ?? '0',
          color: INK,
        },
      },
      profile.identity.name,
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          marginTop: scaleValue('spacing', 'space-4') * SCALE,
          fontFamily: 'IBM Plex Mono',
          fontSize: px(label) * SCALE,
          lineHeight: 1,
          fontWeight: 500,
          letterSpacing: label.letterSpacing ?? '0',
          /* `accent` is the token documented for "the role line under the
             name" — the same colour the hero uses for the same sentence. */
          color: ACCENT,
        },
      },
      profile.identity.role,
    ),
  ),
  { width: OG_W, height: OG_H, fonts, embedFont: true },
);

/* ---------------------------------------------------------------- output -- */

/* Each output removed first, by name. Same intent as build-badges' wipe — a
   half-written file from a failed run must not survive into the build — but
   scoped, because this generator shares public/ with two others. */
mkdirSync(OUT, { recursive: true });
for (const name of OUTPUTS) rmSync(resolve(OUT, name), { force: true });

const written = [];
const write = (name, data) => {
  writeFileSync(resolve(OUT, name), data);
  written.push(`${name} (${(statSync(resolve(OUT, name)).size / 1024).toFixed(1)} KB)`);
};

write('favicon.svg', monogramSvg);

const rasterise = (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

write('favicon-96.png', await rasterise(monogramSvg, 96));
write('apple-touch-icon.png', await rasterise(monogramSvg, 180));
write('og.png', await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toBuffer());

/*
 * The manifest names come from profile.json for the same reason every other
 * string does — `short_name` is what an installed tile is labelled, and a name
 * that disagrees with the page is the §23 consistency leak in miniature.
 * `display: "browser"` because this is a site, not an app; a portfolio that
 * launches chromeless is pretending to be something it isn't.
 */
write(
  'site.webmanifest',
  `${JSON.stringify(
    {
      name: profile.site.title,
      short_name: profile.identity.name,
      start_url: '/',
      display: 'browser',
      theme_color: BRAND,
      background_color: SURFACE,
      icons: [
        { src: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
        { src: '/favicon-96.png', type: 'image/png', sizes: '96x96' },
        { src: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
      ],
    },
    null,
    2,
  )}\n`,
);

console.log(`build-brand-assets: ${written.join(', ')} -> public`);
