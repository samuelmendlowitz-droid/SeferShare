import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { InstitutionCreateForm } from '../components/shared/InstitutionCreateForm';

export function InstitutionCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DetailPageLayout fallbackPath="/profile">
      <h1 className="mb-4 text-xl font-bold">{t('institution.addNew')}</h1>
      <InstitutionCreateForm onCreated={(institution) => navigate(`/institutions/${institution.institutionId}`)} />
    </DetailPageLayout>
  );
}
