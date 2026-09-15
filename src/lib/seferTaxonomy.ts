import type { SeferType } from '../types';

/** One specific work/volume within a broad SeferType — e.g. under "gemara",
 *  the entry for Maseches Succah. `value` is the stored id; `en`/`he` are
 *  rendered directly (this reference data lives here rather than in the i18n
 *  locale files, since it's the same ~300 canonical names in every locale). */
export interface SeferSubtype {
  value: string;
  en: string;
  he: string;
}

/** Sentinel `subType` value meaning "see customSubType instead" — always offered
 *  alongside the curated list (and alone when a type has no curated list at all),
 *  since no fixed list can cover every sefer that'll ever be catalogued. */
export const OTHER_SUBTYPE_VALUE = 'other';

const CHUMASH: SeferSubtype[] = [
  { value: 'bereishis', en: 'Bereishis (Genesis)', he: 'בראשית' },
  { value: 'shemos', en: 'Shemos (Exodus)', he: 'שמות' },
  { value: 'vayikra', en: 'Vayikra (Leviticus)', he: 'ויקרא' },
  { value: 'bamidbar', en: 'Bamidbar (Numbers)', he: 'במדבר' },
  { value: 'devarim', en: 'Devarim (Deuteronomy)', he: 'דברים' },
];

const NEVIIM: SeferSubtype[] = [
  { value: 'yehoshua', en: 'Yehoshua (Joshua)', he: 'יהושע' },
  { value: 'shoftim', en: 'Shoftim (Judges)', he: 'שופטים' },
  { value: 'shmuel', en: 'Shmuel (Samuel)', he: 'שמואל' },
  { value: 'melachim', en: 'Melachim (Kings)', he: 'מלכים' },
  { value: 'yeshayahu', en: 'Yeshayahu (Isaiah)', he: 'ישעיהו' },
  { value: 'yirmiyahu', en: 'Yirmiyahu (Jeremiah)', he: 'ירמיהו' },
  { value: 'yechezkel', en: 'Yechezkel (Ezekiel)', he: 'יחזקאל' },
  { value: 'treiAsar', en: 'Trei Asar (12 Minor Prophets)', he: 'תרי עשר' },
];

const KESUVIM: SeferSubtype[] = [
  { value: 'tehillim_book', en: 'Tehillim (Psalms)', he: 'תהלים' },
  { value: 'mishlei', en: 'Mishlei (Proverbs)', he: 'משלי' },
  { value: 'iyov', en: 'Iyov (Job)', he: 'איוב' },
  { value: 'shirHashirim', en: 'Shir HaShirim (Song of Songs)', he: 'שיר השירים' },
  { value: 'rus', en: 'Rus (Ruth)', he: 'רות' },
  { value: 'eichah', en: 'Eichah (Lamentations)', he: 'איכה' },
  { value: 'koheles', en: 'Koheles (Ecclesiastes)', he: 'קהלת' },
  { value: 'esther_book', en: 'Esther', he: 'אסתר' },
  { value: 'daniel', en: 'Daniel', he: 'דניאל' },
  { value: 'ezraNechemiah', en: 'Ezra-Nechemiah', he: 'עזרא-נחמיה' },
  { value: 'divreiHayamim', en: 'Divrei HaYamim (Chronicles)', he: 'דברי הימים' },
];

/** The 63 Mishnah masechtos across the 6 sedorim. Also reused (a subset) for Gemara/Yerushalmi. */
const ZERAIM: SeferSubtype[] = [
  { value: 'berachos', en: 'Berachos', he: 'ברכות' },
  { value: 'peah', en: 'Peah', he: 'פאה' },
  { value: 'demai', en: 'Demai', he: 'דמאי' },
  { value: 'kilayim', en: 'Kilayim', he: 'כלאים' },
  { value: 'sheviis', en: "Sheviis", he: 'שביעית' },
  { value: 'terumos', en: 'Terumos', he: 'תרומות' },
  { value: 'maasros', en: 'Maasros', he: 'מעשרות' },
  { value: 'maaserSheni', en: 'Maaser Sheni', he: 'מעשר שני' },
  { value: 'challah', en: 'Challah', he: 'חלה' },
  { value: 'orlah', en: 'Orlah', he: 'ערלה' },
  { value: 'bikkurim', en: 'Bikkurim', he: 'ביכורים' },
];

