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

export interface Project {
  title: string;
  description: string;
  tags: string[];
  links: Link[];
  /** Exactly one project may be featured (ProjectCard README). */
  featured?: boolean;
  /** Only on the featured card, e.g. "Featured" or "Latest". */
  eyebrow?: string;
}

export interface Profile {
  site: {
    title: string;
  };
  identity: {
    name: string;
    /** Two characters, for the console panel avatar. */
    initials: string;
    role: string;
    bio: string;
    /** The navbar's terminal-prompt mark. Short, keeps the `$`. */
    promptMark: string;
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
