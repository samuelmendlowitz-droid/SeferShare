import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import i18n from '../i18n';
import type { Language } from '../types';

interface LanguageContextValue {
  language: Language;
  dir: 'ltr' | 'rtl';
  /** True when both scripts should render side-by-side (bilingual fields). */
  showBilingual: boolean;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'sefer-share-language';

function resolveDir(language: Language): 'ltr' | 'rtl' {
  // Hebrew-only is RTL. English-only and "both" (mixed layout) stay LTR
  // so bilingual fields read English-first with Hebrew alongside.
  return language === 'he' ? 'rtl' : 'ltr';
}

function resolveI18nLanguage(language: Language): 'en' | 'he' {
  return language === 'he' ? 'he' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Language) ?? 'en';
  });

  const dir = resolveDir(language);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = resolveI18nLanguage(language);
    void i18n.changeLanguage(resolveI18nLanguage(language));
    localStorage.setItem(STORAGE_KEY, language);
  }, [language, dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      dir,
      showBilingual: language === 'both',
      setLanguage: setLanguageState,
    }),
    [language, dir],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
