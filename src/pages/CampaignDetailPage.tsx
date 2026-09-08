import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaign } from '../services/campaigns';
import { getInstitution } from '../services/institutions';
import { getNeshama } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';
import type { Campaign, Institution, Neshama, Sefer } from '../types';
import { campaignDollarTotal } from '../lib/campaignMath';
import { ProgressBar } from '../components/campaign/ProgressBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function CampaignDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      const c = await getCampaign(campaignId);
      setCampaign(c);
      if (c?.institutionId) setInstitution(await getInstitution(c.institutionId));
      if (c?.neshamaId) setNeshama(await getNeshama(c.neshamaId));
      const sefarim = await listSefarim();
      setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
    })();
  }, [campaignId]);

  if (!campaign) return <LoadingSpinner fullScreen />;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <Card>
        {campaign.title && <h1 className="mb-1 text-lg font-bold">{campaign.title}</h1>}
        {institution && <p className="text-sm">{institution.name}</p>}
        {neshama && (
          <p className="text-sm text-text-muted">
            {t('neshama.liluyNishmat')} {neshama.name}
          </p>
        )}
        {neshama?.message && <p className="mt-1 text-sm italic text-text-muted">"{neshama.message}"</p>}

        <div className="mt-4">
          <p className="text-xl font-bold text-accent">
            {t('home.itemsNeeded', { fulfilled: campaign.totalItemsFulfilled, needed: campaign.totalItemsNeeded })}
          </p>
          <p className="text-sm text-text-muted">
            {t('home.dollarTotal', { amount: campaignDollarTotal(campaign).toFixed(2) })}
          </p>
        </div>
        <div className="mt-2">
          <ProgressBar fulfilled={campaign.totalItemsFulfilled} needed={campaign.totalItemsNeeded} />
        </div>

        <div className="mt-4 space-y-1">
          {campaign.items.map((item, idx) => (
            <p key={idx} className="text-sm">
              {item.quantityFulfilled}/{item.quantity}× {sefarimById.get(item.seferId)?.englishName ?? item.seferId}
            </p>
          ))}
        </div>

        <Button className="mt-4 w-full" onClick={() => navigate(`/donate?campaignId=${campaign.campaignId}`)}>
          {t('donation.browse')}
        </Button>
      </Card>
    </div>
  );
}
