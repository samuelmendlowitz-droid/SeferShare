import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { BookIcon, CampaignIcon, GiftIcon } from '../components/ui/icons';
import { useCampaignFeed } from '../hooks/useCampaignFeed';

const GUIDE_STEPS = [
  { icon: CampaignIcon, key: 'browse' },
  { icon: GiftIcon, key: 'donate' },
  { icon: BookIcon, key: 'dedicate' },
] as const;

/** A lightweight landing page — intro/guide + one featured campaign. Browsing
 *  the full catalog lives on the Campaigns and Seforim tabs instead. */
export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // "recommended" surfaces the campaign that's gone longest without progress —
  // the same heuristic the old All Campaigns tab used, just showing only the top one.
  const feed = useCampaignFeed('', { sortKey: 'recommended' });
  const featured = feed.campaigns[0];

  return (
    <AppLayout variant="home" onSearch={() => {}} showPushka>
      <Card className="mb-4">
        <h1 className="mb-1 text-lg font-bold">{t('home.welcomeTitle')}</h1>
        <p className="mb-4 text-sm text-text-muted">{t('home.welcomeBody')}</p>
        <div className="space-y-3">
          {GUIDE_STEPS.map(({ icon: StepIcon, key }) => (
            <div key={key} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-accent/10 text-accent">
                <StepIcon width={18} height={18} />
              </span>
              <div>
                <p className="text-sm font-semibold">{t(`home.guide.${key}Title`)}</p>
                <p className="text-xs text-text-muted">{t(`home.guide.${key}Body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <h2 className="mb-2 text-base font-semibold">{t('home.featuredCampaign')}</h2>
      {feed.loading ? (
        <LoadingSpinner />
      ) : featured ? (
        <CampaignCard
          campaign={featured}
          institution={feed.institutionsById.get(featured.institutionId)}
          neshamas={(featured.neshamaIds ?? [])
            .map((id) => feed.neshamosById.get(id))
            .filter((n): n is NonNullable<typeof n> => Boolean(n))}
          sefarimById={feed.sefarimById}
        />
      ) : (
        <p className="text-text-muted">{t('home.empty')}</p>
      )}

      <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate('/campaigns')}>
        {t('home.seeAllCampaigns')}
      </Button>
    </AppLayout>
  );
}
