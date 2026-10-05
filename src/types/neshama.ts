import type { SeferType } from './common';

export type ParentGender = 'son' | 'daughter';

export interface Neshama {
  neshamaId: string;
  createdByUid: string;
  /** Common honorific shown before the name in a dedication (e.g. "Reb", "HaRav") —
   *  see src/lib/neshamaPrefixes.ts. The sentinel 'other' means "see customNamePrefix". */
  namePrefix?: string;
  /** Set when `namePrefix` is 'other' — free text for a prefix not in the list. */
  customNamePrefix?: string;
  name: string;
  hebrewName?: string;
  /** בן / בת — needed to phrase the traditional "X ben/bat Y" dedication. */
  parentGender: ParentGender;
  /** Father's full Hebrew name — the "Y" in "X ben/bat Y". */
  fatherHebrewName: string;
  imageUrl?: string;
  bio?: string;
  /** ISO date strings (YYYY-MM-DD) — kept as plain dates, not timestamps, since
   *  these describe a calendar day with no meaningful time-of-day component. */
  dateOfBirth?: string;
  dateOfDeath?: string;
  /** Sefer types people should be nudged to dedicate in this neshama's honor. */
  seferTypes?: SeferType[];
  /** Specific seforim (by seferId) people should be nudged to dedicate, in
   *  addition to (or instead of) whole sefer types — shown on the info page as
   *  this neshama's "Favorite Seforim". */
  seferIds?: string[];
  /** Flagged at creation so this neshama surfaces directly in Community >
   *  Rabbeim instead of needing to be searched for like an ordinary neshama
   *  (see CommunityPage.tsx). */
  isRabbi?: boolean;
  /** Rabbeim only — titles of seforim they authored, one per entry. Free text:
   *  an authored work isn't necessarily in the vendor catalog at all. */
  seferimWritten?: string[];
  /** Last time this neshama was used as an algorithm-picked dedication (see
   *  functions/src/algorithm.ts) — the longest-waiting eligible neshama is picked
   *  first when a campaign has no neshama of its own. */
  lastDedicatedAt?: number;
  createdAt: number;
}
