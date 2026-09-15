import type { Neshama, ParentGender } from '../types';
import { prefixText } from './neshamaPrefixes';

/** בן / בת — the traditional dedication connector only ever appears in the
 *  Hebrew form; the English form is just the person's plain name. */
export function neshamaConnector(parentGender: ParentGender): string {
  return parentGender === 'son' ? 'בן' : 'בת';
}

interface DedicationNameParts {
  name: string;
  hebrewName?: string;
  namePrefix?: string;
  customNamePrefix?: string;
  parentGender: ParentGender;
  fatherHebrewName: string;
}

/** English: "[Prefix] Name". Hebrew: "[Prefix] פלוני בן/בת פלוני" — the full
 *  traditional dedication name, only formable when a Hebrew name is on file. */
export function formatNeshamaDedication(neshama: DedicationNameParts, hebrew: boolean): string {
  const prefix = prefixText(neshama.namePrefix, neshama.customNamePrefix, hebrew);
  if (hebrew && neshama.hebrewName) {
    const line = `${neshama.hebrewName} ${neshamaConnector(neshama.parentGender)} ${neshama.fatherHebrewName}`;
    return prefix ? `${prefix} ${line}` : line;
  }
  return prefix ? `${prefix} ${neshama.name}` : neshama.name;
}

/** Single display line, appending the Hebrew form too when bilingual and available. */
export function neshamaDedicationLine(neshama: Neshama, showBilingual: boolean): string {
  const english = formatNeshamaDedication(neshama, false);
  if (showBilingual && neshama.hebrewName) {
    return `${english} · ${formatNeshamaDedication(neshama, true)}`;
  }
  return english;
}

/** Just "[Prefix] Name" (or "[Prefix] HebrewName") — no ben/bat phrase — for
 *  spots (like a printed sticker preview) that show a plain name, not the full
 *  traditional dedication line. Returns undefined when there's no name in that
 *  language at all (e.g. no hebrewName on file). */
export function prefixedName(
  neshama: Pick<Neshama, 'name' | 'hebrewName' | 'namePrefix' | 'customNamePrefix'>,
  hebrew: boolean,
): string | undefined {
  const base = hebrew ? neshama.hebrewName : neshama.name;
  if (!base) return undefined;
  const prefix = prefixText(neshama.namePrefix, neshama.customNamePrefix, hebrew);
  return prefix ? `${prefix} ${base}` : base;
}
