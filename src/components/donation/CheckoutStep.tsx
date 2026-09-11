import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { stripePromise, estimateStripeFee } from '../../lib/stripe';
import { createPaymentIntent } from '../../services/donations';
import type { DonationAd, DonationDedication } from '../../types';
import type { PickedItem } from './SeferPicker';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface CheckoutStepProps {
  items: PickedItem[];
  institutionId?: string;
  neshamaId?: string;
  donorMessage?: string;
  donorDedication?: DonationDedication;
  additionalDedications?: DonationDedication[];
  ad?: DonationAd;
  onPaid: (donationId: string) => void;
}

function PaymentForm({ onPaid, donationId }: { onPaid: (donationId: string) => void; donationId: string }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/donate/confirmation?donationId=${donationId}` },
      redirect: 'if_required',
    });
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setSubmitting(false);
      return;
    }
    onPaid(donationId);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {t('donation.confirm')}
      </Button>
    </form>
  );
}

export function CheckoutStep({
  items,
  institutionId,
  neshamaId,
  donorMessage,
  donorDedication,
  additionalDedications,
  ad,
  onPaid,
}: CheckoutStepProps) {
  const { t } = useTranslation();
  const [roundUp, setRoundUp] = useState(false);
  const [intent, setIntent] = useState<{ clientSecret: string; donationId: string; totalCharged: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const fee = estimateStripeFee(subtotal);

  async function handleContinue() {
    setLoading(true);
    try {
      const result = await createPaymentIntent({
        items: items.map((i) => ({
          seferId: i.seferId,
          vendorId: i.vendorId,
          quantity: i.quantity,
          priceEach: i.price,
          ...(i.campaignId ? { campaignId: i.campaignId } : {}),
        })),
        requestedInstitutionId: institutionId,
        requestedNeshamaId: neshamaId,
        donorMessage,
        donorDedication,
        additionalDedications,
        ad,
        roundedUpFee: roundUp,
      });
      setIntent(result);
    } finally {
      setLoading(false);
    }
  }

  if (intent) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret }}>
        <Card>
          <p className="mb-3 text-sm text-text-muted">
            {t('donation.total')}: ${intent.totalCharged.toFixed(2)}
          </p>
          <PaymentForm donationId={intent.donationId} onPaid={onPaid} />
        </Card>
      </Elements>
    );
  }

  return (
    <Card>
      <p className="text-sm text-text-muted">{t('donation.total')}</p>
      <p className="mb-3 text-lg font-bold text-accent">${subtotal.toFixed(2)}</p>

      <label className="mb-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} />
        {t('donation.roundUp', { amount: fee.toFixed(2) })}
      </label>

      <Button onClick={handleContinue} disabled={loading || items.length === 0} className="w-full">
        {t('donation.checkout')}
      </Button>
    </Card>
  );
}
