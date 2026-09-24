import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getInstitution } from '../services/institutions';
import type { Institution } from '../types';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { InstitutionEditForm } from '../components/shared/InstitutionEditForm';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function InstitutionEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { institutionId } = useParams();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    getInstitution(institutionId).then((inst) => {
      if (!inst) setNotFound(true);
      else setInstitution(inst);
    });
  }, [institutionId]);

  if (notFound) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <p className="text-text-muted">{t('institution.notFound')}</p>
      </DetailPageLayout>
    );
  }

  if (!institution) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <LoadingSpinner />
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout fallbackPath={`/institutions/${institution.institutionId}`}>
      <h1 className="mb-4 text-xl font-bold">{t('institution.edit')}</h1>
      <InstitutionEditForm
        institution={institution}
        onSaved={() => navigate(`/institutions/${institution.institutionId}`)}
        onDeleted={() => navigate('/profile')}
      />
    </DetailPageLayout>
  );
}