const MOED: SeferSubtype[] = [
  { value: 'shabbos', en: 'Shabbos', he: 'שבת' },
  { value: 'eruvin', en: 'Eruvin', he: 'עירובין' },
  { value: 'pesachim', en: 'Pesachim', he: 'פסחים' },
  { value: 'shekalim', en: 'Shekalim', he: 'שקלים' },
  { value: 'yoma', en: 'Yoma', he: 'יומא' },
  { value: 'succah', en: 'Succah', he: 'סוכה' },
  { value: 'beitzah', en: 'Beitzah', he: 'ביצה' },
  { value: 'roshHashanah', en: 'Rosh Hashanah', he: 'ראש השנה' },
  { value: 'taanis', en: 'Taanis', he: 'תענית' },
  { value: 'megillah', en: 'Megillah', he: 'מגילה' },
  { value: 'moedKatan', en: 'Moed Katan', he: 'מועד קטן' },
  { value: 'chagigah', en: 'Chagigah', he: 'חגיגה' },
];

const NASHIM: SeferSubtype[] = [
  { value: 'yevamos', en: 'Yevamos', he: 'יבמות' },
  { value: 'kesubos', en: 'Kesubos', he: 'כתובות' },
  { value: 'nedarim', en: 'Nedarim', he: 'נדרים' },
  { value: 'nazir', en: 'Nazir', he: 'נזיר' },
  { value: 'sotah', en: 'Sotah', he: 'סוטה' },
  { value: 'gitin', en: 'Gitin', he: 'גיטין' },
  { value: 'kiddushin', en: 'Kiddushin', he: 'קידושין' },
];

/** The Nezikin masechtos that have Bavli Gemara (excludes Avos and Eduyos, Mishnah-only). */
const NEZIKIN_WITH_GEMARA: SeferSubtype[] = [
  { value: 'bavaKamma', en: 'Bava Kamma', he: 'בבא קמא' },
  { value: 'bavaMetzia', en: 'Bava Metzia', he: 'בבא מציעא' },
  { value: 'bavaBasra', en: 'Bava Basra', he: 'בבא בתרא' },
  { value: 'sanhedrin', en: 'Sanhedrin', he: 'סנהדרין' },
  { value: 'makkos', en: 'Makkos', he: 'מכות' },
  { value: 'shevuos', en: 'Shevuos', he: 'שבועות' },
  { value: 'avodahZarah', en: 'Avodah Zarah', he: 'עבודה זרה' },
  { value: 'horayos', en: 'Horayos', he: 'הוראיות' },
];

const NEZIKIN_MISHNAH_ONLY: SeferSubtype[] = [
  { value: 'eduyos', en: 'Eduyos', he: 'עדיות' },
  { value: 'avos', en: 'Avos (Pirkei Avos)', he: 'אבות' },
];

/** The Kodashim masechtos that have Bavli Gemara (excludes Tamid, Middos, Kinnim). */
const KODASHIM_WITH_GEMARA: SeferSubtype[] = [
  { value: 'zevachim', en: 'Zevachim', he: 'זבחים' },
  { value: 'menachos', en: 'Menachos', he: 'מנחות' },
  { value: 'chullin', en: 'Chullin', he: 'חולין' },
  { value: 'bechoros', en: 'Bechoros', he: 'בכורות' },
  { value: 'arachin', en: 'Arachin', he: 'ערכין' },
  { value: 'temurah', en: 'Temurah', he: 'תמורה' },
  { value: 'kerisus', en: 'Kerisus', he: 'כריתות' },
  { value: 'meilah', en: 'Meilah', he: 'מעילה' },
];

