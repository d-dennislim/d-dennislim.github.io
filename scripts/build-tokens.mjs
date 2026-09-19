#!/usr/bin/env node
/**
 * Compiles design-system/tokens.json into src/styles/tokens.css.
 *
 * Nothing in this script contains a design value. Every colour, size, radius
 * and shadow below is read out of tokens.json — which is the single source of
 * truth (CLAUDE.md, hard rule 2). If a value looks wrong on the page, fix it in
 * tokens.json and re-run; never edit the generated CSS.
 *
 * Output shape:
 *   :root                                          light values + type classes
 *   @media (prefers-color-scheme: dark)
 *     :root:not([data-theme="light"])               dark values, OS preference
 *   [data-theme="dark"]                             dark values, manual override
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'design-system/tokens.json');
const OUT = resolve(root, 'src/styles/tokens.css');

const tokens = JSON.parse(readFileSync(SRC, 'utf8'));

/** `foo: bar;` at a given indent. */
const decl = (name, value, indent = '  ') => `${indent}--${name}: ${value};`;

/** Themed families: colour and shadow both carry { light, dark }. */
const themed = [
  ...tokens.color.tokens.map((t) => [t.name, t.value]),
  ...tokens.shadow.tokens.map((t) => [t.name, t.value]),
];

/** Single-valued families, emitted once under :root. */
const flat = [
  ...tokens.spacing.tokens,
  ...tokens.radius.tokens,
  ...tokens.opacity.tokens,
  ...tokens.zIndex.tokens,
  ...tokens.layout.tokens,
].map((t) => [t.name, t.value]);

const themeBlock = (mode, indent) =>
  themed.map(([name, value]) => decl(name, value[mode], indent)).join('\n');

/**
 * One class per type style. The class name is the style name, so `.label`,
 * `.body-sm`, `.metric` etc. match the markup in the component previews.
 * NB: `.metric` (this type style) and `.metric-tile` (a layout class in
 * bundle.css) are deliberately different things — see bundle.css.
 */
const typeClasses = tokens.type.groups
  .flatMap((group) =>
    group.styles.map((style) => {
      const lines = [
        `  font-family: var(--font-${group.family});`,
        `  font-size: ${style.fontSize};`,
        `  line-height: ${style.lineHeight};`,
        `  font-weight: ${style.fontWeight};`,
      ];
      if (style.letterSpacing) lines.push(`  letter-spacing: ${style.letterSpacing};`);
      if (style.fontStyle) lines.push(`  font-style: ${style.fontStyle};`);
      return `.${style.name} {\n${lines.join('\n')}\n}`;
    }),
  )
  .join('\n\n');

const fontFamilies = Object.entries(tokens.type.families)
  .map(([name, stack]) => decl(`font-${name}`, stack))
  .join('\n');

const css = `/* GENERATED FILE — DO NOT EDIT.
   Compiled from design-system/tokens.json by scripts/build-tokens.mjs.
   Run \`npm run build\` (or \`node scripts/build-tokens.mjs\`) to regenerate.
   Source: ${tokens.name} v${tokens.version} */

:root {
  color-scheme: light;

  /* Colour + shadow — light theme */
${themeBlock('light', '  ')}

  /* Type families */
${fontFamilies}

  /* Spacing, radius, opacity, z-index, layout */
${flat.map(([name, value]) => decl(name, value)).join('\n')}
}

/* Default: follow the OS. An explicit light choice on <html> still wins. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${themeBlock('dark', '    ')}
  }
}

/* Manual override from the theme toggle. */
:root[data-theme="dark"] {
  color-scheme: dark;
${themeBlock('dark', '  ')}
}

/* ---- Type styles: one class per style in tokens.json ---- */

${typeClasses}
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, css, 'utf8');

const count =
  themed.length + flat.length + Object.keys(tokens.type.families).length;
const styles = tokens.type.groups.reduce((n, g) => n + g.styles.length, 0);
console.log(
  `build-tokens: ${count} custom properties, ${styles} type classes -> src/styles/tokens.css`,
);
