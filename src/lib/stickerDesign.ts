import type {
  ParentGender,
  StickerColorSet,
  StickerDedicationNameStyle,
  StickerDesign,
  StickerDividerValue,
  StickerElementKey,
  StickerFlourishValue,
  StickerFontValue,
  StickerFrameValue,
} from '../types';

export type {
  StickerColorSet,
  StickerDedicationNameStyle,
  StickerDesign,
  StickerElementKey,
  StickerFontValue,
} from '../types';

export const STICKER_TEXT_ELEMENTS: StickerElementKey[] = ['label', 'dedication', 'donor', 'donatedTo'];

export interface StickerLayoutOption {
  value: string;
  en: string;
  he: string;
  order: StickerElementKey[];
}

export const STICKER_LAYOUTS: StickerLayoutOption[] = [
  { value: 'classic', en: 'Classic', he: 'קלאסי', order: ['label', 'dedication', 'donor'] },
  { value: 'nameFirst', en: 'Name First', he: 'השם תחילה', order: ['dedication', 'label', 'donor'] },
  { value: 'donorFirst', en: 'Donor First', he: 'התורם תחילה', order: ['donor', 'label', 'dedication'] },
  { value: 'nameOnly', en: 'Name Only', he: 'שם בלבד', order: ['dedication'] },
  {
    value: 'withDestination',
    en: 'With Donation Location',
    he: 'עם מקום התרומה',
    order: ['label', 'dedication', 'donatedTo', 'donor'],
  },
];

export const STICKER_FRAMES: { value: StickerFrameValue; en: string; he: string }[] = [
  { value: 'none', en: 'None', he: 'ללא' },
  { value: 'thin', en: 'Thin', he: 'דק' },
  { value: 'double', en: 'Double', he: 'כפול' },
  { value: 'dashed', en: 'Dashed', he: 'מקווקו' },
  { value: 'dotted', en: 'Dotted', he: 'מנוקד' },
  { value: 'rounded', en: 'Rounded', he: 'מעוגל' },
  { value: 'ornate', en: 'Ornate', he: 'מעוטר' },
];

export const STICKER_DIVIDERS: { value: StickerDividerValue; en: string; he: string }[] = [
  { value: 'none', en: 'None', he: 'ללא' },
  { value: 'line', en: 'Line', he: 'קו' },
  { value: 'doubleLine', en: 'Double Line', he: 'קו כפול' },
  { value: 'dots', en: 'Dots', he: 'נקודות' },
  { value: 'starLine', en: 'Star Line', he: 'קו עם כוכב' },
  { value: 'diamondLine', en: 'Diamond Line', he: 'קו עם יהלום' },
];

export const STICKER_FLOURISHES: { value: StickerFlourishValue; en: string; he: string }[] = [
  { value: 'none', en: 'None', he: 'ללא' },
  { value: 'star', en: 'Star of David', he: 'מגן דוד' },
  { value: 'leaf', en: 'Floral', he: 'פרחוני' },
  { value: 'menorah', en: 'Menorah', he: 'מנורה' },
  { value: 'pomegranate', en: 'Pomegranate', he: 'רימון' },
  { value: 'crown', en: 'Crown', he: 'כתר' },
];

export const STICKER_FONTS: { value: StickerFontValue; en: string; he: string; stack: string }[] = [
  { value: 'sans', en: 'Modern', he: 'מודרני', stack: "'Inter', 'Heebo', sans-serif" },
  { value: 'serif', en: 'Classic Serif', he: 'סריף קלאסי', stack: "'Playfair Display', 'Frank Ruhl Libre', serif" },
  { value: 'script', en: 'Script', he: 'סקריפט', stack: "'Dancing Script', 'Suez One', cursive" },
];

export interface StickerDedicationPhraseOption {
  value: string;
  en: string;
  he: string;
}

/** The phrase shown before the dedication name — the traditional Hebrew formula,
 *  or an English alternative. */
export const STICKER_DEDICATION_PHRASES: StickerDedicationPhraseOption[] = [
  { value: 'liluyNishmat', en: "L'iluy Nishmat", he: 'לעילוי נשמת' },
  { value: 'inMemoryOf', en: 'In Memory of', he: 'לזכר' },
  { value: 'inLovingMemoryOf', en: 'In Loving Memory of', he: 'לזכרו האהוב של' },
  { value: 'inDedicationTo', en: 'In Dedication to', he: 'לזכות' },
  { value: 'inHonorOf', en: 'In Honor of', he: 'לכבוד' },
  { value: 'dedicatedBy', en: 'Dedicated by', he: 'הוקדש על ידי' },
];

export interface StickerDedicationNameStyleOption {
  value: StickerDedicationNameStyle;
  en: string;
  he: string;
}

/** How the dedication element's name text is composed — see
 *  StickerDedicationNameStyle / resolveDedicationName. */
export const STICKER_DEDICATION_NAME_STYLES: StickerDedicationNameStyleOption[] = [
  { value: 'default', en: 'Name', he: 'שם' },
  { value: 'full', en: "Name, son/daughter of father's name", he: 'שם, בן/בת שם האב' },
  { value: 'hebrewOnly', en: 'Hebrew name only', he: 'שם עברי בלבד' },
  { value: 'fatherOnly', en: "Father's name only", he: 'שם האב בלבד' },
];