const KODASHIM_MISHNAH_ONLY: SeferSubtype[] = [
  { value: 'tamid', en: 'Tamid', he: 'תמיד' },
  { value: 'middos', en: 'Middos', he: 'מדות' },
  { value: 'kinnim', en: 'Kinnim', he: 'קנים' },
];

const TAHOROS: SeferSubtype[] = [
  { value: 'keilim', en: 'Keilim', he: 'כלים' },
  { value: 'oholos', en: 'Oholos', he: 'אהלות' },
  { value: 'negaim', en: 'Negaim', he: 'נגעים' },
  { value: 'parah', en: 'Parah', he: 'פרה' },
  { value: 'taharos', en: 'Taharos', he: 'טהרות' },
  { value: 'mikvaos', en: 'Mikvaos', he: 'מקואות' },
  { value: 'niddah', en: 'Niddah', he: 'נדה' },
  { value: 'machshirin', en: 'Machshirin', he: 'מכשירין' },
  { value: 'zavim', en: 'Zavim', he: 'זבים' },
  { value: 'tevulYom', en: 'Tevul Yom', he: 'טבול יום' },
  { value: 'yadayim', en: 'Yadayim', he: 'ידים' },
  { value: 'uktzin', en: 'Uktzin', he: 'עוקצין' },
];

const MISHNAH: SeferSubtype[] = [
  ...ZERAIM,
  ...MOED,
  ...NASHIM,
  ...NEZIKIN_WITH_GEMARA,
  ...NEZIKIN_MISHNAH_ONLY,
  ...KODASHIM_WITH_GEMARA,
  ...KODASHIM_MISHNAH_ONLY,
  ...TAHOROS,
];

/** The 37 masechtos of Shas (Talmud Bavli) — every tractate with Bavli Gemara.
 *  Berachos is Zeraim's only tractate with Bavli Gemara; the rest of Zeraim
 *  (Bavli has none) is Yerushalmi-only, see below. */
const GEMARA_BAVLI: SeferSubtype[] = [
  { value: 'berachos', en: 'Berachos', he: 'ברכות' },
  ...MOED,
  ...NASHIM,
  ...NEZIKIN_WITH_GEMARA,
  ...KODASHIM_WITH_GEMARA,
  { value: 'niddah', en: 'Niddah', he: 'נדה' },
];

/** Talmud Yerushalmi exists for Zeraim, Moed, Nashim, most of Nezikin, and the
 *  opening perakim of Niddah — never for Kodashim or the rest of Taharos. */
const YERUSHALMI: SeferSubtype[] = [
  ...ZERAIM,
  ...MOED,
  ...NASHIM,
  ...NEZIKIN_WITH_GEMARA,
  { value: 'niddah', en: 'Niddah (first 3 perakim)', he: 'נדה' },
];

const SHULCHAN_ARUCH: SeferSubtype[] = [
  { value: 'orachChaim', en: 'Orach Chaim', he: 'אורח חיים' },
  { value: 'yorehDeah', en: 'Yoreh Deah', he: 'יורה דעה' },
  { value: 'evenHaezer', en: 'Even HaEzer', he: 'אבן העזר' },
  { value: 'choshenMishpat', en: 'Choshen Mishpat', he: 'חושן משפט' },
];

