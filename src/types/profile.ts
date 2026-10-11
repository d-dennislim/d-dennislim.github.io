/**
 * The shape of src/content/profile.json.
 *
 * Every string typed here is copy, and at this stage every one of them is a
 * literal `[[FILL: ...]]` marker. CLAUDE.md hard rule 1: nothing on this site
 * claims experience, credentials, clients, metrics or links that aren't real,
 * and a placeholder that looks obviously unfinished can't be shipped by
 * accident the way plausible filler can.
 */

/** Status token names from tokens.json. Not copy — a token, not a claim. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info';

/** A resolved link, which is what every component takes. */
export interface Link {
  label: string;
  href: string;
  /**
   * Set when the link's destination doesn't exist yet — its channel is still an
   * unfilled placeholder. Rendered muted and non-navigable rather than as a
   * live link to nowhere. Derived in resolveActions, never authored.
   */
  unavailable?: boolean;
}

/**
 * The contact routes, each stored exactly once.
 *
 * Hero, ContactBlock and Footer all offer the same routes with different labels
 * ("Email me" in the hero, "Email" in the footer), so a placement names the
 * channel and supplies its own label rather than repeating the address or URL.
 * The design system requires these to agree — Footer's README calls its links
 * "identical in content to the Hero's" — and this makes that structural instead
 * of something to remember.
 */
export type ChannelName = 'email' | 'github' | 'linkedin' | 'resume';

/** `email` holds a bare address; the `mailto:` is added when it is resolved. */
export type Channels = Record<ChannelName, string>;

/** A placement's reference to a channel, with the label used at that spot. */
export interface ActionRef {
  channel: ChannelName;
  label: string;
}

export interface Metric {
  /** The figure itself. Needs a defensible basis — see MetricRow's README. */
  value: string;
  label: string;
  /** What the figure is measured against. Optional, but usually the point. */
  note?: string;
}

export interface Status {
  label: string;
  tone: StatusTone;
}

export interface ExperienceRole {
  role: string;
  company: string;
  /** Date range and location, e.g. the `exp-meta` line. */
  meta: string;
  /** Outcome first, mechanism second. Four at most (ExperienceItem README). */
  bullets: string[];
  tags: string[];
}

/**
 * AWS's own tier for an exam, in the order the shelf presents them.
 *
 * Not a claim about the holder, so hard rule 1 doesn't bite: the tier is an
 * attribute AWS publishes for each exam, and for nine of the twelve it is a
 * word in the credential's own name. AIF and CLF are the two AWS files under
 * Foundational.
 *
 * Authored rather than derived from the exam code. Deriving it would mean a
 * lookup table keyed on prefixes that AWS chose for other reasons — SAP and
 * SAA differ by one letter and sit two tiers apart — and that table would be
 * this data, only harder to read and further from the credential it describes.
 */
export type CertTier = 'professional' | 'specialty' | 'associate' | 'foundational';

export interface Certification {
  /** The short code shown in the badge, e.g. two lines of an exam code. */
  code: string;
  /** Full credential name — this is what a screen reader announces. */
  name: string;
  /**
   * Basename of the badge artwork in assets/badges, without extension.
   * Optional: a certification without art falls back to the drawn hexagon, so
   * badges can be added one at a time.
   */
  art?: string;
  /** Credly verification page. Optional; without it the badge isn't a link. */
  verifyUrl?: string;
}

/**
 * A certification on the shelf, which is grouped under its tier.
 *
 * `tier` lives here rather than on Certification so the jacket can't be given
 * one: it isn't an exam and sits below the shelf, not in a tier row.
 */
export interface ShelfCertification extends Certification {
  tier: CertTier;
}

export interface JacketCertification extends Certification {
  caption: string;
  /**
   * The jacket takes `art` like any other badge, but never a verification link:
   * it isn't an exam, so there is no Credly page behind it. Typed as `never`
   * rather than left merely unused, so adding one to profile.json fails the
   * build instead of silently rendering the jacket as a link to nowhere.
   */
  verifyUrl?: never;
}

/**
 * Where a project came from.
 *
 * `client` work has no public artifacts — no repo to open, no write-up to
 * read — so the card states why instead of leaving the reader to guess
 * between "under NDA" and "portfolio unfinished". Absent means `personal`.
 */
export type ProjectProvenance = 'client' | 'personal';

