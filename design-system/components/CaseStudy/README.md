# CaseStudy

The page template behind a Projects entry: problem, role, architecture, decisions, outcome, technologies — in that order, every time. The order is the argument. A reader who stops after the first two sections should already know what was wrong and what you were responsible for.

The consumer provides: title, meta line (your role, the timeframe, the client described at whatever level is cleared), and the six sections.

## The six sections

- **Problem** — what was actually wrong, in business terms before technical ones. "The monthly bill grew 60% over two quarters while traffic was flat" is a problem; "they were using on-demand EC2" is a cause.
- **My role** — what you personally did, and what you didn't. Naming the team's contribution makes your own claim more credible, not less. If you were one of six, say so.
- **Architecture** — a `DiagramFigure`, plus a paragraph. Before-and-after as two diagrams where the change is structural.
- **Key decisions** — two to four `case-decision` cards, each a decision, the alternative you rejected, and why. This is the section engineering interviewers actually read; it's where judgment shows and where a generic portfolio has nothing to say.
- **Outcome** — a `MetricRow` plus a sentence naming the measurement basis and the period. State what didn't improve too, if something didn't.
- **Technologies** — a `tag-row`, no prose.

Do:
- Hold prose to `measure-prose` width in `body-lg`; this is the only page type in the system that uses long-form type.
- Generalise anything a client hasn't cleared — the shape of a topology is publishable in a way that their CIDRs and account IDs are not — and say in the meta line that details are generalised.
- Keep one case study to one problem. Two problems is two case studies.

Don't:
- Don't write a case study for work you can't discuss at all; a project tile with no link is better than a vague page.
- Don't claim an outcome without its basis and period — an unqualified number invites the one question you don't want to fumble.
