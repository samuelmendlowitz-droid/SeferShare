import type { Language } from '../types';

/** Formats a campaign's optional start/end (YYYY-MM-DD, like Neshama's dateOfBirth/
 *  dateOfDeath) into a display range for the card/detail page — undefined when
 *  neither is set. 'both' (the bilingual language setting) falls back to en-US,
 *  there being no single "both" date locale. */
export function formatCampaignDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  language: Language,
): string | undefined {
  if (!startDate && !endDate) return undefined;
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  return fmt(startDate ?? endDate!);
}
