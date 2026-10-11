import type { ColorTheme } from '../types';

/** Matches the app's own default accent/surface tokens exactly (see
 *  tailwind.config.ts), so a campaign/institution/neshama nobody has themed
 *  looks identical to before this feature existed. */
export const DEFAULT_COLOR_THEME: ColorTheme = {
  background: '#FFFFFF',
  primary: '#1B3A6B',
  accent: '#2E5FA3',
};

/** Resolves a theme, filling in any missing color (and the whole object, for
 *  every page created before this field existed) with the app's own defaults. */
export function getColorTheme(theme: Partial<ColorTheme> | undefined): ColorTheme {
  return { ...DEFAULT_COLOR_THEME, ...theme };
}
