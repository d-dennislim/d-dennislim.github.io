import type {
  ActionRef,
  ChannelName,
  CopySegment,
  Link,
  Profile,
  ResolvedProject,
} from '../types/profile';
import data from './profile.json';

/**
 * All copy on the site comes from here. Nothing is hard-coded in markup, so the
 * pre-publish check is a single grep for `[[FILL` across the build.
 */
export const profile: Profile = data as Profile;

/** True while a field is still an unfilled placeholder. */
const unfilled = (value: string): boolean => value.startsWith('[[FILL');

/**
 * The href for a channel. `email` is stored as a bare address because Contact
 * shows it as copyable text as well as linking it, so the `mailto:` belongs
 * here rather than in the stored value — one field, both uses.
 *
 * An unfilled placeholder is passed through untouched: `mailto:[[FILL: ...]]`
 * would be neither a working link nor a readable placeholder.
 */
export const channelHref = (channel: ChannelName): string => {
  const value = profile.channels[channel];
  if (channel === 'email' && !unfilled(value)) return `mailto:${value}`;
  return value;
};

/**
 * Turn a placement's channel references into the links a component renders.
 *
 * A channel that is still a placeholder is marked `unavailable`, so the button
 * renders muted instead of pointing at a string. Deriving it here rather than
 * flagging it in profile.json means there is nothing to remember to remove: the
 * control goes live by itself the moment a real destination is filled in.
 */
export const resolveActions = (refs: ActionRef[]): Link[] =>
  refs.map((ref) => ({
    label: ref.label,
    href: channelHref(ref.channel),
    unavailable: unfilled(profile.channels[ref.channel]) || undefined,
  }));

/**
 * Split a copy string into text and redactions.
 *
 * The marker is `[[REDACTED: label]]`, deliberately shaped like the
 * `[[FILL: ...]]` placeholder it sits beside in the same file — but it means
 * the opposite thing. A `[[FILL` is unfinished and blocks the deploy
 * (brand-system.md §26). A `[[REDACTED` is *finished*: the value was never
 * written here and never will be, so the pre-publish grep must stay pinned to
 * `[[FILL` and must never be widened to `\[\[`.
 *
 * The label is what a screen reader announces ("client name withheld"), so it
 * names the kind of thing removed, never the thing itself.
 */
const REDACTION = /\[\[REDACTED:\s*([^\]]*)\]\]/g;

export const parseRedactions = (text: string): CopySegment[] => {
  const segments: CopySegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(REDACTION)) {
    const at = match.index ?? 0;
    if (at > cursor) segments.push({ text: text.slice(cursor, at) });
    segments.push({ redacted: match[1].trim() || 'redacted' });
    cursor = at + match[0].length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
};

/**
 * Fill in what a client project can't author for itself.
 *
 * Derived here rather than written into profile.json for the reason
 * `resolveActions` gives above: there is nothing to remember. Marking a
 * project `"provenance": "client"` is the whole edit — the confidentiality
 * note and the "ask me" route follow from it and can never drift out of step
 * with it, and a project that later gains a real public link simply carries
 * `links` and stops being given the stand-in.
 *
 * The route reuses `channelHref('email')`, so the address is still stored
 * exactly once, and `unfilled` keeps the control muted rather than pointing at
 * a placeholder — the same behaviour Button gives an unavailable action.
 */
export const resolveProjects = (): ResolvedProject[] =>
  profile.projects.map((project) => {
    const provenance = project.provenance ?? 'personal';
    const authored = project.links ?? [];

    if (provenance !== 'client') return { ...project, provenance, links: authored };

    const links: Link[] = authored.length
      ? authored
      : [
          {
            label: profile.sections.clientAskLabel,
            href: channelHref('email'),
            unavailable: unfilled(profile.channels.email) || undefined,
          },
        ];

    return { ...project, provenance, links, note: project.note ?? profile.sections.clientNote };
  });

/** The address as text, for the line in Contact that exists to be copied. */
export const emailAddress = profile.channels.email;

export default profile;
