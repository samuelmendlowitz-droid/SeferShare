/** A common Jewish honorific prefixed before a neshama's name in a dedication
 *  (e.g. "Reb Yosef ben Moshe", "HaRav Yosef ben Moshe"). Purely a display
 *  convention — stored as a sentinel value on the Neshama, resolved to actual
 *  text (English/Hebrew) here, with 'other' falling back to free text. */
export interface NeshamaPrefixOption {
  value: string;
  en: string;
  he: string;
}

export const OTHER_PREFIX_VALUE = 'other';

export const NESHAMA_PREFIXES: NeshamaPrefixOption[] = [
  { value: 'reb', en: 'Reb', he: 'ר\'' },
  { value: 'mr', en: 'Mr.', he: 'מר' },
  { value: 'mrs', en: 'Mrs.', he: 'גברת' },
  { value: 'harav', en: 'HaRav', he: 'הרב' },
  { value: 'haravHagaon', en: 'HaRav HaGaon', he: 'הרב הגאון' },
  { value: 'moreinuHarav', en: 'Moreinu HaRav', he: 'מורנו הרב' },
  { value: 'rebbe', en: 'Rebbe', he: 'רבי' },
  { value: 'admor', en: 'Admor', he: 'אדמו"ר' },
  { value: 'rebbetzin', en: 'Rebbetzin', he: 'רבנית' },
  { value: OTHER_PREFIX_VALUE, en: 'Other', he: 'אחר' },
];

export function findNeshamaPrefix(value: string | undefined): NeshamaPrefixOption | undefined {
  if (!value) return undefined;
  return NESHAMA_PREFIXES.find((p) => p.value === value);
}

/** Resolves a prefix value (+ custom text when 'other') to display text, or
 *  undefined when there's no prefix to show. */
export function prefixText(
  namePrefix: string | undefined,
  customNamePrefix: string | undefined,
  hebrew: boolean,
): string | undefined {
  if (!namePrefix) return undefined;
  if (namePrefix === OTHER_PREFIX_VALUE) return customNamePrefix || undefined;
  const option = findNeshamaPrefix(namePrefix);
  if (!option) return undefined;
  return hebrew ? option.he : option.en;
}
