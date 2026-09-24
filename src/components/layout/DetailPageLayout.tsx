import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { AppHeader, HEADER_TOTAL_HEIGHT_PX } from './AppHeader';
import { ArrowLeftIcon } from '../ui/icons';

const TOP_GAP_PX = 12;

interface DetailPageLayoutProps {
  children: ReactNode;
  /** Where "back" goes when there's no real history to return to (e.g. this
   *  page was opened directly from a shared link) — otherwise the actual
   *  previous page. */
  fallbackPath?: string;
}

/** Shared chrome for every detail/editor page (campaign, institution, neshama,
 *  sefer, and their create/edit forms): the same persistent AppHeader as the
 *  tabbed pages, full-screen content underneath it, and a small back button
 *  in place of the floating sub-nav — these pages have nothing to search,
 *  filter, or switch between. */
export function DetailPageLayout({ children, fallbackPath = '/' }: DetailPageLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { dir } = useLanguage();

  function handleBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackPath);
  }

  return (
    <div className="min-h-dvh pb-8">
      <AppHeader />
      <main
        className="mx-auto max-w-2xl px-4 pb-4"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + ${HEADER_TOTAL_HEIGHT_PX + TOP_GAP_PX}px)` }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('actions.back') ?? ''}
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-card transition-colors hover:text-accent"
        >
          <ArrowLeftIcon width={18} height={18} style={dir === 'rtl' ? { transform: 'scaleX(-1)' } : undefined} />
        </button>
        {children}
      </main>
    </div>
  );
}