/** A common book/sefer cover proportion (width:height) — the preview and every
 *  printed placement keep this ratio and scale to fit whatever slot they're in. */
export const STICKER_ASPECT_RATIO = '2 / 3';

const DEFAULT_STICKER_COLORS: StickerColorSet = {
  background: '#FFFFFF',
  frame: '#1B3A6B',
  divider: '#1B3A6B',
  flourish: '#1B3A6B',
  label: '#6B7C93',
  dedication: '#0D1B2A',
  donor: '#6B7C93',
  donatedTo: '#6B7C93',
};

export const DEFAULT_STICKER_DESIGN: StickerDesign = {
  layout: 'classic',
  frame: 'thin',
  divider: 'line',
  flourish: 'none',
  dedicationPhrase: 'liluyNishmat',
  dedicationNameStyle: 'default',
  fonts: { label: 'serif', dedication: 'serif', donor: 'serif', donatedTo: 'serif' },
  colors: DEFAULT_STICKER_COLORS,
};

export function findStickerLayout(value: string): StickerLayoutOption {
  return STICKER_LAYOUTS.find((l) => l.value === value) ?? STICKER_LAYOUTS[0];
}

export function stickerFontStack(value: StickerFontValue): string {
  return STICKER_FONTS.find((f) => f.value === value)?.stack ?? STICKER_FONTS[0].stack;
}

export function findDedicationPhrase(value: string): StickerDedicationPhraseOption {
  return STICKER_DEDICATION_PHRASES.find((p) => p.value === value) ?? STICKER_DEDICATION_PHRASES[0];
}

export function findDedicationNameStyle(value: string): StickerDedicationNameStyleOption {
  return STICKER_DEDICATION_NAME_STYLES.find((s) => s.value === value) ?? STICKER_DEDICATION_NAME_STYLES[0];
}

export interface DedicationNameParts {
  name?: string;
  hebrewName?: string;
  fatherHebrewName?: string;
  parentGender?: ParentGender;
}

/** Composes the dedication name text per the design's chosen name style: the
 *  plain name (default), the full traditional "name, son/daughter of father's
 *  [Hebrew] name" phrasing, the Hebrew name alone, or the father's name alone.
 *  Falls back to the plain name whenever a father's name isn't on file for the
 *  'full' style, since there's nothing to build the phrase from. */
export function resolveDedicationName(
  parts: DedicationNameParts,
  style: StickerDedicationNameStyle,
): { en?: string; he?: string } {
  const { name, hebrewName, fatherHebrewName, parentGender } = parts;
  if (style === 'hebrewOnly') return { he: hebrewName };
  if (style === 'fatherOnly') return { he: fatherHebrewName };
  if (style === 'full' && fatherHebrewName) {
    const enConnector = parentGender === 'daughter' ? 'daughter of' : 'son of';
    const heConnector = parentGender === 'daughter' ? 'בת' : 'בן';
    return {
      en: name ? `${name} ${enConnector} ${fatherHebrewName}` : undefined,
      he: hebrewName ? `${hebrewName} ${heConnector} ${fatherHebrewName}` : undefined,
    };
  }
  return { en: name, he: hebrewName };
}

/** Fills in any field missing from a saved/loaded design with the default —
 *  a design saved under an older shape of StickerDesign (e.g. before per-element
 *  fonts or the dedication phrase existed) would otherwise crash the editor and
 *  preview by lacking fields they now read unconditionally. Safe to call on any
 *  value, including `undefined`/`null` or a fully old-shaped object. */
export function normalizeStickerDesign(input: Partial<StickerDesign> | null | undefined): StickerDesign {
  if (!input) return DEFAULT_STICKER_DESIGN;
  return {
    layout: input.layout ?? DEFAULT_STICKER_DESIGN.layout,
    frame: input.frame ?? DEFAULT_STICKER_DESIGN.frame,
    divider: input.divider ?? DEFAULT_STICKER_DESIGN.divider,
    flourish: input.flourish ?? DEFAULT_STICKER_DESIGN.flourish,
    dedicationPhrase: input.dedicationPhrase ?? DEFAULT_STICKER_DESIGN.dedicationPhrase,
    dedicationNameStyle: input.dedicationNameStyle ?? DEFAULT_STICKER_DESIGN.dedicationNameStyle,
    fonts: { ...DEFAULT_STICKER_DESIGN.fonts, ...input.fonts },
    colors: { ...DEFAULT_STICKER_DESIGN.colors, ...input.colors },
  };
}

/** Picks "Name (1)", "Name (2)", etc. for a "save as copy" — stripping any
 *  existing " (n)" suffix first so copying a copy counts up cleanly instead of
 *  compounding ("Name (1) (1)"), then finds the lowest number not already used
 *  by one of the designer's other saved designs. */
export function nextCopyName(name: string, existingNames: string[]): string {
  const base = name.replace(/\s*\(\d+\)$/, '').trim() || name;
  const taken = new Set(existingNames);
  let n = 1;
  while (taken.has(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}
