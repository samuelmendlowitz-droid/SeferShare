import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getNeshama } from '../services/neshamos';
import type { Neshama } from '../types';
import { usePushka } from '../context/PushkaContext';
import { InstitutionPicker } from '../components/shared/InstitutionPicker';
import { SeferPicker, type PickedItem } from '../components/donation/SeferPicker';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function NeshamaDonatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pushka = usePushka();
  const { neshamaId } = useParams();
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [institutionId, setInstitutionId] = useState<string | undefined>();
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!neshamaId) return;
    getNeshama(neshamaId).then((n) => {
      if (!n) setNotFound(true);
      else setNeshama(n);
    });
  }, [neshamaId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('neshama.notFound')}</p>
      </div>
    );
  }

  if (!neshama) return <LoadingSpinner fullScreen />;

  function handleAddToPushka() {
    if (!neshama || !institutionId || picked.length === 0) return;
    for (const item of picked) {
      pushka.addItem(
        {
          seferId: item.seferId,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          englishName: item.englishName,
          hebrewName: item.hebrewName,
          price: item.price,
          imageUrl: item.imageUrl,
          neshamaId: neshama.neshamaId,
          institutionId,
        },
        item.quantity,
      );
    }
    setPicked([]);
    setAdded(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <Card className="mb-4">
        <p className="text-sm text-text-muted">{t('neshama.donatingInMemoryOf')}</p>
        <h1 className="text-lg font-bold">
          {t('neshama.liluyNishmat')} {neshama.name}
          {neshama.hebrewName ? ` · ${neshama.hebrewName}` : ''}
        </h1>
      </Card>

      <h2 className="mb-2 text-base font-semibold">{t('campaign.selectWhere')}</h2>
      <InstitutionPicker value={institutionId} onChange={(id) => setInstitutionId(id)} />

      <h2 className="mb-2 mt-4 text-base font-semibold">{t('campaign.selectSeforim')}</h2>
      <SeferPicker picked={picked} onChange={setPicked} />

      {added && picked.length === 0 && (
        <p className="mt-3 text-sm font-medium text-success">{t('neshama.addedToPushka')}</p>
      )}

      <Button
        className="mt-4 w-full"
        disabled={!institutionId || picked.length === 0}
        onClick={handleAddToPushka}
      >
        {t('pushka.addToPushka')}
      </Button>

      {pushka.totalCount > 0 && (
        <div
          className="fixed inset-x-0 z-40 mx-auto max-w-2xl px-4"
          style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
        >
          <Button className="w-full shadow-navbar" onClick={() => navigate('/pushka')}>
            {t('pushka.completeDonation', { count: pushka.totalCount, amount: pushka.totalPrice.toFixed(2) })}
          </Button>
        </div>
      )}
    </div>
  );
}
