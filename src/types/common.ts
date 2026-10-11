export type Language = 'en' | 'he' | 'both';

/** The three hex colors a Campaign/Institution/Neshama's creator can pick to
 *  personalize its own detail page — background (its info "bubbles"' own
 *  fill), primary (each bubble's main/headline text), and accent (bubble
 *  outlines, button backgrounds, and smaller supporting text). See
 *  lib/colorTheme.ts for the defaults every page created before this field
 *  existed falls back to. The page's own backdrop is deliberately NOT one of
 *  these — campaign/institution/neshama pages always sit on a plain white
 *  background, with only their content "bubbles" picking up the theme. */
export interface ColorTheme {
  background: string;
  primary: string;
  accent: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type SeferType =
  | 'chumash'
  | 'tanach'
  | 'mishnah'
  | 'gemara'
  | 'yerushalmi'
  | 'shulchanAruch'
  | 'halacha'
  | 'commentary'
  | 'mussar'
  | 'chassidus'
  | 'kabbalah'
  | 'machshava'
  | 'siddur'
  | 'machzor'
  | 'haggadah'
  | 'tehillim'
  | 'responsa'
  | 'biography'
  | 'childrens'
  | 'reference'
  | 'other';

export const SEFER_TYPES: SeferType[] = [
  'chumash',
  'tanach',
  'mishnah',
  'gemara',
  'yerushalmi',
  'shulchanAruch',
  'halacha',
  'commentary',
  'mussar',
  'chassidus',
  'kabbalah',
  'machshava',
  'siddur',
  'machzor',
  'haggadah',
  'tehillim',
  'responsa',
  'biography',
  'childrens',
  'reference',
  'other',
];

/** The language(s) a sefer's text is printed in — a sefer can be multilingual
 *  (e.g. a bilingual Hebrew/English edition, or Hebrew/Aramaic like a Gemara). */
export type SeferLanguage =
  | 'hebrew'
  | 'aramaic'
  | 'yiddish'
  | 'english'
  | 'french'
  | 'spanish'
  | 'russian'
  | 'other';

export const SEFER_LANGUAGES: SeferLanguage[] = [
  'hebrew',
  'aramaic',
  'yiddish',
  'english',
  'french',
  'spanish',
  'russian',
  'other',
];
