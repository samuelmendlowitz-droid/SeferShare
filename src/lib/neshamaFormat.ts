import type { Neshama, ParentGender } from '../types';

export function neshamaConnector(parentGender: ParentGender, hebrew: boolean): string {
  if (hebrew) return parentGender === 'son' ? 'בן' : 'בת';
  return parentGender === 'son' ? 'son of' : 'daughter of';
}

/** "Ploni son of Ploni" / "פלוני בן פלוני" — the full traditional dedication name. */
export function formatNeshamaDedication(
  neshama: Pick<Neshama, 'name' | 'hebrewName' | 'parentGender' | 'fatherHebrewName'>,
  hebrew: boolean,
): string {
  if (hebrew && neshama.hebrewName) {
    return `${neshama.hebrewName} ${neshamaConnector(neshama.parentGender, true)} ${neshama.fatherHebrewName}`;
  }
  return `${neshama.name} ${neshamaConnector(neshama.parentGender, false)} ${neshama.fatherHebrewName}`;
}

/** Single display line, appending the Hebrew form too when bilingual and available. */
export function neshamaDedicationLine(neshama: Neshama, showBilingual: boolean): string {
  const english = formatNeshamaDedication(neshama, false);
  if (showBilingual && neshama.hebrewName) {
    return `${english} · ${formatNeshamaDedication(neshama, true)}`;
  }
  return english;
}
