import type { Language } from '../types';

/** Formats a campaign's optional start/end (YYYY-MM-DD, like Neshama's dateOfBirth/
 *  dateOfDeath) into a display range for the card/detail page — undefined when
 *  neither is set and there's no end date to anchor to `createdAt` either.
 *  'both' (the bilingual language setting) falls back to en-US, there being no
 *  single "both" date locale.
 *
 *  An end date with no start date shows as a range anchored to the campaign's
 *  creation date, rather than as a single, ambiguous-looking date — a start
 *  date with no end date just shows that one date (open-ended, no implied
 *  deadline). */
export function formatCampaignDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  createdAt: number,
  language: Language,
): string | undefined {
  if (!startDate && !endDate) return undefined;
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const dateFormat = { month: 'short', day: 'numeric', year: 'numeric' } as const;
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(locale, dateFormat);
  const fmtTimestamp = (ms: number) => new Date(ms).toLocaleDateString(locale, dateFormat);

  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (endDate) return `${fmtTimestamp(createdAt)} – ${fmt(endDate)}`;
  return fmt(startDate!);
}
