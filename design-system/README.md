The design system behind a one-page AWS Solutions Architect / cloud engineer portfolio and its case-study pages. One identity in two modes — light is primary, dark is the same identity on a dark ground, not a second brand.

Everything here is built to be consumed by a coding agent as well as read by a person: tokens are in `tokens.json`, patterns are classes in `components/bundle.css`, and every component carries its own guidelines.

---

## The one rule that outranks the rest

Nothing on this site claims experience, credentials, clients, metrics or links that aren't real. Every number carries its basis and period somewhere on the page. Every certification shown is currently held. Every testimonial is a real person's actual words, published with permission at the level they agreed to. Every project link resolves.

The component previews in this system are seeded with placeholder content — `Your Name`, `Client name`, `project-name`, example certification codes, `you@yourdomain.com`. That's deliberate: placeholder text that looks obviously unfinished can't be shipped by accident, which plausible-looking filler can. Before publishing, search the build for those strings; if any survive, the page isn't ready.

## Content fundamentals

Write the About bio in first person, three sentences at most: what you are, the two or three things you're deepest in, and what you're open to. No adjective that needs proof — "passionate", "results-driven", "detail-oriented" — because the sections underneath are the proof, and an unbacked adjective at the top makes a reader discount them.

Experience bullets state the outcome before the mechanism. "Cut monthly compute spend 34% by right-sizing EC2 and moving batch jobs to Spot" reads; "Used EC2 and Spot pricing" doesn't. Cap each role at four bullets — beyond that it's a résumé dump, and the résumé is a separate download.

Project descriptions are one sentence on what the thing does and who for; the stack goes in `tag` chips, never repeated in prose. Case studies follow the fixed six-part order documented in `components/CaseStudy` — problem, role, architecture, decisions, outcome, technologies — because that order is the argument.

Tech tags use the vendor's own capitalisation (`CDK`, `Lambda`, `Terraform`, `EKS`) and the same spelling everywhere on the site, so a reader scanning tags across Experience and Projects sees one throughline rather than near-duplicates.

Certifications carry the page's only joke, once, in the Golden Jacket tile and a one-line echo in the footer. Drop both when the site is linked from a proposal or an SOW — the credential is the point in that context, and the joke is a peer-audience signal.

## Visual foundations

**Colour.** `surface` is the page, `surface-raised` is a card on it, `surface-sunken` is a full-width band behind cards. Those three are the whole elevation system; a card never sits on a parent of its own colour. `ink` is text, `ink-muted` is everything secondary. `border` is a decorative hairline and is deliberately too faint to carry meaning — anything a reader must perceive uses `border-strong` (which clears 3:1 in both modes) or `brand`. `brand` is the single identity colour and belongs to actionable things: the primary button, links, the active nav state, the focus ring, the timeline dots. `brand-hover` is its hover and active state — never a CSS `filter`, which clips channels and behaves differently per mode. `accent` marks emphasis that isn't actionable: section eyebrows, tag borders, the role line. `accent-aws` is rationed to certification badges and AWS-managed diagram nodes; if a third place uses it, the page starts implying AWS affiliation rather than AWS expertise. `success`, `warning`, `danger` and `info` always sit beside their own word, because they're separated by hue alone.

**Diagram colours** are a separate family (`diagram-*`) so a diagram reads as content rather than as part of the interface. The rules that matter: zone fills differ by hue and not lightness, so every zone also carries a label and its own border style; flows are separated by dash pattern first and colour second; `diagram-node-aws` exists to show at a glance what AWS runs versus what you built. Full guidance in `components/DiagramFigure`.

**Type.** One pairing: `sans` for anything read as prose, `mono` for anything read as data — eyebrows, tags, dates, metric figures, diagram labels. That split is the engineering signal; it does the work an icon set would otherwise do. `body-lg` and `quote` exist only on case-study and article pages, held to `measure-prose`. Don't add a third family for emphasis; use the weight and the sans/mono split.

**Spacing and radius.** Everything comes from `space-1` through `space-16` and the three radii. There is one deliberate exception in `bundle.css`: a 44px minimum height on buttons and nav links, which is the WCAG target-size floor rather than a design decision, and it's commented as such.

**Elevation.** Carried by surface colour first. `shadow-sm` is for the sticky nav; `shadow-md` appears on a card only while hovered. Nothing rests with a shadow.

**Layout.** Each section has one asymmetry that earns it: the nav is sticky with a `brand` rule under it; About is a two-up with a `console-panel` beside the bio; Experience is a rail with `brand` dots rather than boxed cards; Certifications is a hex shelf on a `surface-sunken` band; Projects is a bento with exactly one featured tile spanning the row. Content is held to `container`, case studies to `container-narrow`, long prose to `measure-prose`. Everything collapses to one column by 780px (hero) and 720px (grids).

**Motion.** Declared at the top of `bundle.css`, not in tokens: `--duration-fast` (120ms) for colour and border, `--duration-base` (200ms) for transform and shadow, one easing. Hover lifts a card 2px and nothing else moves on its own. The whole scale is disabled under `prefers-reduced-motion`.

## Iconography

No icon font is bundled. Glyphs are inline SVG paths sized to the type scale, stroked 1.5px, `ink-muted` at rest and `brand` on hover — outlined throughout, never mixed with filled.

The one distinct shape in the system is the certification hexagon, which matches the shape AWS's own Credly badges use. Don't ship AWS's actual badge artwork or service icon set from a personal site without checking their current asset terms; the hex outline and `accent-aws` fill carry the signal without redistributing their assets.

## Accessibility floor

WCAG 2.2 AA, verified rather than assumed: every text colour clears 4.5:1 on every surface it's documented against, in both modes, and every meaningful border and focus ring clears 3:1. Targets are 44px. Focus is a 2px `brand` ring at 2px offset and is never removed. The page has a skip link, one `main` landmark, and heading levels that descend without skipping. No information anywhere is carried by colour alone — status colours sit beside their word, diagram zones carry labels, diagram flows carry dash patterns.
