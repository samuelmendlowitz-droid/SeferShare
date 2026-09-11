import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getInstitution } from '../services/institutions';
import { getNeshama } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';
import type { Donation, Institution, Neshama, Sefer } from '../types';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function DonationConfirmationPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const donationId = params.get('donationId');
  const [donation, setDonation] = useState<Donation | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());

  useEffect(() => {
    if (!donationId) return;
    (async () => {
      const snap = await getDoc(doc(db, 'donations', donationId));
      if (!snap.exists()) return;
      const d = snap.data() as Donation;
      setDonation(d);
      if (d.requestedInstitutionId) setInstitution(await getInstitution(d.requestedInstitutionId));
      if (d.requestedNeshamaId) setNeshama(await getNeshama(d.requestedNeshamaId));
      const sefarim = await listSefarim();
      setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
    })();
  }, [donationId]);

  if (!donation) return <LoadingSpinner fullScreen />;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <Card className="border-2 border-accent/20 text-center">
        <p className="text-lg font-bold text-accent">{t('donation.confirmedTitle')}</p>
        <p className="text-sm text-text-muted">{t('donation.confirmedSubtitle')}</p>
        {(institution || neshama) && (
          <p className="mt-2 text-sm">
            {institution && <span>{institution.name}</span>}
            {institution && neshama && ' • '}
            {neshama && (
              <span className={institution ? 'text-text-muted' : ''}>
                {t('neshama.liluyNishmat')} {neshama.name}
              </span>
            )}
          </p>
        )}
        {donation.donorDedication?.name && (
          <p className="mt-1 text-sm">
            {t('neshama.liluyNishmat')} {donation.donorDedication.name}
          </p>
        )}
        {donation.additionalDedications && donation.additionalDedications.length > 0 && (
          <div className="mt-2 text-left">
            <p className="text-xs font-medium text-text-muted">{t('donation.additionalDedicationTitle')}</p>
            {donation.additionalDedications.map((dedication, idx) => (
              <p key={idx} className="text-sm">
                {t('neshama.liluyNishmat')} {dedication.name}
              </p>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-1 text-left">
          {donation.items.map((item, idx) => (
            <p key={idx} className="text-sm">
              {item.quantity}× {sefarimById.get(item.seferId)?.englishName ?? item.seferId}
            </p>
          ))}
        </div>
        {donation.ad && (
          <div className="mt-3 rounded-btn border border-dashed border-border p-2 text-left">
            <p className="text-xs font-medium text-text-muted">{t('donation.adSectionTitle')}</p>
            <p className="text-sm font-semibold">{donation.ad.businessName}</p>
            {donation.ad.message && <p className="text-xs text-text-muted">{donation.ad.message}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
