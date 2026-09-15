import type { InstitutionType } from '../types';

/** Resolves the display text for an institution's type: its own free text when
 *  `type` is 'other' and one was given, otherwise the caller's translated
 *  fallback (`t('institution.' + type)`). */
export function institutionTypeText(
  type: InstitutionType,
  customType: string | undefined,
  translatedFallback: string,
): string {
  return type === 'other' && customType ? customType : translatedFallback;
}
