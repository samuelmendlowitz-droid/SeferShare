import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { NeshamaCreateForm } from '../components/shared/NeshamaCreateForm';

export function NeshamaCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DetailPageLayout fallbackPath="/community">
      <h1 className="mb-4 text-xl font-bold">{t('neshama.addNew')}</h1>
      <NeshamaCreateForm onCreated={(neshama) => navigate(`/neshamos/${neshama.neshamaId}`)} />
    </DetailPageLayout>
  );
}
