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

  if (!donation) return <div className="mx-auto max-w-2xl px-4 pt-6 text-text-muted">…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <Card className="border-2 border-accent/20 text-center">
        <p className="text-lg font-bold text-accent">{t('donation.confirmedTitle')}</p>
        <p className="text-sm text-text-muted">{t('donation.confirmedSubtitle')}</p>
        {institution && <p className="mt-2 text-sm">{institution.name}</p>}
        {neshama && <p className="mt-1 text-sm">{t('neshama.liluyNishmat')} {neshama.name}</p>}
        <div className="mt-3 space-y-1 text-left">
          {donation.items.map((item, idx) => (
            <p key={idx} className="text-sm">
              {item.quantity}× {sefarimById.get(item.seferId)?.englishName ?? item.seferId}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
