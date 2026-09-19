import type { Profile } from '../types/profile';
import data from './profile.json';

/**
 * All copy on the site comes from here. Nothing is hard-coded in markup, so the
 * pre-publish check is a single grep for `[[FILL` across the build.
 */
export const profile: Profile = data as Profile;

export default profile;
