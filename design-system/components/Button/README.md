# Button

Two variants only. `btn-primary` is `brand`-filled — use it once per view for the single most-wanted action (usually "Email me" in the hero). `btn-secondary` is outline-on-`border` — everything else: GitHub, LinkedIn, résumé download, a project's secondary link when it needs button weight instead of a plain text link.

The consumer provides: the label (a verb or destination, e.g. "Email me", "Download résumé") and the href.

Do:
- Use `btn-secondary` for every non-primary action in the same view; don't mix in a third visual treatment.
- Keep labels to 1–3 words.

Don't:
- Don't use two `btn-primary`s in the same view — if two actions feel equally important, they aren't; pick one.
