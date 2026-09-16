import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import type { NeshamaSummary } from '../../hooks/useNeshamosFeed';
import { Card } from '../ui/Card';
import { EditIcon } from '../ui/icons';

interface NeshamaSummaryCardProps {
  summary: NeshamaSummary;
}

export function NeshamaSummaryCard({ summary }: NeshamaSummaryCardProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const { neshama } = summary;
  const seferTypesText = (neshama.seferTypes ?? []).map((type) => t(`sefer.${type}`)).join(', ');
  const isOwn = profile?.uid === neshama.createdByUid;

  return (
    <Card
      className="mb-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
      onClick={() => navigate(`/neshamos/${neshama.neshamaId}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold">
          {t('neshama.liluyNishmat')} {neshamaDedicationLine(neshama, showBilingual)}
        </p>
        {isOwn && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/neshamos/${neshama.neshamaId}/edit`);
            }}
            aria-label={t('neshama.edit') ?? ''}
            className="shrink-0 text-text-muted hover:text-accent"
          >
            <EditIcon width={16} height={16} />
          </button>
        )}
      </div>
      {seferTypesText && <p className="mt-2 text-xs text-text-muted">{seferTypesText}</p>}
    </Card>
  );
}
