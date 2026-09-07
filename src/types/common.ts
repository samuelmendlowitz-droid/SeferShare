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
  | 'gemara'
  | 'siddur'
  | 'tehillim'
  | 'mishnah'
  | 'halacha'
  | 'machzor'
  | 'haggadah'
  | 'other';

export const SEFER_TYPES: SeferType[] = [
  'chumash',
  'gemara',
  'siddur',
  'tehillim',
  'mishnah',
  'halacha',
  'machzor',
  'haggadah',
  'other',
];
