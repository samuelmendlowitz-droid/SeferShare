import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { NeshamaSummary } from '../../hooks/useNeshamosFeed';
import { Card } from '../ui/Card';

interface NeshamaSummaryCardProps {
  summary: NeshamaSummary;
}

export function NeshamaSummaryCard({ summary }: NeshamaSummaryCardProps) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const { neshama, totalNeeded, totalFulfilled, seferTypes } = summary;
  const seferTypesText = seferTypes.map((type) => t(`sefer.${type}`)).join(', ');

  return (
    <Card
      className="mb-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
      onClick={() => navigate(`/neshamos/${neshama.neshamaId}`)}
    >
      <p className="text-base font-semibold">
        {t('neshama.liluyNishmat')} {neshama.name}
        {showBilingual && neshama.hebrewName ? ` · ${neshama.hebrewName}` : ''}
      </p>

      <div className="mt-3">
        <p className="text-lg font-bold text-accent">
          {t('home.itemsNeeded', { fulfilled: totalFulfilled, needed: totalNeeded })}
        </p>
        {seferTypesText && <p className="text-xs text-text-muted">{seferTypesText}</p>}
      </div>
    </Card>
  );
}
