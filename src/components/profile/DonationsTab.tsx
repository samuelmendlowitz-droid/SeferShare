import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Donation } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface DonationsTabProps {
  loading: boolean;
  donations: Donation[];
}

export function DonationsTab({ loading, donations }: DonationsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
          <p className="text-sm text-text-muted">{t(`donationStatus.${donation.status}`)}</p>
          {donation.campaignAssignments[0] && (
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => navigate(`/campaigns/${donation.campaignAssignments[0].campaignId}`)}
            >
              {t('campaign.view')}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
