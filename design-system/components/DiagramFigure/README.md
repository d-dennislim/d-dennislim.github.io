# DiagramFigure

An architecture diagram with its caption. Diagrams are your primary evidence artifact, so they get their own palette (`diagram-*` in tokens.json) rather than borrowing UI colours — a diagram drawn in UI colours reads as part of the interface instead of as content.

The consumer provides: the diagram itself (inline SVG preferred, so it retints per theme; a PNG otherwise), a caption naming what the reader should take from it, and alt text.

## The palette, and what carries meaning

- **Boundaries** — `diagram-boundary`, drawn with `.dg-boundary` (dashed) for logical boundaries like an account or region, `.dg-network` (solid) for network ones like a VPC.
- **Zones** — `.dg-zone-public` and `.dg-zone-private`. These differ by hue, not lightness, so a zone must *always* carry a text label and its own border style; fill alone is not a distinction anyone can rely on, and it disappears entirely for a colour-blind reader.
- **Nodes** — `.dg-node` for the component under discussion, `.dg-node-alt` for supporting components, `.dg-node-aws` for AWS-managed services. That third one is the useful distinction in an SA portfolio: it shows at a glance what you built versus what you delegated to AWS. Labels on nodes use `.dg-node-label`.
- **Flows** — `.dg-flow` solid for the synchronous request path, `.dg-flow-alt` dashed for async or secondary paths. Dash pattern carries the meaning; colour only reinforces it.
- **Annotation** — `.dg-annotation` marks the one thing the diagram is being shown to demonstrate: the bottleneck, the change, the failure mode.

## Rules

Do:
- Author inline SVG with these classes so the diagram follows the theme. A raster export needs two files, one per mode, and a `<picture>` element to switch them.
- Write alt text that states the conclusion, not the inventory: "Requests reach the service through an ALB in a public subnet; the database sits in a private subnet with no route to the internet" — not "diagram with five boxes".
- Keep one diagram to one idea. A before/after pair of two simple diagrams beats one diagram with annotations explaining both states.
- Label every boundary and zone with its real CIDR or name where it's safe to publish.

Don't:
- Don't publish a client's actual topology, account numbers, CIDR ranges, hostnames or ARNs without written clearance — generalise the shape and say you've done so.
- Don't use official AWS service icons as decoration in a personal portfolio without checking AWS's current asset terms; the `dg-node-aws` fill colour signals "AWS-managed" without shipping their trademarked icon set.
- Don't rely on hue alone anywhere — every distinction in these diagrams also has a shape, dash pattern or label.
