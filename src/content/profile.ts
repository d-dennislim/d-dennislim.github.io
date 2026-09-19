import type { ActionRef, ChannelName, Link, Profile } from '../types/profile';
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

/** The address as text, for the line in Contact that exists to be copied. */
export const emailAddress = profile.channels.email;

export default profile;
