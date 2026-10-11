# ExperienceItem

One role in the Experience list. The list itself (`exp-list`) now draws a rail — a `border`-colored vertical line with a `brand` dot beside each role — so the section reads as a timeline at a glance instead of a stack of identical cards. Company + role on top, dates/location as meta, then 3–4 outcome-first bullets, then the tech stack as tags.

The consumer provides: company name, role title, a date range (and location, optional), the bullets, and the tag list for that role.

Do:
- Lead each bullet with the result, then the mechanism ("Reduced deploy time from 40min to 6min by moving CI to CodeBuild with layer caching").
- Reuse the same tag vocabulary across roles and projects.
- Keep the newest role first — the rail reads top-to-bottom as "most recent first."

Don't:
- Don't put more than 4 bullets on a role.
- Don't restate the company name inside the bullets; it's already the row's header.
- Don't add a card border/background per role anymore — the rail is the only structure; a boxed card on top of it duplicates the cue.
