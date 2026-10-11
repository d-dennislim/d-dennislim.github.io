# Tag

A single tech/tool chip, `accent`-outlined. Always inside a `tag-row` (wraps with `space-2` gaps), always inside an `ExperienceItem` or `ProjectCard` — a tag with nothing to attach to isn't meaningful.

The consumer provides: the exact service/tool name, capitalized the way the vendor does.

Do:
- Keep the vocabulary consistent across the whole page (see ExperienceItem's note on this).

Don't:
- Don't use a tag for a soft skill ("Communication", "Leadership") — this token set marks technology, not traits.
- Don't fill a tag with `accent` — the border-and-text treatment is the whole point; a filled chip would compete with `btn-primary` for visual weight.
