import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getNeshama } from '../services/neshamos';
import type { Neshama } from '../types';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { NeshamaEditForm } from '../components/shared/NeshamaEditForm';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function NeshamaEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { neshamaId } = useParams();
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!neshamaId) return;
    getNeshama(neshamaId).then((nesh) => {
      if (!nesh) setNotFound(true);
      else setNeshama(nesh);
    });
  }, [neshamaId]);

  if (notFound) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <p className="text-text-muted">{t('neshama.notFound')}</p>
      </DetailPageLayout>
    );
  }

  if (!neshama) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <LoadingSpinner />
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout fallbackPath={`/neshamos/${neshama.neshamaId}`}>
      <h1 className="mb-4 text-xl font-bold">{t('neshama.edit')}</h1>
      <NeshamaEditForm
        neshama={neshama}
        onSaved={() => navigate(`/neshamos/${neshama.neshamaId}`)}
        onDeleted={() => navigate('/campaigns')}
      />
    </DetailPageLayout>
  );
}
