import type { CampaignColorTheme } from '../types';

export interface CampaignColorThemeOption {
  value: CampaignColorTheme;
  hex: string;
  en: string;
  he: string;
}

/** Preset accent colors a campaign's creator can pick from (CampaignCreateForm /
 *  CampaignEditForm) — applied to its card/detail page (progress bar, headline
 *  numbers, a colored edge) via getCampaignThemeHex. 'accent' reuses the app's
 *  own default blue exactly, so an unthemed campaign looks identical to today. */
export const CAMPAIGN_COLOR_THEMES: CampaignColorThemeOption[] = [
  { value: 'accent', hex: '#1B3A6B', en: 'Classic Blue', he: 'כחול קלאסי' },
  { value: 'maroon', hex: '#7A2E3B', en: 'Maroon', he: 'בורדו' },
  { value: 'forest', hex: '#2A6B4A', en: 'Forest Green', he: 'ירוק יער' },
  { value: 'gold', hex: '#B8860B', en: 'Gold', he: 'זהב' },
  { value: 'purple', hex: '#5B3A8E', en: 'Purple', he: 'סגול' },
  { value: 'teal', hex: '#1F7A7A', en: 'Teal', he: 'טורקיז' },
  { value: 'rose', hex: '#B5536E', en: 'Rose', he: 'ורוד עתיק' },
];

const THEMES_BY_VALUE = new Map(CAMPAIGN_COLOR_THEMES.map((t) => [t.value, t]));

/** Resolves a campaign's theme to its hex color — missing/unknown values (every
 *  campaign created before this field existed) fall back to 'accent'. */
export function getCampaignThemeHex(theme: CampaignColorTheme | undefined): string {
  return THEMES_BY_VALUE.get(theme ?? 'accent')?.hex ?? THEMES_BY_VALUE.get('accent')!.hex;
}
