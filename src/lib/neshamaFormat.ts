import type { Neshama, ParentGender } from '../types';

/** בן / בת — the traditional dedication connector only ever appears in the
 *  Hebrew form; the English form is just the person's plain name. */
export function neshamaConnector(parentGender: ParentGender): string {
  return parentGender === 'son' ? 'בן' : 'בת';
}

/** English: just the name. Hebrew: "פלוני בן/בת פלוני" — the full traditional
 *  dedication name, only formable when a Hebrew name is on file. */
export function formatNeshamaDedication(
  neshama: Pick<Neshama, 'name' | 'hebrewName' | 'parentGender' | 'fatherHebrewName'>,
  hebrew: boolean,
): string {
  if (hebrew && neshama.hebrewName) {
    return `${neshama.hebrewName} ${neshamaConnector(neshama.parentGender)} ${neshama.fatherHebrewName}`;
  }
  return neshama.name;
}

/** Single display line, appending the Hebrew form too when bilingual and available. */
export function neshamaDedicationLine(neshama: Neshama, showBilingual: boolean): string {
  const english = formatNeshamaDedication(neshama, false);
  if (showBilingual && neshama.hebrewName) {
    return `${english} · ${formatNeshamaDedication(neshama, true)}`;
  }
  return english;
}
