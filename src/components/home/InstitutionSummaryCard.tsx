import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { InstitutionSummary } from '../../hooks/useMekomosFeed';
import { Card } from '../ui/Card';
import { EditIcon } from '../ui/icons';

interface InstitutionSummaryCardProps {
  summary: InstitutionSummary;
}

export function InstitutionSummaryCard({ summary }: InstitutionSummaryCardProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const { institution, totalNeeded, totalFulfilled, seferTypes } = summary;
  const seferTypesText = seferTypes.map((type) => t(`sefer.${type}`)).join(', ');
  const isOwn = profile?.uid === institution.createdByUid;

  return (
    <Card
      className="mb-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
      onClick={() => navigate(`/institutions/${institution.institutionId}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-semibold">
          {institution.name}
          {showBilingual && institution.hebrewName ? ` · ${institution.hebrewName}` : ''}
        </p>
        {isOwn && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/institutions/${institution.institutionId}/edit`);
            }}
            aria-label={t('institution.edit') ?? ''}
            className="shrink-0 text-text-muted hover:text-accent"
          >
            <EditIcon width={16} height={16} />
          </button>
        )}
      </div>

      <div className="mt-3">
        <p className="text-lg font-bold text-accent">
          {t('home.itemsNeeded', { fulfilled: totalFulfilled, needed: totalNeeded })}
        </p>
        {seferTypesText && <p className="text-xs text-text-muted">{seferTypesText}</p>}
      </div>
    </Card>
  );
}
