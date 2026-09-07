import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CornerButton } from './CornerButton';
import { FloatingToggleBar, type ToggleOption } from './FloatingToggleBar';
import { HomeIcon, PlusIcon, ProfileIcon } from '../ui/icons';

export type HomeFilter = 'all' | 'where' | 'who' | 'what';
export type ProfileTab = 'campaigns' | 'donations' | 'notifications' | 'settings';

interface HomeLayoutProps {
  variant: 'home';
  filter: HomeFilter;
  onFilterChange: (filter: HomeFilter) => void;
  onSearch: (query: string) => void;
  children: ReactNode;
}

interface ProfileLayoutProps {
  variant: 'profile';
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onSearch: (query: string) => void;
  children: ReactNode;
}

type AppLayoutProps = HomeLayoutProps | ProfileLayoutProps;

export function AppLayout(props: AppLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const homeOptions: ToggleOption[] = useMemo(
    () => [
      { key: 'all', label: t('nav.allCampaigns') },
      { key: 'where', label: t('nav.where') },
      { key: 'who', label: t('nav.who') },
      { key: 'what', label: t('nav.what') },
    ],
    [t],
  );

  const profileOptions: ToggleOption[] = useMemo(
    () => [
      { key: 'campaigns', label: t('nav.myCampaigns') },
      { key: 'donations', label: t('nav.donations') },
      { key: 'notifications', label: t('nav.notifications') },
      { key: 'settings', label: t('nav.settings') },
    ],
    [t],
  );

  const isHome = props.variant === 'home';

  return (
    <div className="min-h-screen pb-36">
      <main className="mx-auto max-w-2xl px-4 pt-6">{props.children}</main>

      {/* Fixed bottom cluster: same outer margin (px-4 / bottom-4) as `main`, and the
          same gap (gap-4) between the button row and the nav bar below it. */}
      <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex max-w-2xl flex-col gap-4 px-4">
        <div className="flex items-center justify-between">
          <CornerButton
            label={isHome ? t('nav.profile') : t('nav.home')}
            icon={isHome ? <ProfileIcon /> : <HomeIcon />}
            onClick={() => navigate(isHome ? '/profile' : '/')}
          />
          <CornerButton
            label={isHome ? t('donation.browse') : t('campaign.create')}
            icon={<PlusIcon />}
            onClick={() => navigate(isHome ? '/donate' : '/campaigns/new')}
          />
        </div>

        {isHome ? (
          <FloatingToggleBar
            options={homeOptions}
            activeKey={props.filter}
            onChange={(key) => props.onFilterChange(key as HomeFilter)}
            onSearch={props.onSearch}
          />
        ) : (
          <FloatingToggleBar
            options={profileOptions}
            activeKey={props.tab}
            onChange={(key) => props.onTabChange(key as ProfileTab)}
            onSearch={props.onSearch}
          />
        )}
      </div>
    </div>
  );
}
