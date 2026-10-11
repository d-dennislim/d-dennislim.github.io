/**
 * The structured data for the home page.
 *
 * doc/brand-system.md §22: "JSON-LD `Person` on the home page with `name`,
 * `jobTitle`, `url`, `sameAs` (LinkedIn, GitHub), and `hasCredential` entries
 * for certifications."
 *
 * Every value is derived from src/content/profile.json, never authored here.
 * That is the same rule the rest of the site follows — the address, the role
 * and the twelve credentials are each stored exactly once — and it matters
 * more in a graph than in markup: a `hasCredential` list that drifts from the
 * shelf beside it is a machine-readable claim the page itself contradicts,
 * and hard rule 1 puts credentials in the "never invent" list.
 *
 * `Article` for case studies (also §22) is not here, because the
 * `/case-studies/<slug>` route is not built yet. It belongs beside that route
 * when it lands, not as an empty branch waiting for it.
 */
import { profile, absoluteUrl } from './profile';
import type { Certification } from '../types/profile';

/** Matches what `channelHref`/`resolveActions` treat as "not a destination". */
const unfilled = (value: string): boolean => value.startsWith('[[FILL');

/**
 * One exam credential, in schema.org's vocabulary.
 *
 * `url` is the Credly verification page, which every one of the twelve exams
 * has. It is written as optional anyway because `verifyUrl` is optional on the
 * type — a credential without one is a badge the page doesn't link either, and
 * the graph must not imply a verification route that doesn't exist.
 */
const credential = (cert: Certification): Record<string, unknown> => {
  const entry: Record<string, unknown> = {
    '@type': 'EducationalOccupationalCredential',
    name: cert.name,
    credentialCategory: 'certificate',
    recognizedBy: { '@type': 'Organization', name: 'Amazon Web Services' },
  };
  if (cert.verifyUrl) entry.url = cert.verifyUrl;
  return entry;
};

/**
 * The `Person` graph, or `null` while there is no origin.
 *
 * `null` because `url` is a required field in §22's list and the only honest
 * value for it is absolute. A Person graph with no `url` doesn't identify
 * anyone — it is a bag of claims with nothing to attach them to, which is
 * worse for a search engine than no graph at all — and a guessed host is the
 * fake URL astro.config.mjs refuses. So the whole block waits on `site.origin`
 * along with the canonical and `og:url`.
 */
export const personJsonLd = (): string | null => {
  const url = absoluteUrl('/');
  if (!url) return null;

  /* LinkedIn and GitHub, in §22's own order. A channel still holding a
     placeholder is dropped rather than emitted, the same way resolveActions
     mutes a control rather than linking to a string. `resume` is not here: it
     currently points at the LinkedIn profile already listed, and sameAs is a
     set of distinct profiles, not of routes. */
  const sameAs = [profile.channels.linkedin, profile.channels.github].filter(
    (value) => value.length > 0 && !unfilled(value),
  );

  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.identity.name,
    jobTitle: profile.identity.role,
    description: profile.identity.bio,
    url,
    hasCredential: profile.certifications.items.map(credential),
    /* The Golden Jacket is an `award`, not a `hasCredential`.
       schema.org has both, and the distinction is the same one the rest of the
       codebase already makes: the jacket is a physical award for holding every
       active certification, not an exam, which is why it is typed
       `verifyUrl?: never` and why it sits below the shelf rather than in a
       tier. Filing it under credentials would state in machine-readable form
       that there is a thirteenth exam. */
    award: profile.certifications.jacket.name,
  };
  if (sameAs.length) person.sameAs = sameAs;

  /* `</script>` inside a JSON string would close the block that carries it.
     The value can only come from profile.json, but the escape costs nothing
     and the failure it prevents is a broken document, not a broken tag. */
  return JSON.stringify(person).replace(/</g, '\\u003c');
};
