import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInstitution } from '../services/institutions';
import { getNeshama } from '../services/neshamos';
import type { Institution, Neshama } from '../types';
import { SeferPicker, type PickedItem } from '../components/donation/SeferPicker';
import { InstitutionPicker } from '../components/shared/InstitutionPicker';
import { NeshamaPicker } from '../components/shared/NeshamaPicker';
import { CheckoutStep } from '../components/donation/CheckoutStep';
import { VirtualDedicationCard } from '../components/donation/VirtualDedicationCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

type Step = 'seforim' | 'dedication' | 'message' | 'checkout' | 'confirmation';

export function DonationFlowPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [step, setStep] = useState<Step>('seforim');
  const [items, setItems] = useState<PickedItem[]>([]);
  const [institutionId, setInstitutionId] = useState<string>();
  const [neshamaId, setNeshamaId] = useState<string>();
  const [donorMessage, setDonorMessage] = useState('');
  const [institution, setInstitution] = useState<Institution>();
  const [neshama, setNeshama] = useState<Neshama>();

  async function handlePaid() {
    if (institutionId) setInstitution((await getInstitution(institutionId)) ?? undefined);
    if (neshamaId) setNeshama((await getNeshama(neshamaId)) ?? undefined);
    setStep('confirmation');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      {step !== 'confirmation' && (
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
      )}

      {step === 'seforim' && (
        <>
          <h1 className="mb-4 text-lg font-bold">{t('donation.browse')}</h1>
          <SeferPicker picked={items} onChange={setItems} />
          <Button className="mt-4 w-full" disabled={items.length === 0} onClick={() => setStep('dedication')}>
            {t('actions.next')}
          </Button>
        </>
      )}

      {step === 'dedication' && (
        <>
          <h1 className="mb-4 text-lg font-bold">{t('campaign.selectWhere')}</h1>
          <Card className="mb-3">
            <p className="mb-2 text-sm text-text-muted">{t('donation.optionalWhere')}</p>
            <InstitutionPicker value={institutionId} onChange={setInstitutionId} />
          </Card>
          <Card className="mb-4">
            <p className="mb-2 text-sm text-text-muted">{t('donation.optionalWho')}</p>
            <NeshamaPicker value={neshamaId} onChange={setNeshamaId} />
          </Card>
          <Button className="w-full" onClick={() => setStep('message')}>
            {t('actions.next')}
          </Button>
        </>
      )}

      {step === 'message' && (
        <>
          <h1 className="mb-4 text-lg font-bold">{t('donation.message')}</h1>
          <textarea
            value={donorMessage}
            onChange={(e) => setDonorMessage(e.target.value)}
            placeholder={t('donation.message') ?? ''}
            className="mb-4 w-full rounded-btn border border-border px-3 py-2 text-sm"
            rows={4}
          />
          <Button className="w-full" onClick={() => setStep('checkout')}>
            {t('actions.next')}
          </Button>
        </>
      )}

      {step === 'checkout' && (
        <>
          <h1 className="mb-4 text-lg font-bold">{t('donation.checkout')}</h1>
          <CheckoutStep
            items={items}
            institutionId={institutionId}
            neshamaId={neshamaId}
            donorMessage={donorMessage}
            onPaid={handlePaid}
          />
        </>
      )}

      {step === 'confirmation' && (
        <VirtualDedicationCard
          donorName={profile?.displayName ?? ''}
          items={items}
          institution={institution}
          neshama={neshama}
        />
      )}
    </div>
  );
}
