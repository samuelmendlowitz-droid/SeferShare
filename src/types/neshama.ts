import type { SeferType } from './common';

export type ParentGender = 'son' | 'daughter';

export interface Neshama {
  neshamaId: string;
  createdByUid: string;
  name: string;
  hebrewName?: string;
  /** בן / בת — needed to phrase the traditional "X ben/bat Y" dedication. */
  parentGender: ParentGender;
  /** Father's full Hebrew name — the "Y" in "X ben/bat Y". */
  fatherHebrewName: string;
  /** Sefer types people should be nudged to dedicate in this neshama's honor. */
  seferTypes?: SeferType[];
  /** Specific seforim (by seferId) people should be nudged to dedicate, in addition
   *  to (or instead of) whole sefer types. */
  seferIds?: string[];
  /** Last time this neshama was used as an algorithm-picked dedication (see
   *  functions/src/algorithm.ts) — the longest-waiting eligible neshama is picked
   *  first when a campaign has no neshama of its own. */
  lastDedicatedAt?: number;
  createdAt: number;
}
