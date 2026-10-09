import type { CampaignColorTheme } from '../types';

/** Matches the app's own default accent/surface tokens exactly (see
 *  tailwind.config.ts), so a campaign nobody has themed looks identical to
 *  before this feature existed. */
export const DEFAULT_CAMPAIGN_THEME: CampaignColorTheme = {
  background: '#FFFFFF',
  primary: '#1B3A6B',
  accent: '#2E5FA3',
};

/** Resolves a campaign's theme, filling in any missing color (and the whole
 *  object, for every campaign created before this field existed) with the
 *  app's own defaults. */
export function getCampaignTheme(theme: Partial<CampaignColorTheme> | undefined): CampaignColorTheme {
  return { ...DEFAULT_CAMPAIGN_THEME, ...theme };
}
