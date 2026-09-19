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

export interface Link {
  label: string;
  href: string;
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

export interface Certification {
  /** The short code shown in the badge, e.g. two lines of an exam code. */
  code: string;
  /** Full credential name — this is what a screen reader announces. */
  name: string;
}

export interface JacketCertification extends Certification {
  caption: string;
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
  hero: {
    links: Link[];
    metrics: Metric[];
  };
  sections: {
    experienceTitle: string;
    certificationsTitle: string;
    projectsTitle: string;
  };
  experience: ExperienceRole[];
  certifications: {
    items: Certification[];
    jacket: JacketCertification;
  };
  projects: Project[];
  contact: {
    heading: string;
    lead: string;
    /** The address shown as plain text, so it can be copied without a client. */
    emailLabel: string;
    emailHref: string;
    actions: Link[];
  };
  footer: {
    copyline: string;
    /** Echoes the Certifications joke. Cut it if that section is cut. */
    joke: string;
    links: Link[];
  };
}
