# Certifications

A shelf of hex badges — AWS's own Credly badges are hexagonal, so the shape is an authenticity nod rather than invented decoration. Regular certifications use `cert-badge` (outlined in `accent-aws`); the Golden Jacket uses `cert-badge-jacket`, which is filled rather than outlined and one size up, so it reads as the set's conclusion rather than another item in it.

**The codes in the preview are placeholders.** Replace them with the certifications actually held, and keep them current — an expired certification on display is the one detail an interviewer will check.

The consumer provides: each certification's code and its full name for the accessible label, plus the jacket tile and its caption.

## Accessibility

Every badge needs `role="img"` and an `aria-label` carrying the certification's full name. The visible text is an abbreviation — "SAP C02" read aloud is meaningless, "AWS Certified Solutions Architect – Professional" is the credential. The shelf is a `ul`; each badge is an `li`.

## Tone

This is where the page's personality budget is spent, and it's spent once. The jacket tile and its caption carry the joke; everything else on the page stays straight. The caption should be short and dry — the badge itself is already the punchline, so the caption shouldn't explain it.

There's a client-facing variant: when this page is linked from a proposal or an SOW, drop the caption and leave the jacket tile to speak for itself. The credential is the point in that context; the joke is a peer-audience signal.

Don't:
- Don't display a certification before it's awarded or after it's lapsed.
- Don't surround the jacket with trophy or medal glyphs — one wink, not a shelf of them.
- Don't reproduce AWS's actual badge artwork here; the hex shape and `accent-aws` fill signal the credential without redistributing their assets.
