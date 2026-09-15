export type Language = 'en' | 'he' | 'both';

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
