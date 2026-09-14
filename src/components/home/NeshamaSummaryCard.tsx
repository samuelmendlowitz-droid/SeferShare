import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import type { NeshamaSummary } from '../../hooks/useNeshamosFeed';
import { Card } from '../ui/Card';

interface NeshamaSummaryCardProps {
  summary: NeshamaSummary;
}

export function NeshamaSummaryCard({ summary }: NeshamaSummaryCardProps) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const { neshama } = summary;
  const seferTypesText = (neshama.seferTypes ?? []).map((type) => t(`sefer.${type}`)).join(', ');

  return (
    <Card
      className="mb-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
      onClick={() => navigate(`/neshamos/${neshama.neshamaId}`)}
    >
      <p className="text-base font-semibold">
        {t('neshama.liluyNishmat')} {neshamaDedicationLine(neshama, showBilingual)}
      </p>
      {seferTypesText && <p className="mt-2 text-xs text-text-muted">{seferTypesText}</p>}
    </Card>
  );
}