const HALACHA: SeferSubtype[] = [
  { value: 'mishnahBerurah', en: 'Mishnah Berurah', he: 'משנה ברורה' },
  { value: 'kitzurShulchanAruch', en: 'Kitzur Shulchan Aruch', he: 'קיצור שולחן ערוך' },
  { value: 'chayeiAdam', en: 'Chayei Adam', he: 'חיי אדם' },
  { value: 'chochmasAdam', en: 'Chochmas Adam', he: 'חכמת אדם' },
  { value: 'aruchHashulchan', en: 'Aruch HaShulchan', he: 'ערוך השולחן' },
  { value: 'benIshChai', en: 'Ben Ish Chai', he: 'בן איש חי' },
  { value: 'kafHachaim', en: 'Kaf HaChaim', he: 'כף החיים' },
  { value: 'chofetzChaim', en: 'Chofetz Chaim', he: 'חפץ חיים' },
  { value: 'shmirasShabbosKehilchasa', en: 'Shmiras Shabbos KeHilchasa', he: 'שמירת שבת כהלכתה' },
  { value: 'yalkutYosef', en: 'Yalkut Yosef', he: 'ילקוט יוסף' },
  { value: 'piskeiTeshuvos', en: 'Piskei Teshuvos', he: 'פסקי תשובות' },
  { value: 'rambamYad', en: 'Rambam - Mishneh Torah (Yad HaChazakah)', he: 'משנה תורה (יד החזקה)' },
];

const COMMENTARY: SeferSubtype[] = [
  { value: 'rashi', en: 'Rashi', he: 'רש"י' },
  { value: 'tosafos', en: 'Tosafos', he: 'תוספות' },
  { value: 'ramban', en: 'Ramban', he: 'רמב"ן' },
  { value: 'ibnEzra', en: 'Ibn Ezra', he: 'אבן עזרא' },
  { value: 'sforno', en: 'Sforno', he: 'ספורנו' },
  { value: 'orHachaim', en: 'Ohr HaChaim', he: 'אור החיים' },
  { value: 'rashbam', en: 'Rashbam', he: 'רשב"ם' },
  { value: 'chizkuni', en: 'Chizkuni', he: 'חזקוני' },
  { value: 'kliYakar', en: 'Kli Yakar', he: 'כלי יקר' },
  { value: 'netziv', en: "Netziv (Ha'amek Davar)", he: 'העמק דבר' },
  { value: 'malbim', en: 'Malbim', he: 'מלבי"ם' },
  { value: 'rashba', en: 'Rashba', he: 'רשב"א' },
  { value: 'ritva', en: 'Ritva', he: 'ריטב"א' },
  { value: 'ran', en: 'Ran', he: 'ר"ן' },
  { value: 'maharsha', en: 'Maharsha', he: 'מהרש"א' },
  { value: 'rosh', en: 'Rosh', he: 'רא"ש' },
  { value: 'meiri', en: 'Meiri', he: 'מאירי' },
  { value: 'sifseiChachamim', en: 'Sifsei Chachamim', he: 'שפתי חכמים' },
  { value: 'metzudos', en: 'Metzudos', he: 'מצודות' },
  { value: 'radak', en: 'Radak', he: 'רד"ק' },
];

const MUSSAR: SeferSubtype[] = [
  { value: 'mesillasYesharim', en: 'Mesillas Yesharim', he: 'מסילת ישרים' },
  { value: 'chovosHalevavos', en: 'Chovos HaLevavos', he: 'חובות הלבבות' },
  { value: 'shaareiTeshuvah', en: 'Shaarei Teshuvah', he: 'שערי תשובה' },
  { value: 'orchosTzaddikim', en: 'Orchos Tzaddikim', he: 'אורחות צדיקים' },
  { value: 'seferHayirah', en: 'Sefer HaYirah', he: 'ספר היראה' },
  { value: 'reishisChochmah', en: 'Reishis Chochmah', he: 'ראשית חכמה' },
  { value: 'shaareiKedushah', en: 'Shaarei Kedushah', he: 'שערי קדושה' },
  { value: 'michtavMeeliyahu', en: 'Michtav MeEliyahu', he: 'מכתב מאליהו' },
  { value: 'aleiShur', en: 'Alei Shur', he: 'עלי שור' },
  { value: 'ohrYisrael', en: 'Ohr Yisrael', he: 'אור ישראל' },
];