export interface Project {
  /**
   * Copy strings on a project may carry inline `[[REDACTED: label]]` markers,
   * which render as a bar. Unlike `[[FILL: ...]]`, a redaction is *finished*
   * copy: the client's name is absent from the source because it was never
   * written here, not because someone has yet to type it. See CLAUDE.md.
   */
  title: string;
  /**
   * The generalised sector/period line under the title, e.g. the industry and
   * the year. brand-system.md §7 and §26: generalised is honest, fabricated is
   * not. Optional — omit the field rather than carry an empty one.
   */
  meta?: string;
  description: string;
  tags: string[];
  /**
   * Optional: a client engagement has no repo and no write-up. Left off, a
   * client project is given the "ask me" route by resolveProjects instead.
   */
  links?: Link[];
  /** Absent means `personal`. */
  provenance?: ProjectProvenance;
  /**
   * Why this particular engagement isn't public, when the reason is worth
   * stating more precisely than the default in `sections.clientNote`.
   */
  note?: string;
  /** Exactly one project may be featured (ProjectCard README). */
  featured?: boolean;
  /** Only on the featured card, e.g. "Featured" or "Latest". */
  eyebrow?: string;
}

/**
 * One run of a copy string that may contain `[[REDACTED: label]]` markers.
 *
 * A redaction appears *mid-string* — "[[REDACTED: client]] — centralised
 * networking" — so a component that rendered a bar on its own couldn't
 * compose. `parseRedactions` turns the string into these segments and
 * RedactedText walks them in order.
 *
 * The label is what a screen reader announces. It is never the redacted value:
 * "client name" is the label, the client's actual name is nowhere in this
 * codebase.
 */
export type CopySegment = { text: string } | { redacted: string };

/**
 * A project as a component receives it, after resolveProjects.
 *
 * `provenance` and `links` stop being optional here: the default and the
 * stand-in route are decided once, in the resolver, so no component has to
 * carry a fallback and none can disagree with another about what a client
 * project without links should offer.
 */
export interface ResolvedProject extends Omit<Project, 'links' | 'provenance'> {
  provenance: ProjectProvenance;
  links: Link[];
}

export interface Profile {
  site: {
    title: string;
    /**
     * The site's meta description (brand-system.md §22): the §2 value
     * proposition, 150-160 characters, one per page and never duplicated.
     *
     * Still a `[[FILL` marker, and rendered into the head as one on purpose.
     * §2's value proposition is itself unwritten, `identity.bio` is hero copy
     * and too short, and hard rule 1 forbids inventing the sentence. Emitting
     * the marker puts it in `dist/`, where §26's pre-publish grep finds it and
     * blocks the deploy until it is written — the same gate the case-study
     * copy goes through, working as designed.
     */
    description: string;
    /**
     * The one origin every absolute URL on the site is built from — canonical,
     * `og:url`, `sitemap.xml` and the `Sitemap:` line in `robots.txt`. Scheme
     * and host, no trailing slash, one host only (§22: "pick `https://` and
     * one host ... and 301 everything else to it").
     *
     * Empty until the domain exists, and empty is a working state, not a
     * broken one: every absolute-URL feature is omitted rather than guessed,
     * because a canonical pointing at a host you don't own is worse than no
     * canonical at all. Filling this one string switches all four on.
     */
    origin: string;
  };
  identity: {
    name: string;
    /** Two characters, for the console panel avatar. */
    initials: string;
    role: string;
    bio: string;
    /** The navbar's terminal-prompt mark. Short, keeps the `$`. */
    promptMark: string;
    /**
     * Commands the navbar prompt cycles after the `$` — typed, held, erased,
     * next. The first is what a no-JS or reduced-motion visitor sees, standing
     * still. Max 32 characters each, past which the bar clips them on most
     * screens.
     */
    promptCommands: string[];
    status: Status;
  };
  channels: Channels;
  hero: {
    actions: ActionRef[];
    metrics: Metric[];
  };
  sections: {
    experienceTitle: string;
    certificationsTitle: string;
    projectsTitle: string;
    /**
     * The default line a client project shows where its links would be. Copy,
     * so it lives here rather than in markup like every other string on the
     * page; a project that needs a different reason overrides it with `note`.
     */
    clientNote: string;
    /**
     * The label on the route a client project offers instead of a repo link.
     * Copy, for the same reason as `clientNote` — and the destination is the
     * stored `email` channel, so the address itself is still held once.
     */
    clientAskLabel: string;
  };
  experience: ExperienceRole[];
  certifications: {
    items: ShelfCertification[];
    jacket: JacketCertification;
  };
  projects: Project[];
  contact: {
    heading: string;
    lead: string;
    actions: ActionRef[];
  };
  footer: {
    copyline: string;
    /** Echoes the Certifications joke. Cut it if that section is cut. */
    joke: string;
    links: ActionRef[];
  };
}
