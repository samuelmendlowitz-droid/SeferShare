import type {
  StickerColorSet,
  StickerDesign,
  StickerDividerValue,
  StickerElementKey,
  StickerFlourishValue,
  StickerFontValue,
  StickerFrameValue,
} from '../types';

export type { StickerColorSet, StickerDesign, StickerElementKey } from '../types';

export interface StickerLayoutOption {
  value: string;
  en: string;
  he: string;
  order: StickerElementKey[];
}

export const STICKER_LAYOUTS: StickerLayoutOption[] = [
  { value: 'classic', en: 'Classic', he: 'קלאסי', order: ['label', 'dedication', 'message', 'donor'] },
  { value: 'nameFirst', en: 'Name First', he: 'השם תחילה', order: ['dedication', 'label', 'message', 'donor'] },
  { value: 'donorFirst', en: 'Donor First', he: 'התורם תחילה', order: ['donor', 'label', 'dedication', 'message'] },
  { value: 'messageTop', en: 'Message Top', he: 'הודעה למעלה', order: ['message', 'dedication', 'label', 'donor'] },
];

export const STICKER_FRAMES: { value: StickerFrameValue; en: string; he: string }[] = [
  { value: 'none', en: 'None', he: 'ללא' },
  { value: 'thin', en: 'Thin', he: 'דק' },
  { value: 'double', en: 'Double', he: 'כפול' },
  { value: 'ornate', en: 'Ornate', he: 'מעוטר' },
];

export const STICKER_DIVIDERS: { value: StickerDividerValue; en: string; he: string }[] = [
  { value: 'none', en: 'None', he: 'ללא' },
  { value: 'line', en: 'Line', he: 'קו' },
  { value: 'dots', en: 'Dots', he: 'נקודות' },
  { value: 'starLine', en: 'Star Line', he: 'קו עם כוכב' },
];

export const STICKER_FLOURISHES: { value: StickerFlourishValue; en: string; he: string }[] = [
  { value: 'none', en: 'None', he: 'ללא' },
  { value: 'star', en: 'Star of David', he: 'מגן דוד' },
  { value: 'leaf', en: 'Floral', he: 'פרחוני' },
  { value: 'menorah', en: 'Menorah', he: 'מנורה' },
];

export const STICKER_FONTS: { value: StickerFontValue; en: string; he: string; stack: string }[] = [
  { value: 'sans', en: 'Modern', he: 'מודרני', stack: "'Inter', 'Heebo', sans-serif" },
  { value: 'serif', en: 'Classic Serif', he: 'סריף קלאסי', stack: "'Playfair Display', 'Frank Ruhl Libre', serif" },
  { value: 'script', en: 'Script', he: 'סקריפט', stack: "'Dancing Script', 'Suez One', cursive" },
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
  message: '#6B7C93',
  donor: '#6B7C93',
};

export const DEFAULT_STICKER_DESIGN: StickerDesign = {
  layout: 'classic',
  frame: 'thin',
  divider: 'line',
  flourish: 'none',
  font: 'serif',
  colors: DEFAULT_STICKER_COLORS,
};

export function findStickerLayout(value: string): StickerLayoutOption {
  return STICKER_LAYOUTS.find((l) => l.value === value) ?? STICKER_LAYOUTS[0];
}

export function stickerFontStack(value: StickerFontValue): string {
  return STICKER_FONTS.find((f) => f.value === value)?.stack ?? STICKER_FONTS[0].stack;
}