const CHASSIDUS: SeferSubtype[] = [
  { value: 'tanya', en: 'Tanya', he: 'תניא' },
  { value: 'likuteiMoharan', en: 'Likutei Moharan', he: 'ליקוטי מוהר"ן' },
  { value: 'noamElimelech', en: 'Noam Elimelech', he: 'נועם אלימלך' },
  { value: 'kedushasLevi', en: 'Kedushas Levi', he: 'קדושת לוי' },
  { value: 'meorEinayim', en: 'Meor Einayim', he: 'מאור עינים' },
  { value: 'sfasEmes', en: 'Sfas Emes', he: 'שפת אמת' },
  { value: 'bneiYissaschar', en: 'Bnei Yissaschar', he: 'בני יששכר' },
  { value: 'likuteiSichos', en: 'Likutei Sichos', he: 'ליקוטי שיחות' },
  { value: 'tzavaasHarivash', en: "Tzava'as HaRivash", he: 'צוואת הריב"ש' },
  { value: 'toldosYaakovYosef', en: 'Toldos Yaakov Yosef', he: 'תולדות יעקב יוסף' },
];

const KABBALAH: SeferSubtype[] = [
  { value: 'zohar', en: 'Zohar', he: 'זוהר' },
  { value: 'etzChaim', en: 'Etz Chaim', he: 'עץ חיים' },
  { value: 'shaarHagilgulim', en: 'Shaar HaGilgulim', he: 'שער הגלגולים' },
  { value: 'pardesRimonim', en: 'Pardes Rimonim', he: 'פרדס רימונים' },
  { value: 'tomerDevorah', en: 'Tomer Devorah', he: 'תומר דבורה' },
  { value: 'seferYetzirah', en: 'Sefer Yetzirah', he: 'ספר יצירה' },
  { value: 'shaareiOrah', en: 'Shaarei Orah', he: 'שערי אורה' },
  { value: 'evenShleimah', en: 'Even Shleimah', he: 'אבן שלמה' },
];

const MACHSHAVA: SeferSubtype[] = [
  { value: 'kuzari', en: 'Kuzari', he: 'כוזרי' },
  { value: 'morehNevuchim', en: 'Moreh Nevuchim (Guide for the Perplexed)', he: 'מורה נבוכים' },
  { value: 'derechHashem', en: 'Derech Hashem', he: 'דרך ה\'' },
  { value: 'nefeshHachaim', en: 'Nefesh HaChaim', he: 'נפש החיים' },
  { value: 'daasTevunos', en: 'Daas Tevunos', he: 'דעת תבונות' },
  { value: 'emunosVdeos', en: "Emunos V'Deos", he: 'אמונות ודעות' },
  { value: 'ikkarim', en: 'Ikkarim', he: 'עיקרים' },
];

const SIDDUR: SeferSubtype[] = [
  { value: 'ashkenaz', en: 'Nusach Ashkenaz', he: 'נוסח אשכנז' },
  { value: 'sefard', en: 'Nusach Sefard', he: 'נוסח ספרד' },
  { value: 'edotHamizrach', en: 'Edot HaMizrach (Sefaradi)', he: 'עדות המזרח' },
  { value: 'ariChabad', en: 'Nusach Ari (Chabad)', he: 'נוסח האר"י (חב"ד)' },
  { value: 'teimanBaladi', en: 'Teiman - Baladi', he: 'תימן - בלדי' },
  { value: 'teimanShami', en: 'Teiman - Shami', he: 'תימן - שאמי' },
];

const MACHZOR: SeferSubtype[] = [
  { value: 'roshHashanah', en: 'Rosh Hashanah', he: 'ראש השנה' },
  { value: 'yomKippur', en: 'Yom Kippur', he: 'יום כיפור' },
  { value: 'succos', en: 'Succos', he: 'סוכות' },
  { value: 'pesach', en: 'Pesach', he: 'פסח' },
  { value: 'shavuos', en: 'Shavuos', he: 'שבועות' },
  { value: 'selichos', en: 'Selichos', he: 'סליחות' },
];

