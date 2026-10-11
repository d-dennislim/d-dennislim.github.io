# ProjectCard

One project in the Projects grid, now a bento layout: the first, most-impressive project takes `project-card featured` — it spans the full row and splits internally into a description pane and a tags/links pane. Every other project is an even `project-card` tile beneath it. Exactly one featured card per page; more than one and nothing reads as "the" featured project anymore.

The consumer provides: project name, one-line description, the tag list, whichever links actually exist, and (for the featured card only) an "eyebrow" like "Featured" or "Latest".

Do:
- Pick the featured project by what it proves, not what's newest — the one with the clearest outcome or the most relevant stack for the role you want.
- Let the tags carry technical detail; the description says what it does and for whom.

Don't:
- Don't feature more than one card, and don't feature a project with no working link.
- Don't use `project-card` for a role at a company — that's `ExperienceItem`.
