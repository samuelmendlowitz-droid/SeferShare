import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listMyDonations } from '../../services/donations';
import type { Donation } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function DonationsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listMyDonations(profile.uid)
      .then(setDonations)
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner />;
  if (donations.length === 0) return <p className="text-text-muted">{t('home.empty')}</p>;

  return (
    <div>
      {donations.map((donation) => (
        <Card key={donation.donationId} className="mb-3">
          <p className="text-sm text-text-muted">{new Date(donation.createdAt).toLocaleDateString()}</p>
          <p className="text-base font-semibold">
            {t('donation.total')}: ${donation.totalCharged.toFixed(2)}
          </p>
          <p className="text-sm text-text-muted">{donation.status}</p>
          {donation.campaignAssignments[0] && (
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => navigate(`/donate?campaignId=${donation.campaignAssignments[0].campaignId}`)}
            >
              {t('donation.browse')}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