const RESPONSA: SeferSubtype[] = [
  { value: 'igrosMoshe', en: 'Igros Moshe', he: 'אגרות משה' },
  { value: 'tzitzEliezer', en: 'Tzitz Eliezer', he: 'ציץ אליעזר' },
  { value: 'minchasYitzchak', en: 'Minchas Yitzchak', he: 'מנחת יצחק' },
  { value: 'yechavehDaas', en: 'Yechaveh Daas', he: 'יחוה דעת' },
  { value: 'yabiaOmer', en: 'Yabia Omer', he: 'יביע אומר' },
  { value: 'chelkasYaakov', en: 'Chelkas Yaakov', he: 'חלקת יעקב' },
  { value: 'shevetHalevi', en: 'Shevet HaLevi', he: 'שבט הלוי' },
  { value: 'azNidberu', en: 'Az Nidberu', he: 'אז נדברו' },
];

const REFERENCE: SeferSubtype[] = [
  { value: 'dikduk', en: 'Dikduk (Grammar)', he: 'דקדוק' },
  { value: 'encyclopediaTalmudis', en: 'Encyclopedia Talmudis', he: 'אנציקלופדיה תלמודית' },
  { value: 'otzarHaposkim', en: 'Otzar HaPoskim', he: 'אוצר הפוסקים' },
  { value: 'concordance', en: 'Concordance', he: 'קונקורדנציה' },
];

/** Full Tanach = Torah + Nevi'im + Kesuvim (24 books total). */
const TANACH: SeferSubtype[] = [...CHUMASH, ...NEVIIM, ...KESUVIM];

/** Every SeferType that has a meaningful, curated list of specific works/volumes.
 *  Types not listed here (haggadah, tehillim, biography, childrens, other) don't
 *  get a subtype slider — there's nothing specific to narrow down to. */
export const SEFER_SUBTYPES: Partial<Record<SeferType, SeferSubtype[]>> = {
  chumash: CHUMASH,
  tanach: TANACH,
  mishnah: MISHNAH,
  gemara: GEMARA_BAVLI,
  yerushalmi: YERUSHALMI,
  shulchanAruch: SHULCHAN_ARUCH,
  halacha: HALACHA,
  commentary: COMMENTARY,
  mussar: MUSSAR,
  chassidus: CHASSIDUS,
  kabbalah: KABBALAH,
  machshava: MACHSHAVA,
  siddur: SIDDUR,
  machzor: MACHZOR,
  responsa: RESPONSA,
  reference: REFERENCE,
};

/** Resolves the display text for a sefer's type: its own free text when `type`
 *  is 'other' and one was given, otherwise the caller's translated fallback
 *  (`t('sefer.' + type)`) — callers already have that string in hand from their
 *  own `t()` call, so this just decides which one wins. */
export function seferTypeText(type: SeferType, customType: string | undefined, translatedFallback: string): string {
  return type === 'other' && customType ? customType : translatedFallback;
}

export function getSubtypesFor(type: SeferType): SeferSubtype[] {
  return SEFER_SUBTYPES[type] ?? [];
}

export function findSubtype(type: SeferType, value: string | undefined): SeferSubtype | undefined {
  if (!value) return undefined;
  return getSubtypesFor(type).find((s) => s.value === value);
}

/** Display label for a sefer's subtype, honoring the bilingual toggle the same
 *  way the rest of the app does (English, or "English · Hebrew" when bilingual).
 *  When `value` is the 'other' sentinel, resolves to `customSubType` instead. */
export function subtypeLabel(
  type: SeferType,
  value: string | undefined,
  showBilingual: boolean,
  customSubType?: string,
): string | undefined {
  if (value === OTHER_SUBTYPE_VALUE) return customSubType || undefined;
  const sub = findSubtype(type, value);
  if (!sub) return undefined;
  return showBilingual ? `${sub.en} · ${sub.he}` : sub.en;
}
