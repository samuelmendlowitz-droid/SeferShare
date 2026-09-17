import { useTranslation } from 'react-i18next';

interface PageHeadingProps {
  /** Which page/section this is, e.g. "Home", "Vendor", "New Campaign" — shown
   *  faded after the app name so it's always clear where you are. */
  page: string;
  className?: string;
}

/** "SeferShare - Home" style page indicator, shown at the top of every
 *  top-level page/flow so it's always clear which page you're on. */
export function PageHeading({ page, className = 'mb-4 text-lg font-bold' }: PageHeadingProps) {
  const { t } = useTranslation();
  return (
    <p className={className}>
      {t('app.name')} <span className="font-normal text-text-muted">- {page}</span>
    </p>
  );
}
