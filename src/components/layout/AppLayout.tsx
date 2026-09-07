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
    <div className="min-h-screen pb-28">
      <main className="mx-auto max-w-2xl px-4 pt-6">{props.children}</main>

      <CornerButton
        side="left"
        label={isHome ? t('nav.profile') : t('nav.home')}
        icon={isHome ? <ProfileIcon /> : <HomeIcon />}
        onClick={() => navigate(isHome ? '/profile' : '/')}
      />

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

      <CornerButton
        side="right"
        label={isHome ? t('donation.browse') : t('campaign.create')}
        icon={<PlusIcon />}
        onClick={() => navigate(isHome ? '/donate' : '/campaigns/new')}
      />
    </div>
  );
}
